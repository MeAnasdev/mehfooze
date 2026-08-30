"""
GET /api/advisory/{profile} — real-time plain-language advisory per user profile.
Profiles: citizen | parent | patient | worker | school

AQI is read from the DB (latest reading). Falls back to live Open-Meteo if DB is empty.
"""

from fastapi import APIRouter, Path, Depends
from pydantic import BaseModel
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.advisory import build_advisory, aqi_category, aqi_colour

router = APIRouter(tags=["advisory"])

VALID_PROFILES = {"citizen", "parent", "patient", "worker", "school"}


class AdvisoryOut(BaseModel):
    profile: str
    message: str
    actions: list[str]
    aqi: float
    aqiCategory: str
    aqiColour: str
    generatedAt: str


@router.get("/advisory/{profile}", response_model=AdvisoryOut)
def get_advisory(
    profile: str = Path(..., description="User profile: citizen | parent | patient | worker | school"),
    db: Session = Depends(get_db),
):
    """Return a role-specific plain-language advisory based on the current live AQI."""
    if profile not in VALID_PROFILES:
        profile = "citizen"

    result = build_advisory(profile, db)

    return AdvisoryOut(
        profile=     profile,
        message=     result["message"],
        actions=     result["actions"],
        aqi=         result["aqi"],
        aqiCategory= aqi_category(result["aqi"]),
        aqiColour=   aqi_colour(result["aqi"]),
        generatedAt= datetime.now(timezone.utc).isoformat(),
    )
