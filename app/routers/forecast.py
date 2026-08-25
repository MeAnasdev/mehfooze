"""
GET /api/forecast/{zone} — 24–72h AQI forecast for a zone.
"""

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.forecaster import get_forecast

router = APIRouter(tags=["forecast"])


class ForecastPoint(BaseModel):
    hour: int   # hours from now
    aqi: float


@router.get("/forecast/{zone}", response_model=list[ForecastPoint])
def forecast_zone(
    zone: str = Path(..., description="Zone ID, e.g. 'gulberg'"),
    db: Session = Depends(get_db),
):
    """Return hourly AQI forecasts for the requested zone (24–72h ahead)."""
    return get_forecast(zone, db)
