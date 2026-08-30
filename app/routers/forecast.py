"""
GET /api/forecast/{zone} — 24–72h AQI forecast for a Lahore zone.

Model priority:
  1. Open-Meteo CAMS native hourly forecast (always available, no key)
  2. Prophet ML model trained on historical DB data (when >= 168 rows exist)
  3. Physical inversion baseline (ultimate fallback)
"""

from fastapi import APIRouter, Depends, Path, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.forecaster import get_forecast, seed_historical_data

router = APIRouter(tags=["forecast"])

VALID_ZONES = {"gulberg", "johar-town", "shahdara", "model-town", "defence"}


class ForecastPoint(BaseModel):
    hour:   int    # hours from now (1, 2, … 72)
    aqi:    float
    source: str    # which model produced this point


@router.get("/forecast/{zone}", response_model=list[ForecastPoint])
def forecast_zone(
    zone: str = Path(..., description="Zone ID: gulberg | johar-town | shahdara | model-town | defence"),
    db: Session = Depends(get_db),
):
    """Return hourly AQI forecasts for the requested zone (up to 72 hours ahead)."""
    if zone not in VALID_ZONES:
        zone = "gulberg"  # graceful fallback to city centre

    points = get_forecast(zone, db)
    if not points:
        raise HTTPException(
            status_code=503,
            detail=f"Forecast unavailable for zone '{zone}'. Try again shortly."
        )
    return points


@router.post("/forecast/{zone}/seed", tags=["ops"])
def seed_zone_history(
    zone: str = Path(..., description="Zone ID to seed with historical data"),
    db: Session = Depends(get_db),
):
    """
    One-time endpoint: pulls 9 months of Open-Meteo historical data and writes to DB.
    Call once per zone to bootstrap Prophet training data.
    """
    if zone not in VALID_ZONES:
        raise HTTPException(status_code=400, detail=f"Unknown zone: {zone}")

    count = seed_historical_data(zone, db)
    return {"zone": zone, "rows_inserted": count}
