"""
GET /api/pois — nearby fuel stations and parking from Overpass API.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.pois import nearby_pois

router = APIRouter(tags=["pois"])


class PoiOut(BaseModel):
    name: str
    lat: float
    lng: float
    type: str
    distance: int


@router.get("/pois", response_model=list[PoiOut])
def get_pois(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    type: str = Query("fuel", description="POI type: fuel or parking"),
    radius: int = Query(3000, description="Search radius in meters"),
):
    """Nearby fuel stations or parking lots from OpenStreetMap."""
    return nearby_pois(lat, lng, radius, type)
