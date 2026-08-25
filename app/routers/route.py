"""
POST /api/route — route AQI colour strip + flood-risk flags (Travel Mode).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.routing import build_route_overlay

router = APIRouter(tags=["travel"])


class RouteRequest(BaseModel):
    origin: str
    destination: str


class RouteSegmentOut(BaseModel):
    segmentId: str
    aqiEstimate: float
    floodRisk: bool
    checklist: list[str]


@router.post("/route", response_model=list[RouteSegmentOut])
def route_overlay(body: RouteRequest):
    """
    Accepts an origin and destination (plain text or lat/lng string),
    returns per-segment AQI estimates and flood-risk flags.
    Estimates labelled as nearest-station approximations.
    """
    segments = build_route_overlay(body.origin, body.destination)
    return segments
