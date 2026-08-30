"""
POI service — nearby fuel stations and parking via Overpass API.

Free, no API key required. Queries OpenStreetMap Overpass API
for amenities near a given lat/lng within a configurable radius.
"""

import httpx
import logging

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def nearby_pois(lat: float, lng: float, radius_m: int = 3000, poi_type: str = "fuel") -> list[dict]:
    """
    Fetch nearby POIs from Overpass API.

    Args:
        lat: Latitude
        lng: Longitude
        radius_m: Search radius in meters (default 3km)
        poi_type: 'fuel' or 'parking'
    """
    tag = "amenity=fuel" if poi_type == "fuel" else "amenity=parking"
    query = f"""
    [out:json][timeout:8];
    node[{tag}](around:{radius_m},{lat},{lng});
    out body;
    """

    try:
        resp = httpx.post(OVERPASS_URL, data={"data": query}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("Overpass API failed: %s", exc)
        return []

    return [
        {
            "name": el.get("tags", {}).get("name", poi_type.title()),
            "lat": el["lat"],
            "lng": el["lon"],
            "type": poi_type,
            "distance": _haversine(lat, lng, el["lat"], el["lon"]),
        }
        for el in data.get("elements", [])
    ]


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in meters between two lat/lng points."""
    import math
    R = 6371000
    p = math.pi / 180
    a = 0.5 - math.cos((lat2 - lat1) * p) / 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lng2 - lng1) * p)) / 2
    return round(2 * R * math.asin(math.sqrt(a)))
