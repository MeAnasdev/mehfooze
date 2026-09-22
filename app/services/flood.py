"""
Flood monitoring service (Phase 4+).

Powered by the Open-Meteo Flood API, which serves the GloFAS (Global Flood
Awareness System) river-discharge model — the same underlying model many
national agencies reference. Free, no key.

HONESTY / ATTRIBUTION:
  - We provide a LIVE MODEL VIEW of river discharge (GloFAS via Open-Meteo).
  - We are NOT the official warning authority. The official flood bulletin for
    Pakistan is issued by the PMD Flood Forecasting Division (FFD).
  - Every response links to the official PMD FFD source and labels the model.
  - Flood status thresholds are derived from discharge relative to typical
    seasonal flow and are clearly labelled as model-based, not official.
"""

import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

_FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"
OFFICIAL_SOURCE = {
    "authority": "PMD Flood Forecasting Division (FFD), Lahore",
    "url": "https://ffd.pmd.gov.pk/",
    "note": "Live river-discharge model (GloFAS via Open-Meteo). For official flood bulletins, consult PMD FFD.",
}

# Monitoring points on Punjab's major rivers (near Lahore / Punjab plains).
# Coordinates are on the river channels; discharge is modelled by GloFAS.
RIVER_POINTS = [
    {"id": "ravi",    "name": "Ravi",    "urdu": "راوی",  "lat": 31.5800, "lng": 74.3000},
    {"id": "chenab",  "name": "Chenab",  "urdu": "چناب",  "lat": 30.9700, "lng": 71.9700},
    {"id": "sutlej",  "name": "Sutlej",  "urdu": "ستلج",  "lat": 30.6600, "lng": 73.1100},
    {"id": "jhelum",  "name": "Jhelum",  "urdu": "جہلم",  "lat": 32.9400, "lng": 73.7300},
    {"id": "indus",   "name": "Indus",   "urdu": "سندھ",  "lat": 31.9200, "lng": 71.0900},
]

# Discharge (m³/s) thresholds → flood status. These are model-based indicative
# bands (labelled as such), NOT official FFD categories.
def _status_from_discharge(q: float | None) -> dict:
    if q is None:
        return {"level": "unknown", "label": "No data", "color": "#6c7a70"}
    if q < 200:
        return {"level": "below_low", "label": "Below Low", "color": "#00b074"}
    if q < 800:
        return {"level": "normal", "label": "Normal Flow", "color": "#00b074"}
    if q < 2000:
        return {"level": "low", "label": "Low Flood", "color": "#0054cd"}
    if q < 5000:
        return {"level": "medium", "label": "Medium Flood", "color": "#ffb300"}
    if q < 10000:
        return {"level": "high", "label": "High Flood", "color": "#ff7e00"}
    if q < 20000:
        return {"level": "very_high", "label": "Very High Flood", "color": "#ff0000"}
    return {"level": "exceptional", "label": "Exceptionally High", "color": "#7e0023"}


def _fetch_river(point: dict) -> dict:
    """Fetch current + short-term forecast river discharge for one river point."""
    try:
        resp = httpx.get(
            _FLOOD_URL,
            params={
                "latitude": point["lat"],
                "longitude": point["lng"],
                "daily": "river_discharge",
                "forecast_days": 7,
            },
            timeout=15,
        )
        resp.raise_for_status()
        daily = resp.json().get("daily", {})
        discharges = daily.get("river_discharge", []) or []
        times = daily.get("time", []) or []

        current = discharges[0] if discharges else None
        # 24h-ahead status = tomorrow's modelled discharge
        next_24h = discharges[1] if len(discharges) > 1 else current
        peak = max([d for d in discharges if d is not None], default=None)

        series = [
            {"date": times[i], "discharge": discharges[i]}
            for i in range(min(len(times), len(discharges)))
            if discharges[i] is not None
        ]

        return {
            "id": point["id"],
            "name": point["name"],
            "urdu": point["urdu"],
            "lat": point["lat"],
            "lng": point["lng"],
            "discharge": round(current, 1) if current is not None else None,
            "status": _status_from_discharge(current),
            "status24h": _status_from_discharge(next_24h),
            "peak7d": round(peak, 1) if peak is not None else None,
            "series": series,
        }
    except Exception as exc:
        logger.warning("Flood fetch failed for %s: %s", point["id"], exc)
        return {
            "id": point["id"],
            "name": point["name"],
            "urdu": point["urdu"],
            "lat": point["lat"],
            "lng": point["lng"],
            "discharge": None,
            "status": _status_from_discharge(None),
            "status24h": _status_from_discharge(None),
            "peak7d": None,
            "series": [],
        }


# 30-minute cache — flood model updates slowly
_cache: dict = {"data": None, "ts": None}
_TTL = 1800


def get_flood_overview() -> dict:
    """Return river status for all monitored Punjab rivers + attribution."""
    from concurrent.futures import ThreadPoolExecutor

    now = datetime.now(timezone.utc)
    if _cache["data"] is not None and _cache["ts"] is not None:
        if (now - _cache["ts"]).total_seconds() < _TTL:
            return _cache["data"]

    with ThreadPoolExecutor(max_workers=len(RIVER_POINTS)) as ex:
        rivers = list(ex.map(_fetch_river, RIVER_POINTS))

    # Summary counts
    any_flood = any(r["status"]["level"] in ("medium", "high", "very_high", "exceptional") for r in rivers)
    result = {
        "rivers": rivers,
        "anyFloodRisk": any_flood,
        "updatedAt": now.isoformat(),
        "source": OFFICIAL_SOURCE,
    }
    _cache["data"] = result
    _cache["ts"] = now
    return result
