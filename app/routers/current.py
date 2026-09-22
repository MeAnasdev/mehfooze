"""
GET /api/current — live AQI + weather for all Lahore monitoring zones.
Data source: Open-Meteo CAMS Air Quality (free, no key required).
Optional blend with AQICN station data when AQICN_TOKEN is configured.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.ingest import fetch_live_aqi, fetch_aqicn_stations_in_bounds
from app.services.attribution import attribute_zone
from app.services.satellite import get_satellite_overlay

router = APIRouter(tags=["aqi"])


class ZoneReadingOut(BaseModel):
    stationId:     str
    name:          str
    lat:           float
    lng:           float
    aqi:           float
    pm25:          float
    pm10:          float = 0
    o3:            float = 0
    no2:           float = 0
    co:            float = 0
    so2:           float = 0
    temperature:   float
    humidity:      float
    wind_speed:    float
    precipitation: float = 0
    windDirection: float = 0
    raining:       bool = False
    varianceFlag:  bool = False
    updatedAt:     str
    source:        str

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


@router.get("/attribution/{zone_id}")
def get_attribution(zone_id: str, db: Session = Depends(get_db)):
    """
    Source attribution for a zone's current pollution.

    When AQI is elevated and a documented industrial area lies upwind, returns a
    'likely source' with an honest confidence level ('likely' / 'possible').
    Never claims proof. Data: EPA Punjab / Urban Unit 2025.
    """
    return attribute_zone(zone_id, db)


@router.get("/stations")
def get_stations(
    lat1: float = 31.2, lng1: float = 74.0,
    lat2: float = 31.8, lng2: float = 74.6,
):
    """
    All real AQICN monitoring stations within a bounding box (default: Lahore
    region). Powers the dense heatmap-style station map. Requires AQICN token;
    returns [] gracefully otherwise.
    """
    return fetch_aqicn_stations_in_bounds(lat1, lng1, lat2, lng2)


@router.get("/satellite")
def get_satellite():
    """
    Sentinel-5P (TROPOMI) regional NO2 estimate per zone.

    Real ESA/Copernicus satellite data via Sentinel Hub. Daily cadence,
    ~5.5km resolution — regional, not per-facility. Degrades gracefully
    (available=false) if Sentinel Hub credentials are not configured.
    """
    return get_satellite_overlay()
