"""
Data ingestion service.
Pulls live AQI from AQICN / OpenAQ and weather from Open-Meteo,
then persists readings to PostgreSQL.
"""

import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models.zone import Zone
from app.models.reading import AqiReading
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Lahore monitoring stations (seed list — expand via DB)
LAHORE_STATIONS = [
    {"id": "gulberg",    "name": "Gulberg",    "lat": 31.5204, "lng": 74.3587, "aqicn_city": "lahore/gulberg"},
    {"id": "johar-town", "name": "Johar Town", "lat": 31.4681, "lng": 74.2735, "aqicn_city": "lahore/johar-town"},
    {"id": "shahdara",   "name": "Shahdara",   "lat": 31.6103, "lng": 74.3294, "aqicn_city": "lahore/shahdara"},
]


def fetch_live_aqi(db: Session) -> list[dict]:
    """
    Fetch live AQI from AQICN for each configured station.
    Falls back to last cached DB reading if the API call fails.
    Returns a list of ZoneReading-shaped dicts.
    """
    results = []

    for station in LAHORE_STATIONS:
        try:
            url = f"https://api.waqi.info/feed/{station['aqicn_city']}/?token={settings.aqicn_token}"
            resp = httpx.get(url, timeout=8)
            resp.raise_for_status()
            data = resp.json()

            aqi_val = float(data["data"]["aqi"])
            now = datetime.now(timezone.utc)

            # Persist reading
            reading = AqiReading(
                zone_id=station["id"],
                aqi=aqi_val,
                recorded_at=now,
            )
            db.add(reading)
            db.commit()

            results.append({
                "stationId": station["id"],
                "name": station["name"],
                "lat": station["lat"],
                "lng": station["lng"],
                "aqi": aqi_val,
                "updatedAt": now.isoformat(),
            })

        except Exception as exc:
            logger.warning("AQICN fetch failed for %s: %s — using cached data", station["id"], exc)
            cached = _last_cached(db, station["id"])
            if cached:
                results.append(cached)

    return results


def _last_cached(db: Session, zone_id: str) -> dict | None:
    """Return the most recent DB reading for a zone as a dict, or None."""
    from app.models.zone import Zone as ZoneModel

    reading = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id)
        .order_by(AqiReading.recorded_at.desc())
        .first()
    )
    zone = db.query(ZoneModel).filter(ZoneModel.id == zone_id).first()
    if reading and zone:
        return {
            "stationId": zone.id,
            "name": zone.name,
            "lat": zone.lat,
            "lng": zone.lng,
            "aqi": reading.aqi,
            "updatedAt": reading.recorded_at.isoformat(),
        }
    return None
