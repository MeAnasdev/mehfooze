"""
Data ingestion service.

PRIMARY source: Open-Meteo Air Quality API (CAMS global model)
  - Completely free, no API key required
  - Provides real US AQI, PM2.5, PM10 per coordinate
  - URL: https://air-quality-api.open-meteo.com

SECONDARY source: AQICN live station data (requires free token from aqicn.org)
  - Used to cross-check / enrich Open-Meteo data when token is available

Weather covariates: Open-Meteo Forecast API (free, no key)
  - Temperature, humidity, wind speed for inversion detection
"""

import httpx
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

try:
    from app.config import settings
    from app.models.zone import Zone
    from app.models.reading import AqiReading
except ModuleNotFoundError:
    from config import settings
    from models.zone import Zone
    from models.reading import AqiReading

logger = logging.getLogger(__name__)

# ── Lahore monitoring zones ────────────────────────────────────────────
# Each zone has its own coordinate so Open-Meteo returns localised data.
# Coordinates chosen to represent the centre of each neighbourhood.
LAHORE_ZONES = [
    {
        "id":         "gulberg",
        "name":       "Gulberg",
        "lat":        31.5204,
        "lng":        74.3587,
        "aqicn_slug": "lahore/gulberg",   # used only if AQICN_TOKEN is set
        # Estimated residential + daytime population (WorldPop-informed approximation)
        "population": 320_000,
    },
    {
        "id":         "johar-town",
        "name":       "Johar Town",
        "lat":        31.4681,
        "lng":        74.2735,
        "aqicn_slug": "lahore/johar-town",
        "population": 450_000,
    },
    {
        "id":         "shahdara",
        "name":       "Shahdara",
        "lat":        31.6103,
        "lng":        74.3294,
        "aqicn_slug": "lahore/shahdara",
        "population": 520_000,
    },
    {
        "id":         "model-town",
        "name":       "Model Town",
        "lat":        31.4834,
        "lng":        74.3352,
        "aqicn_slug": "lahore/model-town",
        "population": 210_000,
    },
    {
        "id":         "defence",
        "name":       "DHA / Defence",
        "lat":        31.4697,
        "lng":        74.4097,
        "aqicn_slug": "lahore/defence",
        "population": 260_000,
    },
]

# ── Open-Meteo Air Quality API ─────────────────────────────────────────
_AQ_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"
_WX_BASE = "https://api.open-meteo.com/v1/forecast"


def _fetch_openmeteo_current(lat: float, lng: float) -> dict:
    """
    Fetch current AQI + weather for a single coordinate.
    Returns a flat dict with keys: aqi, pm25, pm10, temperature, humidity, wind_speed.
    Raises httpx.HTTPError on failure — caller handles fallback.
    """
    # Air quality — US AQI, PM2.5, PM10, O3, NO2, CO, SO2
    aq_resp = httpx.get(
        _AQ_BASE,
        params={
            "latitude":    lat,
            "longitude":   lng,
            "current":     "pm2_5,pm10,us_aqi,ozone,nitrogen_dioxide,carbon_monoxide,sulphur_dioxide",
            "timezone":    "Asia/Karachi",
            "domains":     "cams_global",
        },
        timeout=10,
    )
    aq_resp.raise_for_status()
    aq = aq_resp.json()["current"]

    # Weather covariates — temperature, humidity, wind speed
    wx_resp = httpx.get(
        _WX_BASE,
        params={
            "latitude":  lat,
            "longitude": lng,
            "current":   "temperature_2m,relative_humidity_2m,wind_speed_10m",
            "timezone":  "Asia/Karachi",
        },
        timeout=10,
    )
    wx_resp.raise_for_status()
    wx = wx_resp.json()["current"]

    return {
        "aqi":         float(aq.get("us_aqi") or 0),
        "pm25":        float(aq.get("pm2_5") or 0),
        "pm10":        float(aq.get("pm10") or 0),
        "o3":          float(aq.get("ozone") or 0),
        "no2":         float(aq.get("nitrogen_dioxide") or 0),
        "co":          float(aq.get("carbon_monoxide") or 0),
        "so2":         float(aq.get("sulphur_dioxide") or 0),
        "temperature": float(wx.get("temperature_2m") or 0),
        "humidity":    float(wx.get("relative_humidity_2m") or 0),
        "wind_speed":  float(wx.get("wind_speed_10m") or 0),
    }


