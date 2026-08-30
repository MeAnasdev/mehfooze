"""
Ranking service — global city AQI rankings from AQICN.

Fetches live AQI for a predefined list of major cities,
sorts by AQI descending, and returns a ranked list.
"""

import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Top 10 most-polluted cities (representative list for the hackathon)
CITIES = [
    {"city": "Delhi", "country": "India", "flag": "🇮🇳", "lat": 28.6139, "lng": 77.2090},
    {"city": "Lahore", "country": "Pakistan", "flag": "🇵🇰", "lat": 31.5204, "lng": 74.3587},
    {"city": "Dhaka", "country": "Bangladesh", "flag": "🇧🇩", "lat": 23.8103, "lng": 90.4125},
    {"city": "Kolkata", "country": "India", "flag": "🇮🇳", "lat": 22.5726, "lng": 88.3639},
    {"city": "Jakarta", "country": "Indonesia", "flag": "🇮🇩", "lat": -6.2088, "lng": 106.8456},
    {"city": "Dubai", "country": "UAE", "flag": "🇦🇪", "lat": 25.2048, "lng": 55.2708},
    {"city": "Karachi", "country": "Pakistan", "flag": "🇵🇰", "lat": 24.8607, "lng": 67.0011},
    {"city": "Mumbai", "country": "India", "flag": "🇮🇳", "lat": 19.0760, "lng": 72.8777},
    {"city": "Cairo", "country": "Egypt", "flag": "🇪🇬", "lat": 30.0444, "lng": 31.2357},
    {"city": "Istanbul", "country": "Turkey", "flag": "🇹🇷", "lat": 41.0082, "lng": 28.9784},
]


def fetch_global_rankings() -> list[dict]:
    """Fetch live AQI for all cities from AQICN, sorted worst-first."""
    token = settings.aqicn_token
    if not token:
        logger.warning("AQICN_TOKEN not set — returning zero AQI for all cities")
        return [
            {**c, "aqi": 0, "rank": i + 1}
            for i, c in enumerate(CITIES)
        ]

    results = []
    for c in CITIES:
        try:
            resp = httpx.get(
                f"https://api.waqi.info/feed/geo:{c['lat']};{c['lng']}/",
                params={"token": token},
                timeout=8,
            )
            data = resp.json()
            aqi = data.get("data", {}).get("aqi", 0) if data.get("status") == "ok" else 0
        except Exception as exc:
            logger.warning("AQICN fetch failed for %s: %s", c["city"], exc)
            aqi = 0
        results.append({**c, "aqi": aqi})

    results.sort(key=lambda x: x["aqi"], reverse=True)
    return [{**r, "rank": i + 1} for i, r in enumerate(results)]
