"""
Source attribution service.

Given a zone's current pollution + wind direction, determine whether a
documented industrial area lies UPWIND — i.e. whether the pollution is
plausibly drifting from that source.

HONESTY RULE: We only ever say "likely" / "consistent with". Wind + a
documented source is circumstantial evidence, not proof. If wind data is
missing, we make no directional claim.

Wind direction convention (Open-Meteo): `wind_direction` is the compass
bearing the wind is coming FROM. So if wind_direction = 315 (NW), a source
to the NW of the zone is upwind and could be the origin of the pollution.
"""

import math
import logging

from sqlalchemy.orm import Session

try:
    from app.models.reading import AqiReading
    from app.services.ingest import LAHORE_ZONES
    from app.data.industrial_zones import INDUSTRIAL_ZONES, SOURCE_ATTRIBUTION
except ModuleNotFoundError:
    from models.reading import AqiReading
    from services.ingest import LAHORE_ZONES
    from data.industrial_zones import INDUSTRIAL_ZONES, SOURCE_ATTRIBUTION

logger = logging.getLogger(__name__)

# Only attribute when pollution is actually elevated
_ATTRIBUTION_AQI_THRESHOLD = 120
# Half-angle of the upwind cone (degrees)
_UPWIND_CONE_DEG = 45
# Max distance (km) a source can be to be considered the local origin
_MAX_SOURCE_KM = 25

# 8-point compass for human-readable directions
_COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]


def _haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def _bearing_deg(lat1, lng1, lat2, lng2):
    dlng = math.radians(lng2 - lng1)
    y = math.sin(dlng) * math.cos(math.radians(lat2))
    x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2))
         - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlng))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _compass(bearing: float) -> str:
    return _COMPASS[round(bearing / 45) % 8]


def attribute_zone(zone_id: str, db: Session) -> dict:
    """
    Return source attribution for a zone's current pollution.

    Response shape:
      {
        "zone": zone_id,
        "aqi": float | None,
        "attributed": bool,
        "source": str | None,          # documented area name
        "distanceKm": float | None,
        "direction": str | None,       # compass direction of the source
        "windFrom": str | None,        # compass direction wind is coming from
        "confidence": "likely" | "possible" | "none",
        "message": str,                # honest, human-readable
        "attributionSource": str,      # EPA Punjab / Urban Unit 2025
      }
    """
    zone = next((z for z in LAHORE_ZONES if z["id"] == zone_id), None)
    if not zone:
        return _empty(zone_id, "Unknown zone.")

    reading = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id)
        .order_by(AqiReading.recorded_at.desc())
        .first()
    )
    if reading is None:
        return _empty(zone_id, "No recent reading to attribute.")

    aqi = float(reading.aqi)
    wind_dir = float(reading.wind_direction) if reading.wind_direction is not None else None

    if aqi < _ATTRIBUTION_AQI_THRESHOLD:
        return {
            **_empty(zone_id, "Air quality is not elevated — no source attribution needed."),
            "aqi": aqi,
        }

    # Find candidate documented sources
    best = None
    for src in INDUSTRIAL_ZONES:
        dist = _haversine_km(zone["lat"], zone["lng"], src["lat"], src["lng"])
        if dist > _MAX_SOURCE_KM:
            continue
        bearing_to_src = _bearing_deg(zone["lat"], zone["lng"], src["lat"], src["lng"])

        upwind = False
        if wind_dir is not None:
            # Source is upwind if it lies roughly in the direction the wind comes FROM
            diff = abs((bearing_to_src - wind_dir + 180) % 360 - 180)
            upwind = diff <= _UPWIND_CONE_DEG

        cand = {
            "source": src["name"],
            "distanceKm": round(dist, 1),
            "direction": _compass(bearing_to_src),
            "upwind": upwind,
        }
        # Prefer upwind candidates, then nearest
        if best is None or (cand["upwind"] and not best["upwind"]) or \
           (cand["upwind"] == best["upwind"] and cand["distanceKm"] < best["distanceKm"]):
            best = cand

    if best is None:
        return {**_empty(zone_id, "No documented industrial source within range."), "aqi": aqi}

    wind_from = _compass(wind_dir) if wind_dir is not None else None

    if wind_dir is not None and best["upwind"]:
        confidence = "likely"
        message = (
            f"Elevated AQI ({round(aqi)}) is consistent with emissions drifting from "
            f"{best['source']} — ~{best['distanceKm']} km {best['direction']} of this zone, "
            f"with wind coming from the {wind_from}."
        )
    else:
        confidence = "possible"
        message = (
            f"Elevated AQI ({round(aqi)}). Nearest documented industrial area is "
            f"{best['source']} (~{best['distanceKm']} km {best['direction']}). "
            f"Wind direction data is limited, so this is proximity-based only."
        )

    return {
        "zone": zone_id,
        "aqi": aqi,
        "attributed": True,
        "source": best["source"],
        "distanceKm": best["distanceKm"],
        "direction": best["direction"],
        "windFrom": wind_from,
        "confidence": confidence,
        "message": message,
        "attributionSource": SOURCE_ATTRIBUTION,
    }


def _empty(zone_id: str, msg: str) -> dict:
    return {
        "zone": zone_id,
        "aqi": None,
        "attributed": False,
        "source": None,
        "distanceKm": None,
        "direction": None,
        "windFrom": None,
        "confidence": "none",
        "message": msg,
        "attributionSource": SOURCE_ATTRIBUTION,
    }
