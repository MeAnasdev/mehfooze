"""
GET /api/current — live AQI + weather for all Lahore monitoring zones.
Data source: Open-Meteo CAMS Air Quality (free, no key required).
Optional blend with AQICN station data when AQICN_TOKEN is configured.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.ingest import fetch_live_aqi

router = APIRouter(tags=["aqi"])


class ZoneReadingOut(BaseModel):
    stationId:   str
    name:        str
    lat:         float
    lng:         float
    aqi:         float
    pm25:        float
    pm10:        float = 0
    o3:          float = 0
    no2:         float = 0
    co:          float = 0
    so2:         float = 0
    temperature: float
    humidity:    float
    wind_speed:  float
    updatedAt:   str
    source:      str

    model_config = {"from_attributes": True}


@router.get("/current", response_model=list[ZoneReadingOut])
def get_current(db: Session = Depends(get_db)):
    """
    Return the latest AQI + weather reading for every monitored Lahore zone.

    - aqi: US AQI index (0–500)
    - pm25: PM2.5 concentration µg/m³
    - temperature: °C
    - humidity: %
    - wind_speed: km/h
    - source: data source used (Open-Meteo CAMS / Open-Meteo CAMS + AQICN / cached)
    """
    readings = fetch_live_aqi(db)
    if not readings:
        raise HTTPException(
            status_code=503,
            detail="Live AQI data is temporarily unavailable. Please try again shortly."
        )
    return readings
