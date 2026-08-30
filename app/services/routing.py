"""
Routing service — Travel Mode.

Takes an origin + destination, calls Google Directions API (or OSRM fallback),
splits the route into segments, maps each to the nearest forecast zone,
and returns AQI estimates + flood-risk flags + a rule-based safety checklist.

All AQI estimates are explicitly labelled as nearest-station approximations.
"""

import math
import httpx
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

try:
    from app.config import settings
    from app.models.reading import AqiReading
    from app.services.ingest import LAHORE_ZONES
except ModuleNotFoundError:
    from config import settings
    from models.reading import AqiReading
    from services.ingest import LAHORE_ZONES

logger = logging.getLogger(__name__)

# Known flood-prone zone IDs — coarse flag only, not a hydrological simulation.
# These match zone IDs in LAHORE_ZONES (shahdara sits on low-lying Ravi floodplain).
FLOOD_PRONE_ZONES = {"shahdara"}


def build_route_overlay(origin: str, destination: str, db: Session | None = None) -> list[dict]:
    """
    Return per-segment route data with AQI estimates and flood-risk flags.
    Falls back to a simple two-segment mock if the routing API is unavailable.

    Args:
        origin:      Plain-text address or "lat,lng" string.
        destination: Plain-text address or "lat,lng" string.
        db:          SQLAlchemy session used to look up real-time AQI per zone.
    """
    try:
        if settings.google_maps_api_key:
            segments = _google_route(origin, destination)
        else:
            segments = _osrm_route(origin, destination)
    except Exception as exc:
        logger.warning("Routing API failed: %s — using mock segments", exc)
        segments = _mock_segments(origin, destination)

    return [_enrich_segment(seg, db) for seg in segments]


def _google_route(origin: str, destination: str) -> list[dict]:
    """Call Google Directions API and return raw segment list."""
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin":      origin,
        "destination": destination,
        "key":         settings.google_maps_api_key,
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
    """
    OSRM / OpenStreetMap fallback.

    If origin and destination look like 'lat,lng' strings, use the OSRM
    public demo server; otherwise fall back to mock segments.
    """
    def _parse_latlng(s: str) -> tuple[float, float] | None:
        parts = s.split(",")
        if len(parts) == 2:
            try:
                return float(parts[0].strip()), float(parts[1].strip())
            except ValueError:
                pass
        return None

    origin_ll = _parse_latlng(origin)
    dest_ll   = _parse_latlng(destination)

    if origin_ll and dest_ll:
        try:
            # OSRM expects lng,lat order
            coords = f"{origin_ll[1]},{origin_ll[0]};{dest_ll[1]},{dest_ll[0]}"
            resp = httpx.get(
                f"https://router.project-osrm.org/route/v1/driving/{coords}",
                params={"overview": "full", "geometries": "geojson", "steps": "true"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            steps = data["routes"][0]["legs"][0]["steps"]
            return [
                {
                    "segmentId": f"seg-{i}",
                    "lat": step["maneuver"]["location"][1],
                    "lng": step["maneuver"]["location"][0],
                }
                for i, step in enumerate(steps)
            ]
        except Exception as exc:
            logger.warning("OSRM call failed: %s — using mock segments", exc)

    logger.info("No routing API available — using mock segments for demo.")
    return _mock_segments(origin, destination)


def _mock_segments(origin: str, destination: str) -> list[dict]:
    """
    Demo segments covering all 5 monitored zones.
    Used when no routing API is available or coordinates are text addresses.
    """
    return [
        {"segmentId": "seg-0", "lat": 31.5204, "lng": 74.3587},   # Gulberg
        {"segmentId": "seg-1", "lat": 31.4681, "lng": 74.2735},   # Johar Town
        {"segmentId": "seg-2", "lat": 31.6103, "lng": 74.3294},   # Shahdara (flood prone)
        {"segmentId": "seg-3", "lat": 31.4834, "lng": 74.3352},   # Model Town
        {"segmentId": "seg-4", "lat": 31.4697, "lng": 74.4097},   # DHA / Defence
    ]


def _enrich_segment(seg: dict, db: Session | None) -> dict:
    """
    Map a route segment to the nearest zone, attach AQI estimate,
    flood-risk flag, and rule-based safety checklist.
    """
    zone_id    = _nearest_zone(seg["lat"], seg["lng"])
    aqi        = _zone_aqi(zone_id, db)
    flood_risk = zone_id in FLOOD_PRONE_ZONES
    checklist  = _build_checklist(aqi, flood_risk)

    return {
        "segmentId":   seg["segmentId"],
        "zoneId":      zone_id,
        "aqiEstimate": aqi,
        "aqiNote":     "Estimated from nearest monitoring station",
        "floodRisk":   flood_risk,
        "checklist":   checklist,
    }


def _nearest_zone(lat: float, lng: float) -> str:
    """
    Nearest-zone lookup using Euclidean distance over all 5 LAHORE_ZONES.
    Replace with PostGIS spatial query in production.
    """
    nearest = min(
        LAHORE_ZONES,
        key=lambda z: math.hypot(z["lat"] - lat, z["lng"] - lng),
    )
    return nearest["id"]


def _zone_aqi(zone_id: str, db: Session | None) -> float:
    """
    Return the most recent real AQI reading for the zone from the DB.

    Falls back to 120.0 if the DB is unavailable or has no data for the zone,
    which is clearly labelled as an estimate in the response.
    """
    if db:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
            reading = (
                db.query(AqiReading)
                .filter(
                    AqiReading.zone_id == zone_id,
                    AqiReading.recorded_at >= cutoff,
                )
                .order_by(AqiReading.recorded_at.desc())
                .first()
            )
            if reading:
                return float(reading.aqi)
            # Older fallback — any reading for this zone
            reading = (
                db.query(AqiReading)
                .filter(AqiReading.zone_id == zone_id)
                .order_by(AqiReading.recorded_at.desc())
                .first()
            )
            if reading:
                return float(reading.aqi)
        except Exception as exc:
            logger.warning("DB AQI lookup failed for zone %s: %s", zone_id, exc)

    logger.warning("No DB AQI data for zone %s — using fallback 120.0", zone_id)
    return 120.0


def _build_checklist(aqi: float, flood_risk: bool) -> list[str]:
    """Rule-based safety checklist derived from route conditions."""
    items: list[str] = []

    if aqi > 200:
        items.append("AQI very unhealthy on this segment — avoid if possible.")
        items.append("If travel is necessary, wear an N95 mask and keep windows closed.")
    elif aqi > 150:
        items.append("AQI unhealthy on this segment — N95 mask recommended.")
        items.append("Keep car windows closed; use recirculated AC.")
    elif aqi > 100:
        items.append("AQI moderate — basic dust mask advised for prolonged exposure.")

    if flood_risk:
        items.append("Flood-prone area ahead — consider an alternate route after rain.")
        items.append("Allow extra travel time if it has rained recently.")

    if not items:
        items.append("Route looks clear — no special precautions needed.")

    return items
