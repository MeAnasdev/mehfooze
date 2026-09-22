"""
Pollution report service — the accountability engine.

When a citizen submits a report, this service:
  1. Finds the nearest monitoring zone and its current AQI.
  2. Corroborates: is the nearby air actually elevated? (sensor evidence)
  3. Checks wind direction: is a documented industrial zone UPWIND? (likely source)
  4. De-duplicates against recent nearby reports of the same type.
  5. Produces an honest, human-readable corroboration summary.

HONESTY RULE: attribution is always "likely" / "consistent with" — never proof.
"""

import math
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

try:
    from app.models.reading import AqiReading
    from app.models.report import PollutionReport
    from app.services.ingest import LAHORE_ZONES
    from app.data.industrial_zones import INDUSTRIAL_ZONES, SOURCE_ATTRIBUTION
except ModuleNotFoundError:
    from models.reading import AqiReading
    from models.report import PollutionReport
    from services.ingest import LAHORE_ZONES
    from data.industrial_zones import INDUSTRIAL_ZONES, SOURCE_ATTRIBUTION

logger = logging.getLogger(__name__)

# AQI above this at the nearest sensor counts as "corroborated by sensor"
_CORROBORATION_AQI_THRESHOLD = 100
# Distance (km) within which a report is considered a duplicate of a recent one
_DEDUP_RADIUS_KM = 0.5
# How recent (hours) a nearby report must be to count as a duplicate
_DEDUP_WINDOW_HOURS = 6
# Half-angle (degrees) of the "upwind cone" for source attribution
_UPWIND_CONE_DEG = 45


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compass bearing FROM point 1 TO point 2, in degrees (0=N, 90=E)."""
    dlng = math.radians(lng2 - lng1)
    y = math.sin(dlng) * math.cos(math.radians(lat2))
    x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2))
         - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlng))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _nearest_zone(lat: float, lng: float) -> dict:
    """Return the nearest Lahore monitoring zone dict."""
    return min(LAHORE_ZONES, key=lambda z: _haversine_km(lat, lng, z["lat"], z["lng"]))


def _zone_current_aqi(zone_id: str, db: Session) -> float | None:
    reading = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id)
        .order_by(AqiReading.recorded_at.desc())
        .first()
    )
    return float(reading.aqi) if reading else None


def _zone_wind_direction(zone_id: str, db: Session) -> float | None:
    """Latest persisted wind direction (degrees, direction wind comes FROM) for
    the zone. Returns None if unavailable, in which case source attribution
    falls back to proximity only (no directional claim)."""
    reading = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id)
        .order_by(AqiReading.recorded_at.desc())
        .first()
    )
    if reading is not None and reading.wind_direction is not None:
        return float(reading.wind_direction)
    return None


def _find_likely_source(lat: float, lng: float, wind_dir: float | None) -> dict | None:
    """
    Find a documented industrial zone that is UPWIND of the report location.

    If wind is blowing FROM bearing `wind_dir` (meteorological convention:
    wind_dir is the direction the wind comes FROM), then a source is "upwind"
    if it lies roughly in that direction from the report point.

    Returns the industrial zone dict (with distance_km) or None.
    """
    candidates = []
    for zone in INDUSTRIAL_ZONES:
        dist = _haversine_km(lat, lng, zone["lat"], zone["lng"])
        if dist > 25:  # too far to plausibly be the local source
            continue
        bearing_to_source = _bearing_deg(lat, lng, zone["lat"], zone["lng"])
        if wind_dir is None:
            # Without wind data we can only note proximity, not direction.
            candidates.append({**zone, "distance_km": round(dist, 1), "upwind": False})
        else:
            diff = abs((bearing_to_source - wind_dir + 180) % 360 - 180)
            if diff <= _UPWIND_CONE_DEG:
                candidates.append({**zone, "distance_km": round(dist, 1), "upwind": True})

    if not candidates:
        return None
    # Prefer upwind matches, then nearest
    candidates.sort(key=lambda c: (not c["upwind"], c["distance_km"]))
    return candidates[0]


def _is_duplicate(lat: float, lng: float, report_type: str, db: Session) -> bool:
    """True if a similar report exists nearby within the dedup window."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=_DEDUP_WINDOW_HOURS)
    recent = (
        db.query(PollutionReport)
        .filter(
            PollutionReport.report_type == report_type,
            PollutionReport.created_at >= cutoff,
        )
        .all()
    )
    for r in recent:
        if _haversine_km(lat, lng, r.lat, r.lng) <= _DEDUP_RADIUS_KM:
            return True
    return False


def corroborate(lat: float, lng: float, report_type: str, db: Session) -> dict:
    """
    Run the full corroboration pipeline for a report location.
    Returns a dict of corroboration fields to store on the report.
    """
    zone = _nearest_zone(lat, lng)
    zone_id = zone["id"]
    aqi = _zone_current_aqi(zone_id, db)
    wind_dir = _zone_wind_direction(zone_id, db)

    sensor_corroborated = bool(aqi is not None and aqi >= _CORROBORATION_AQI_THRESHOLD)
    likely = _find_likely_source(lat, lng, wind_dir)
    is_dup = _is_duplicate(lat, lng, report_type, db)

    # Build honest, human-readable summary
    parts = []
    if sensor_corroborated and aqi is not None:
        parts.append(f"Corroborated by nearby sensor ({zone['name']} AQI {round(aqi)}).")
    elif aqi is not None:
        parts.append(f"Nearest sensor ({zone['name']}) reads AQI {round(aqi)} — not yet elevated.")
    else:
        parts.append("No nearby sensor reading available to corroborate.")

    if likely:
        if likely.get("upwind"):
            parts.append(
                f"Consistent with emissions from {likely['name']} "
                f"(~{likely['distance_km']} km upwind; source: {SOURCE_ATTRIBUTION})."
            )
        else:
            parts.append(
                f"Near documented industrial area: {likely['name']} "
                f"(~{likely['distance_km']} km; source: {SOURCE_ATTRIBUTION})."
            )

    if is_dup:
        parts.append("Similar recent report exists nearby — grouped for review.")

    return {
        "nearest_zone":        zone_id,
        "nearest_aqi":         aqi,
        "sensor_corroborated": sensor_corroborated,
        "likely_source":       likely["name"] if likely else None,
        "corroboration_note":  " ".join(parts),
        "is_duplicate":        is_dup,
    }
