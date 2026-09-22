"""
Sentinel-5P satellite pollution data (Phase 4).

Sentinel-5P (TROPOMI) is a real ESA/Copernicus satellite that measures
atmospheric NO2, SO2, CO and other gases. Data is accessed via Sentinel Hub's
Statistical API using OAuth2 client-credentials.

HONESTY / SCOPE:
  - Resolution is ~5.5 km x 3.5 km per pixel, updated roughly DAILY.
  - This is REGIONAL pollution data, NOT real-time per-factory measurement.
  - Every value returned is labelled: source, cadence, and resolution.
  - If credentials are not configured, the layer degrades gracefully
    (available: false) — the app never breaks.

We use NO2 (nitrogen dioxide) as the headline gas because it is the clearest
satellite-visible marker of combustion / industrial / traffic emissions.
"""

import time
import logging
from datetime import datetime, timezone, timedelta

import httpx

try:
    from app.config import settings
    from app.services.ingest import LAHORE_ZONES
except ModuleNotFoundError:
    from config import settings
    from services.ingest import LAHORE_ZONES

logger = logging.getLogger(__name__)

_TOKEN_URL = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"
_STATS_URL = "https://services.sentinel-hub.com/api/v1/statistics"

# Simple in-process token cache
_token_cache: dict = {"token": None, "expires": 0.0}
# Result cache — satellite data updates daily, so cache aggressively (6h)
_result_cache: dict = {"data": None, "ts": None}
_RESULT_TTL_SECONDS = 6 * 3600

SATELLITE_META = {
    "source": "Sentinel-5P (TROPOMI) via Copernicus / Sentinel Hub",
    "gas": "NO2 (nitrogen dioxide column)",
    "resolution": "~5.5 km × 3.5 km per pixel",
    "cadence": "daily",
    "note": "Regional satellite estimate — not real-time or per-facility. Complements ground sensors.",
}


def _configured() -> bool:
    return bool(settings.sentinel_client_id and settings.sentinel_client_secret)


def _get_token() -> str | None:
    """Fetch/refresh a Sentinel Hub OAuth2 access token (client credentials)."""
    if not _configured():
        return None
    now = time.time()
    if _token_cache["token"] and _token_cache["expires"] > now + 60:
        return _token_cache["token"]
    try:
        resp = httpx.post(
            _TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.sentinel_client_id,
                "client_secret": settings.sentinel_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        _token_cache["token"] = data["access_token"]
        _token_cache["expires"] = now + float(data.get("expires_in", 3600))
        return _token_cache["token"]
    except Exception as exc:
        logger.warning("Sentinel Hub token fetch failed: %s", exc)
        return None


def _no2_for_zone(token: str, lat: float, lng: float) -> float | None:
    """Fetch mean NO2 column density for a small box around a zone (last 7 days)."""
    # ~0.05 deg box (~5km) around the zone centre
    d = 0.05
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=7)

    evalscript = (
        "//VERSION=3\n"
        "function setup() {\n"
        "  return {\n"
        "    input: [{bands: ['NO2', 'dataMask']}],\n"
        "    output: [{id: 'no2', bands: 1}, {id: 'dataMask', bands: 1}]\n"
        "  };\n"
        "}\n"
        "function evaluatePixel(s) {\n"
        "  return {no2: [s.NO2], dataMask: [s.dataMask]};\n"
        "}\n"
    )

    body = {
        "input": {
            "bounds": {
                "bbox": [lng - d, lat - d, lng + d, lat + d],
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"},
            },
            "data": [{
                "type": "sentinel-5p-l2",
                "dataFilter": {"timeRange": {
                    "from": start.strftime("%Y-%m-%dT00:00:00Z"),
                    "to": end.strftime("%Y-%m-%dT23:59:59Z"),
                }},
            }],
        },
        "aggregation": {
            "timeRange": {
                "from": start.strftime("%Y-%m-%dT00:00:00Z"),
                "to": end.strftime("%Y-%m-%dT23:59:59Z"),
            },
            "aggregationInterval": {"of": "P7D"},
            "evalscript": evalscript,
        },
    }

    try:
        resp = httpx.post(
            _STATS_URL,
            json=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=25,
        )
        resp.raise_for_status()
        data = resp.json()
        intervals = data.get("data", [])
        if not intervals:
            return None
        stats = intervals[0].get("outputs", {}).get("no2", {}).get("bands", {}).get("B0", {}).get("stats", {})
        mean = stats.get("mean")
        return float(mean) if mean is not None else None
    except Exception as exc:
        logger.warning("Sentinel NO2 fetch failed for (%s,%s): %s", lat, lng, exc)
        return None


def get_satellite_overlay() -> dict:
    """
    Return Sentinel-5P NO2 estimates for all Lahore zones.

    Shape:
      {
        "available": bool,
        "meta": {...},              # source / resolution / cadence labels
        "zones": [{zoneId, name, lat, lng, no2, unit}],
        "message": str,
      }

    If credentials are missing or the API fails, available=false and the app
    continues normally (the frontend hides / disables the satellite layer).
    """
    if not _configured():
        return {
            "available": False,
            "meta": SATELLITE_META,
            "zones": [],
            "message": "Satellite layer not configured. Add Sentinel Hub credentials to enable Sentinel-5P data.",
        }

    # Serve cached result (satellite data updates daily)
    now = datetime.now(timezone.utc)
    if _result_cache["data"] is not None and _result_cache["ts"] is not None:
        if (now - _result_cache["ts"]).total_seconds() < _RESULT_TTL_SECONDS:
            return _result_cache["data"]

    token = _get_token()
    if not token:
        return {
            "available": False,
            "meta": SATELLITE_META,
            "zones": [],
            "message": "Could not authenticate with Sentinel Hub. Satellite layer unavailable.",
        }

    zones_out = []
    for z in LAHORE_ZONES:
        no2 = _no2_for_zone(token, z["lat"], z["lng"])
        zones_out.append({
            "zoneId": z["id"],
            "name": z["name"],
            "lat": z["lat"],
            "lng": z["lng"],
            "no2": round(no2, 8) if no2 is not None else None,
            "unit": "mol/m²",
        })

    result = {
        "available": True,
        "meta": SATELLITE_META,
        "zones": zones_out,
        "message": "Sentinel-5P NO2 regional estimate (7-day mean).",
    }
    _result_cache["data"] = result
    _result_cache["ts"] = now
    return result
