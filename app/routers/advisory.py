"""
GET /api/advisory/{profile} — real-time, zone-aware plain-language advisory.
Profiles: citizen | parent | patient | commuter | student

If a `zone` query param is supplied, the advisory reflects that zone's CURRENT
air quality (local, rain-aware). Otherwise it uses the citywide worst-case.
AQI is read from the DB; falls back to live Open-Meteo if the DB is empty.
"""

from fastapi import APIRouter, Path, Query, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.advisory import build_advisory, aqi_category, aqi_colour

router = APIRouter(tags=["advisory"])

VALID_PROFILES = {"citizen", "parent", "patient", "commuter", "student"}


class AdvisoryOut(BaseModel):
    profile: str
    message: str
    actions: list[str]
    aqi: float
    aqiCategory: str
    aqiColour: str
    zone: str | None
    scope: str            # "zone" (local) or "city" (citywide worst-case)
    generatedAt: str


@router.get("/advisory/{profile}", response_model=AdvisoryOut)
def get_advisory(
    profile: str = Path(..., description="User profile: citizen | parent | patient | commuter | student"),
    zone: str | None = Query(None, description="Optional zone id for local (rain-aware) advisory"),
    db: Session = Depends(get_db),
):
    """Return a role-specific plain-language advisory based on current live AQI.

    - With ?zone=gulberg → advisory reflects that zone's current air (local).
    - Without zone → advisory uses the citywide worst-case reading.
    """
    if profile not in VALID_PROFILES:
        profile = "citizen"

    result = build_advisory(profile, db, zone_id=zone)

    return AdvisoryOut(
        profile=     profile,
        message=     result["message"],
        actions=     result["actions"],
        aqi=         result["aqi"],
        aqiCategory= aqi_category(result["aqi"]),
        aqiColour=   aqi_colour(result["aqi"]),
        zone=        zone,
        scope=       "zone" if zone else "city",
        generatedAt= datetime.now(timezone.utc).isoformat(),
    )
