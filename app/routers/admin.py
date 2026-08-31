"""
Admin endpoints — content management, data source health, and system stats.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reading import AqiReading
from app.models.zone import Zone
from app.models.notification import FcmToken
from app.models.hazard import HazardAlert
from app.models.content import Content
from app.services.ingest import LAHORE_ZONES

router = APIRouter(tags=["admin"])


class SystemStats(BaseModel):
    totalZones: int
    totalReadings: int
    latestReadingTime: str | None
    totalTokens: int
    totalAlerts: int
    recentAlerts: int
    dataSources: list[dict]


class DataHealth(BaseModel):
    zone: str
    lastFetch: str | None
    readingCount: int
    status: str


@router.get("/admin/stats", response_model=SystemStats)
def get_stats(db: Session = Depends(get_db)):
    total_zones = db.query(Zone).count()
    total_readings = db.query(AqiReading).count()
    latest = db.query(AqiReading).order_by(AqiReading.recorded_at.desc()).first()
    total_tokens = db.query(FcmToken).count()
    total_alerts = db.query(HazardAlert).count()
    one_day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_alerts = db.query(HazardAlert).filter(HazardAlert.created_at >= one_day_ago).count()

    return SystemStats(
        totalZones=total_zones,
        totalReadings=total_readings,
        latestReadingTime=latest.recorded_at.isoformat() if latest else None,
        totalTokens=total_tokens,
        totalAlerts=total_alerts,
        recentAlerts=recent_alerts,
        dataSources=[
            {"name": "Open-Meteo CAMS", "status": "active", "type": "primary"},
            {"name": "AQICN", "status": "optional", "type": "secondary"},
        ],
    )


@router.get("/admin/health", response_model=list[DataHealth])
def get_data_health(db: Session = Depends(get_db)):
    results = []
    for zone in LAHORE_ZONES:
        reading = (
            db.query(AqiReading)
            .filter(AqiReading.zone_id == zone["id"])
            .order_by(AqiReading.recorded_at.desc())
            .first()
        )
        count = db.query(AqiReading).filter(AqiReading.zone_id == zone["id"]).count()
        if reading:
            age_hours = (datetime.now(timezone.utc) - reading.recorded_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
            status = "healthy" if age_hours < 2 else "stale" if age_hours < 6 else "offline"
        else:
            status = "no_data"
        results.append(DataHealth(
            zone=zone["name"],
            lastFetch=reading.recorded_at.isoformat() if reading else None,
            readingCount=count,
            status=status,
        ))
    return results


class ContentItem(BaseModel):
    id: str
    title: str
    category: str
    body: str
    active: bool = True


# Seed default content if table is empty
_DEFAULT_CONTENT = [
    {"id": "1", "title": "What is PM2.5?", "category": "education", "body": "Fine particulate matter smaller than 2.5 micrometers..."},
    {"id": "2", "title": "How to wear an N95 mask", "category": "education", "body": "Ensure a tight seal around nose and mouth..."},
    {"id": "3", "title": "Air purifier guide", "category": "education", "body": "Choose a purifier with HEPA filter for best results..."},
]


def _seed_content(db: Session):
    if db.query(Content).count() == 0:
        for item in _DEFAULT_CONTENT:
            db.add(Content(**item))
        db.commit()


@router.get("/admin/content", response_model=list[ContentItem])
def list_content(db: Session = Depends(get_db)):
    _seed_content(db)
    rows = db.query(Content).order_by(Content.created_at).all()
    return [ContentItem(id=r.id, title=r.title, category=r.category, body=r.body, active=r.active) for r in rows]


@router.post("/admin/content", response_model=ContentItem)
def create_content(item: ContentItem, db: Session = Depends(get_db)):
    existing = db.query(Content).filter(Content.id == item.id).first()
    if existing:
        existing.title = item.title
        existing.category = item.category
        existing.body = item.body
        existing.active = item.active
    else:
        db.add(Content(id=item.id or str(uuid.uuid4())[:8], title=item.title, category=item.category, body=item.body, active=item.active))
    db.commit()
    return item
