"""
Routing service — Travel Mode.

Takes an origin + destination, calls Google Directions API (or OSRM fallback),
splits the route into segments, maps each to the nearest forecast zone,
and returns AQI estimates + flood-risk flags + a rule-based safety checklist.

All estimates are explicitly labelled as nearest-station approximations.
"""

import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Known flood-prone zone IDs (coarse flag — not a hydrological simulation)
FLOOD_PRONE_ZONES = {"shahdara", "data-darbar", "badami-bagh"}


def build_route_overlay(origin: str, destination: str) -> list[dict]:
    """
    Return per-segment route data with AQI estimates and flood-risk flags.
    Falls back to a simple two-segment mock if the routing API is unavailable.
    """
    try:
        if settings.google_maps_api_key:
            segments = _google_route(origin, destination)
        else:
            segments = _osrm_route(origin, destination)
    except Exception as exc:
        logger.warning("Routing API failed: %s — using mock segments", exc)
        segments = _mock_segments(origin, destination)

    return [_enrich_segment(seg) for seg in segments]


def _google_route(origin: str, destination: str) -> list[dict]:
    """Call Google Directions API and return raw segment list."""
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": origin,
        "destination": destination,
        "key": settings.google_maps_api_key,
    }
    resp = httpx.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    steps = data["routes"][0]["legs"][0]["steps"]
    return [
        {
            "segmentId": f"seg-{i}",
            "lat": step["end_location"]["lat"],
            "lng": step["end_location"]["lng"],
        }
        for i, step in enumerate(steps)
    ]


def _osrm_route(origin: str, destination: str) -> list[dict]:
    """OSRM / OpenStreetMap fallback for routing."""
    # Minimal OSRM call — in production parse coordinates from place names first
    logger.info("Using OSRM for routing (no Google key configured).")
    return _mock_segments(origin, destination)


def _mock_segments(origin: str, destination: str) -> list[dict]:
    """Demo segments used when no routing API is available."""
    return [
        {"segmentId": "seg-0", "lat": 31.5204, "lng": 74.3587},
        {"segmentId": "seg-1", "lat": 31.5500, "lng": 74.3200},
    ]


def _enrich_segment(seg: dict) -> dict:
    """
    Map a route segment to the nearest zone, attach AQI estimate,
    flood-risk flag, and rule-based safety checklist.
    """
    zone_id = _nearest_zone(seg["lat"], seg["lng"])
    aqi = _zone_aqi(zone_id)
    flood_risk = zone_id in FLOOD_PRONE_ZONES

    checklist = _build_checklist(aqi, flood_risk)

    return {
        "segmentId": seg["segmentId"],
        "aqiEstimate": aqi,
        "floodRisk": flood_risk,
        "checklist": checklist,
    }


def _nearest_zone(lat: float, lng: float) -> str:
    """
    Very simple nearest-zone lookup by Euclidean distance.
    Replace with a proper spatial query (PostGIS) in production.
    """
    import math

    ZONES = [
        ("gulberg",    31.5204, 74.3587),
        ("johar-town", 31.4681, 74.2735),
        ("shahdara",   31.6103, 74.3294),
    ]
    nearest = min(ZONES, key=lambda z: math.hypot(z[1] - lat, z[2] - lng))
    return nearest[0]


def _zone_aqi(zone_id: str) -> float:
    """
    Placeholder — returns the latest cached AQI for the zone.
    In production: query the DB or in-memory cache.
    """
    # TODO: replace with a real cache lookup
    MOCK = {"gulberg": 135.0, "johar-town": 110.0, "shahdara": 160.0}
    return MOCK.get(zone_id, 120.0)


def _build_checklist(aqi: float, flood_risk: bool) -> list[str]:
    """Rule-based safety checklist from route conditions."""
    items: list[str] = []

    if aqi > 150:
        items.append("AQI unhealthy on this route — N95 mask recommended.")
    elif aqi > 100:
        items.append("AQI moderate — basic dust mask advised for prolonged exposure.")

    if flood_risk:
        items.append("⚠ Flood-prone segment ahead — consider an alternate route.")
        items.append("Allow extra travel time if it has rained recently.")

    if not items:
        items.append("Route looks clear — no special precautions needed.")

    return items
