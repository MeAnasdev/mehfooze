"""
POST /api/route — route AQI colour strip + flood-risk flags (Travel Mode).
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.routing import build_route_overlay

router = APIRouter(tags=["travel"])


class RouteRequest(BaseModel):
    origin: str
    destination: str


class RouteSegmentOut(BaseModel):
    segmentId:   str
    zoneId:      str
    aqiEstimate: float
    aqiNote:     str
    floodRisk:   bool
    checklist:   list[str]


@router.post("/route", response_model=list[RouteSegmentOut])
def route_overlay(body: RouteRequest, db: Session = Depends(get_db)):
    """
    Accepts an origin and destination (plain text address or 'lat,lng' string).
    Returns per-segment AQI estimates (from real DB readings) and flood-risk flags.
    AQI values are labelled as nearest-station approximations.
    """
    segments = build_route_overlay(body.origin, body.destination, db)
    return segments
