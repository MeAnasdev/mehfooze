"""
Citizen pollution reporting endpoints.

  POST /api/reports              — submit a pollution report (runs corroboration)
  GET  /api/reports/mine         — a citizen's own reports + status
  GET  /api/reports              — all reports (government queue; used by gov dashboard)
  PATCH /api/reports/{id}/status — update case status (government action)

Photos are uploaded to Firebase Storage client-side; the resulting URL is
passed in `photo_url`. The backend never handles the raw image bytes.
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.report import PollutionReport
from app.services.reports import corroborate
from app.services.image_review import assess_report_for_review

logger = logging.getLogger(__name__)
router = APIRouter(tags=["reports"])

VALID_TYPES = {"waste_burning", "industrial_smoke", "construction_dust", "dirty_vehicle", "other"}
VALID_STATUSES = {"submitted", "under_review", "verified", "routed", "resolved", "dismissed"}


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateReportRequest(BaseModel):
    userId:     str
    type:       str = Field(..., description="waste_burning | industrial_smoke | construction_dust | dirty_vehicle | other")
    lat:        float
    lng:        float
    photoUrl:   str | None = None
    note:       str | None = None


class ReportOut(BaseModel):
    id:                 str
    userId:             str
    type:               str
    lat:                float
    lng:                float
    photoUrl:           str | None
    note:               str | None
    nearestZone:        str | None
    nearestAqi:         float | None
    sensorCorroborated: bool
    likelySource:       str | None
    corroborationNote:  str | None
    status:             str
    routedTo:           str | None
    resolutionNote:     str | None
    createdAt:          str
    updatedAt:          str


class UpdateStatusRequest(BaseModel):
    status:         str
    routedTo:       str | None = None
    resolutionNote: str | None = None


def _to_out(r: PollutionReport) -> ReportOut:
    return ReportOut(
        id=                 r.id,
        userId=             r.user_id,
        type=               r.report_type,
        lat=                r.lat,
        lng=                r.lng,
        photoUrl=           r.photo_url,
        note=               r.note,
        nearestZone=        r.nearest_zone,
        nearestAqi=         r.nearest_aqi,
        sensorCorroborated= r.sensor_corroborated,
        likelySource=       r.likely_source,
        corroborationNote=  r.corroboration_note,
        status=             r.status,
        routedTo=           r.routed_to,
        resolutionNote=     r.resolution_note,
        createdAt=          r.created_at.isoformat() if r.created_at else "",
        updatedAt=          r.updated_at.isoformat() if r.updated_at else "",
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/reports", response_model=ReportOut)
def create_report(req: CreateReportRequest, db: Session = Depends(get_db)):
    """Submit a pollution report. Runs sensor + wind + de-dup corroboration."""
    report_type = req.type if req.type in VALID_TYPES else "other"
    if not req.userId:
        raise HTTPException(status_code=400, detail="userId is required.")

    corr = corroborate(req.lat, req.lng, report_type, db)

    report_id = str(uuid.uuid4())[:12]
    now = datetime.now(timezone.utc)
    report = PollutionReport(
        id=                  report_id,
        user_id=             req.userId,
        report_type=         report_type,
        lat=                 req.lat,
        lng=                 req.lng,
        photo_url=           req.photoUrl,
        note=                req.note,
        nearest_zone=        corr["nearest_zone"],
        nearest_aqi=         corr["nearest_aqi"],
        sensor_corroborated= corr["sensor_corroborated"],
        likely_source=       corr["likely_source"],
        corroboration_note=  corr["corroboration_note"],
        status=              "submitted",
        created_at=          now,
        updated_at=          now,
    )
    db.add(report)
    db.commit()
    logger.info("Pollution report %s created (type=%s, corroborated=%s)",
                report_id, report_type, corr["sensor_corroborated"])
    return _to_out(report)


@router.get("/reports/mine", response_model=list[ReportOut])
def my_reports(userId: str = Query(..., description="Firebase UID"), db: Session = Depends(get_db)):
    """Return the reports submitted by a specific citizen, newest first."""
    rows = (
        db.query(PollutionReport)
        .filter(PollutionReport.user_id == userId)
        .order_by(PollutionReport.created_at.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


@router.get("/reports", response_model=list[ReportOut])
def all_reports(
    status: str | None = Query(None, description="Filter by status"),
    zone: str | None = Query(None, description="Filter by nearest zone"),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
):
    """Return all reports (government queue). Optional status/zone filters."""
    q = db.query(PollutionReport)
    if status and status in VALID_STATUSES:
        q = q.filter(PollutionReport.status == status)
    if zone:
        q = q.filter(PollutionReport.nearest_zone == zone)
    rows = q.order_by(PollutionReport.created_at.desc()).limit(limit).all()
    return [_to_out(r) for r in rows]


@router.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_status(report_id: str, req: UpdateStatusRequest, db: Session = Depends(get_db)):
    """Update a report's case status (government action: review/route/resolve)."""
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {sorted(VALID_STATUSES)}")
    report = db.query(PollutionReport).filter(PollutionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    report.status = req.status
    if req.routedTo is not None:
        report.routed_to = req.routedTo
    if req.resolutionNote is not None:
        report.resolution_note = req.resolutionNote
    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _to_out(report)


@router.get("/reports/{report_id}/trend")
def report_trend(report_id: str, db: Session = Depends(get_db)):
    """
    Before/after AQI trend for a report's zone — accountability through data.

    Returns hourly AQI for the report's nearest zone from 48h before creation
    to now, so officials can see whether air quality improved after intervention.
    """
    from app.models.reading import AqiReading

    report = db.query(PollutionReport).filter(PollutionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    zone_id = report.nearest_zone
    if not zone_id:
        return {"reportId": report_id, "zone": None, "before": [], "after": [], "note": "No zone associated."}

    created = report.created_at
    window_start = created - timedelta(hours=48)

    rows = (
        db.query(AqiReading)
        .filter(
            AqiReading.zone_id == zone_id,
            AqiReading.recorded_at >= window_start,
        )
        .order_by(AqiReading.recorded_at.asc())
        .all()
    )

    before = [{"t": r.recorded_at.isoformat(), "aqi": r.aqi} for r in rows if r.recorded_at <= created]
    after  = [{"t": r.recorded_at.isoformat(), "aqi": r.aqi} for r in rows if r.recorded_at > created]

    before_avg = round(sum(p["aqi"] for p in before) / len(before), 1) if before else None
    after_avg  = round(sum(p["aqi"] for p in after) / len(after), 1) if after else None

    improved = (before_avg is not None and after_avg is not None and after_avg < before_avg)

    return {
        "reportId":  report_id,
        "zone":      zone_id,
        "createdAt": created.isoformat(),
        "before":    before,
        "after":     after,
        "beforeAvg": before_avg,
        "afterAvg":  after_avg,
        "improved":  improved,
        "note":      "AQI trend for the report's zone, 48h before creation vs after.",
    }


@router.get("/reports/{report_id}/review")
def report_review(report_id: str, db: Session = Depends(get_db)):
    """
    EXPERIMENTAL triage assessment for a report — helps officials prioritise
    which reports to review first. Always recommends a human makes the final
    call. Does NOT verify the photo's contents.
    """
    report = db.query(PollutionReport).filter(PollutionReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return assess_report_for_review(report)


@router.get("/reports/stats")
def report_stats(db: Session = Depends(get_db)):
    """Aggregate report counts by type and status (for government dashboard)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    rows = db.query(PollutionReport).filter(PollutionReport.created_at >= cutoff).all()

    by_type: dict[str, int] = {}
    by_status: dict[str, int] = {}
    by_zone: dict[str, int] = {}
    for r in rows:
        by_type[r.report_type] = by_type.get(r.report_type, 0) + 1
        by_status[r.status] = by_status.get(r.status, 0) + 1
        if r.nearest_zone:
            by_zone[r.nearest_zone] = by_zone.get(r.nearest_zone, 0) + 1

    return {
        "total": len(rows),
        "byType": by_type,
        "byStatus": by_status,
        "byZone": by_zone,
        "windowDays": 30,
    }
