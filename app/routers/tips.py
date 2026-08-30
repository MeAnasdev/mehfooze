"""
GET /api/tips — proactive tips from Rio based on time + AQI + profile.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.tips import get_tip

router = APIRouter(tags=["tips"])


class TipOut(BaseModel):
    tip: str
    period: str
    aqiTier: str
    aqi: float
    profile: str
    generatedAt: str


@router.get("/tips", response_model=TipOut)
def get_proactive_tip(
    profile: str = Query("citizen", description="User profile: citizen, parent, patient, worker"),
    aqi: float = Query(50, description="Current AQI reading"),
    db: Session = Depends(get_db),
):
    """Get a proactive tip from Rio based on time of day, AQI, and user profile."""
    return get_tip(profile=profile, aqi=aqi)
