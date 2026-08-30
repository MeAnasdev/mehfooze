"""
GET /api/rankings — global city AQI rankings from AQICN.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ranking import fetch_global_rankings

router = APIRouter(tags=["rankings"])


class CityRankingOut(BaseModel):
    rank: int
    city: str
    country: str
    flag: str
    aqi: int


@router.get("/rankings", response_model=list[CityRankingOut])
def rankings():
    """Global city AQI rankings — sorted worst-first."""
    return fetch_global_rankings()