def _fetch_aqicn_current(slug: str) -> float | None:
    """
    Fetch live AQI from AQICN for the given station slug.
    Returns the AQI float, or None if the token is absent or the call fails.
    """
    if not settings.aqicn_token:
        return None
    try:
        resp = httpx.get(
            f"https://api.waqi.info/feed/{slug}/",
            params={"token": settings.aqicn_token},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") == "ok":
            raw = data["data"]["aqi"]
            # AQICN sometimes returns "-" when station is offline
            return float(raw) if str(raw).lstrip("-").isdigit() else None
    except Exception as exc:
        logger.warning("AQICN fetch failed for %s: %s", slug, exc)
    return None


def ensure_zones_seeded(db: Session) -> None:
    """Insert zone rows if they don't already exist. Updates population if it was 0."""
    for z in LAHORE_ZONES:
        existing = db.query(Zone).filter(Zone.id == z["id"]).first()
        if not existing:
            db.add(Zone(
                id=z["id"],
                name=z["name"],
                lat=z["lat"],
                lng=z["lng"],
                population=z.get("population", 0),
            ))
        elif existing.population == 0 and z.get("population"):
            existing.population = z["population"]
    db.commit()


def _fetch_zone(zone: dict, now: datetime) -> dict | None:
    """
    Fetch current AQI + weather for a single zone. Returns a result dict or None on failure.
    Designed to be called concurrently via ThreadPoolExecutor.
    """
    try:
        om_data = _fetch_openmeteo_current(zone["lat"], zone["lng"])

        # Optional AQICN blend
        aqicn_aqi = _fetch_aqicn_current(zone["aqicn_slug"])
        if aqicn_aqi and aqicn_aqi > 0:
            final_aqi = round(om_data["aqi"] * 0.6 + aqicn_aqi * 0.4, 1)
            logger.info("Zone %s: OM=%s AQICN=%s blended=%s",
                        zone["id"], om_data["aqi"], aqicn_aqi, final_aqi)
        else:
            final_aqi = om_data["aqi"]

        return {
            "zone_id":     zone["id"],
            "stationId":   zone["id"],
            "name":        zone["name"],
            "lat":         zone["lat"],
            "lng":         zone["lng"],
            "aqi":         final_aqi,
            "pm25":        om_data["pm25"],
            "pm10":        om_data["pm10"],
            "o3":          om_data["o3"],
            "no2":         om_data["no2"],
            "co":          om_data["co"],
            "so2":         om_data["so2"],
            "temperature": om_data["temperature"],
            "humidity":    om_data["humidity"],
            "wind_speed":  om_data["wind_speed"],
            "updatedAt":   now.isoformat(),
            "source":      "Open-Meteo CAMS" + (" + AQICN" if aqicn_aqi else ""),
        }
    except Exception as exc:
        logger.warning("Open-Meteo fetch failed for %s: %s — using cached data",
                       zone["id"], exc)
        return None


def fetch_live_aqi(db: Session) -> list[dict]:
    """
    Fetch current AQI for every Lahore zone concurrently.

    Strategy:
      1. Pull data from Open-Meteo Air Quality (primary — always works, no key).
         All zones are fetched in parallel via ThreadPoolExecutor.
      2. If AQICN_TOKEN is configured, blend the station reading (average).
      3. Persist each reading to the DB for forecast training.
      4. If Open-Meteo fails for a zone, fall back to the last cached DB row.

    Returns a list of ZoneReading-shaped dicts ready for the API response.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    ensure_zones_seeded(db)
    now = datetime.now(timezone.utc)

    # Fetch all zones concurrently — reduces wall time from ~40s → ~5s
    zone_results: dict[str, dict | None] = {}
    with ThreadPoolExecutor(max_workers=len(LAHORE_ZONES)) as executor:
        futures = {
            executor.submit(_fetch_zone, zone, now): zone
            for zone in LAHORE_ZONES
        }
        for future in as_completed(futures):
            zone = futures[future]
            zone_results[zone["id"]] = future.result()

    results = []
    for zone in LAHORE_ZONES:  # preserve original zone order
        data = zone_results.get(zone["id"])
        if data:
            # Persist to DB
            reading = AqiReading(
                zone_id=     data["zone_id"],
                aqi=         data["aqi"],
                pm25=        data["pm25"],
                pm10=        data["pm10"],
                o3=          data["o3"],
                no2=         data["no2"],
                co=          data["co"],
                so2=         data["so2"],
                temperature= data["temperature"],
                humidity=    data["humidity"],
                wind_speed=  data["wind_speed"],
                recorded_at= now,
            )
            db.add(reading)
            # Strip internal key before returning to caller
            result = {k: v for k, v in data.items() if k != "zone_id"}
            results.append(result)
        else:
            cached = _last_cached(db, zone["id"])
            if cached:
                results.append(cached)

    db.commit()

    # After persisting fresh readings, check for hazard thresholds and dispatch alerts
    try:
        from app.services.hazard import check_and_create_alerts
        check_and_create_alerts(db)
    except Exception as exc:
        logger.warning("Hazard check after ingestion failed: %s", exc)

    return results


def fetch_historical_for_training(zone_id: str, start_date: str, end_date: str) -> list[dict]:
    """
    Pull historical hourly AQI + weather from Open-Meteo archive for Prophet training.
    Uses the CAMS reanalysis archive — no key needed.

    Args:
        zone_id:    One of the LAHORE_ZONES ids
        start_date: ISO date string, e.g. "2025-11-01"
        end_date:   ISO date string, e.g. "2026-08-25"

    Returns:
        List of dicts: {ds: datetime, aqi, pm25, temperature, humidity, wind_speed}
    """
    zone = next((z for z in LAHORE_ZONES if z["id"] == zone_id), LAHORE_ZONES[0])

    # Air quality archive
    aq_resp = httpx.get(
        _AQ_BASE,
        params={
            "latitude":   zone["lat"],
            "longitude":  zone["lng"],
            "hourly":     "pm2_5,us_aqi",
            "timezone":   "Asia/Karachi",
            "start_date": start_date,
            "end_date":   end_date,
            "domains":    "cams_global",
        },
        timeout=30,
    )
    aq_resp.raise_for_status()
    aq = aq_resp.json()["hourly"]

    # Weather archive
    wx_resp = httpx.get(
        "https://archive-api.open-meteo.com/v1/archive",
        params={
            "latitude":   zone["lat"],
            "longitude":  zone["lng"],
            "hourly":     "temperature_2m,relative_humidity_2m,wind_speed_10m",
            "timezone":   "Asia/Karachi",
            "start_date": start_date,
            "end_date":   end_date,
        },
        timeout=30,
    )
    wx_resp.raise_for_status()
    wx = wx_resp.json()["hourly"]

    records = []
    for i, time_str in enumerate(aq["time"]):
        aqi_val = aq["us_aqi"][i]
        if aqi_val is None:
            continue
        records.append({
            "ds":          datetime.fromisoformat(time_str),
            "aqi":         float(aqi_val),
            "pm25":        float(aq["pm2_5"][i] or 0),
            "temperature": float(wx["temperature_2m"][i] or 0),
            "humidity":    float(wx["relative_humidity_2m"][i] or 0),
            "wind_speed":  float(wx["wind_speed_10m"][i] or 0),
        })

    return records


def _last_cached(db: Session, zone_id: str) -> dict | None:
    """Return the most recent DB reading for a zone as a dict, or None."""
    reading = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id)
        .order_by(AqiReading.recorded_at.desc())
        .first()
    )
    zone = next((z for z in LAHORE_ZONES if z["id"] == zone_id), None)
    if reading and zone:
        return {
            "stationId":   zone["id"],
            "name":        zone["name"],
            "lat":         zone["lat"],
            "lng":         zone["lng"],
            "aqi":         reading.aqi,
            "pm25":        reading.pm25 or 0,
            "pm10":        reading.pm10 or 0,
            "o3":          reading.o3 or 0,
            "no2":         reading.no2 or 0,
            "co":          reading.co or 0,
            "so2":         reading.so2 or 0,
            "temperature": reading.temperature or 0,
            "humidity":    reading.humidity or 0,
            "wind_speed":  reading.wind_speed or 0,
            "updatedAt":   reading.recorded_at.isoformat(),
            "source":      "cached",
        }
    return None
