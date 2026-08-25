"""
GET /api/current — live AQI for all monitored zones.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.services.ingest import fetch_live_aqi

router = APIRouter(tags=["aqi"])


class ZoneReadingOut(BaseModel):
    stationId: str
    name: str
    lat: float
    lng: float
    aqi: float
    updatedAt: str

    model_config = {"from_attributes": True}


@router.get("/current", response_model=list[ZoneReadingOut])
def get_current(db: Session = Depends(get_db)):
    """Return the latest AQI reading for every monitored zone."""
    readings = fetch_live_aqi(db)
    if not readings:
        raise HTTPException(status_code=503, detail="Live AQI data unavailable.")
    return readings
