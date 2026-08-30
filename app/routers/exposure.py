"""
GET /api/exposure/{zone_id} — 24h exposure summary for a zone.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.exposure import get_24h_exposure

router = APIRouter(tags=["exposure"])


class ExposureHour(BaseModel):
    hour: int
    aqi: float
    pm25: float
    pm10: float = 0
    o3: float = 0
    no2: float = 0
    recordedAt: str


class ExposureOut(BaseModel):
    zoneId: str
    hours: list[ExposureHour]
    averageAqi: float
    peakAqi: float
    totalHours: int


@router.get("/exposure/{zone_id}", response_model=ExposureOut)
def exposure_summary(zone_id: str, db: Session = Depends(get_db)):
    """24h exposure summary for a zone — drives the exposure dial."""
    data = get_24h_exposure(zone_id, db)
    if not data["hours"]:
        raise HTTPException(status_code=404, detail=f"No exposure data for zone '{zone_id}'")
    return data
