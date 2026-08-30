"""
Forecasting service — produces 24–72h per-zone AQI forecasts.

Data source: Open-Meteo Air Quality API (CAMS global) — free, no key.
  - Historical archive used to train the Prophet model.
  - 5-day hourly forecast used directly as a fast baseline.

Model strategy:
  1. Open-Meteo native 72h forecast  (always available, used as immediate baseline)
  2. Prophet on 9-month smog-season history (Oct–Feb) + current season data
     — trained only when >= 168 hourly data points exist in the DB
  3. Physical inversion baseline (final fallback if both above fail)

The physically-informed baseline applies:
  - humidity > 70% → +5% AQI degradation per 24h
  - wind < 2 km/h  → +5% AQI degradation per 24h
  - both conditions → +10% per 24h (temperature inversion proxy)
"""

import math
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

try:
    from app.models.reading import AqiReading
except ModuleNotFoundError:
    from models.reading import AqiReading

logger = logging.getLogger(__name__)

FORECAST_HOURS = 72
MIN_ROWS_FOR_PROPHET = 168  # 7 days of hourly data minimum


# ── Public entry point ─────────────────────────────────────────────────

def get_forecast(zone_id: str, db: Session) -> list[dict]:
    """
    Return [{hour, aqi, source}] for the next FORECAST_HOURS hours.

    Always returns a value — never raises to the caller.
    """
    # 1. Try Open-Meteo native forecast first (fastest, most current)
    try:
        om_forecast = _openmeteo_forecast(zone_id)
        if om_forecast:
            logger.info("Using Open-Meteo native forecast for %s", zone_id)
            return om_forecast
    except Exception as exc:
        logger.warning("Open-Meteo forecast failed for %s: %s", zone_id, exc)

    # 2. Try Prophet on DB history
    history = _load_history(db, zone_id, lookback_days=270)
    if len(history) >= MIN_ROWS_FOR_PROPHET:
        try:
            logger.info("Using Prophet forecast for %s (%d rows)", zone_id, len(history))
            return _prophet_forecast(history, zone_id)
        except Exception as exc:
            logger.warning("Prophet forecast failed for %s: %s — using baseline", zone_id, exc)

    # 3. Physical inversion baseline
    logger.info("Using physical baseline for %s", zone_id)
    return _physical_baseline_forecast(history)


# ── Open-Meteo native hourly forecast ─────────────────────────────────

def _openmeteo_forecast(zone_id: str) -> list[dict]:
    """
    Pull Open-Meteo's own 5-day hourly AQI forecast for the zone.
    Returns list of {hour, aqi, source} dicts for next 72 hours.
    """
    import httpx
    from app.services.ingest import LAHORE_ZONES

    zone = next((z for z in LAHORE_ZONES if z["id"] == zone_id), LAHORE_ZONES[0])

    resp = httpx.get(
        "https://air-quality-api.open-meteo.com/v1/air-quality",
        params={
            "latitude":  zone["lat"],
            "longitude": zone["lng"],
            "hourly":    "us_aqi,pm2_5",
            "timezone":  "Asia/Karachi",
            "forecast_days": 4,
            "domains":   "cams_global",
        },
        timeout=12,
    )
    resp.raise_for_status()
    data = resp.json()["hourly"]

    aqi_vals = data.get("us_aqi", [])
    times    = data.get("time", [])

    now = datetime.now(timezone.utc)
    results = []

    for i, (t_str, aqi_raw) in enumerate(zip(times, aqi_vals)):
        if aqi_raw is None:
            continue
        # Parse forecast time and compute offset in hours from now
        t = datetime.fromisoformat(t_str).replace(tzinfo=timezone(timedelta(hours=5)))
        offset_h = round((t - now).total_seconds() / 3600)
        if offset_h < 1:
            continue
        if offset_h > FORECAST_HOURS:
            break
        results.append({
            "hour":   offset_h,
            "aqi":    max(0.0, round(float(aqi_raw), 1)),
            "source": "Open-Meteo CAMS forecast",
        })

    return results


# ── Prophet model ──────────────────────────────────────────────────────

def _fetch_weather_forecast(zone_id: str, hours: int = FORECAST_HOURS) -> dict:
    """
    Pull Open-Meteo hourly weather forecast for the next `hours` hours.
    Returns {"times": [...], "humidity": [...], "wind_speed": [...]}
    Used to fill Prophet regressors with real future weather instead of
    a flat last-known-value approximation.
    """
    import httpx
    from app.services.ingest import LAHORE_ZONES

    zone = next((z for z in LAHORE_ZONES if z["id"] == zone_id), LAHORE_ZONES[0])
    forecast_days = max(2, math.ceil(hours / 24) + 1)

    resp = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude":      zone["lat"],
            "longitude":     zone["lng"],
            "hourly":        "relative_humidity_2m,wind_speed_10m",
            "timezone":      "Asia/Karachi",
            "forecast_days": forecast_days,
        },
        timeout=12,
    )
    resp.raise_for_status()
    data = resp.json()["hourly"]
    return {
        "times":      data.get("time", []),
        "humidity":   data.get("relative_humidity_2m", []),
        "wind_speed": data.get("wind_speed_10m", []),
    }


def _prophet_forecast(history: list, zone_id: str = "gulberg") -> list[dict]:
    """
    Train a Prophet model on the DB history window and return 72h forecast.

    Weather regressors (humidity, wind_speed) are filled with real Open-Meteo
    hourly forecasts rather than a flat last-known-value approximation, which
    significantly improves accuracy during changing weather conditions.
    Falls back to last-known values if the weather fetch fails.
    """
    import pandas as pd
    from prophet import Prophet  # type: ignore

    df = pd.DataFrame([
        {
            "ds":         r.recorded_at,
            "y":          r.aqi,
            "humidity":   r.humidity  or 60,
            "wind_speed": r.wind_speed or 3,
        }
        for r in history
    ])
    df["ds"] = pd.to_datetime(df["ds"], utc=True).dt.tz_localize(None)

    model = Prophet(
        changepoint_prior_scale=0.05,
        seasonality_mode="multiplicative",
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
    )
    model.add_regressor("humidity")
    model.add_regressor("wind_speed")
    model.fit(df)

    future = model.make_future_dataframe(periods=FORECAST_HOURS, freq="h")

    # Fill future regressor columns with real Open-Meteo weather forecast
    last_humidity   = float(df["humidity"].iloc[-1])
    last_wind_speed = float(df["wind_speed"].iloc[-1])

    try:
        wx = _fetch_weather_forecast(zone_id, FORECAST_HOURS)
        # Build a lookup: naive-datetime-string → (humidity, wind_speed)
        wx_map = {
            t: (h, w)
            for t, h, w in zip(wx["times"], wx["humidity"], wx["wind_speed"])
            if h is not None and w is not None
        }

        def _fill_row(ds):
            key = ds.strftime("%Y-%m-%dT%H:%M")
            if key in wx_map:
                return wx_map[key]
            return (last_humidity, last_wind_speed)

        future["humidity"]   = future["ds"].apply(lambda d: _fill_row(d)[0])
        future["wind_speed"] = future["ds"].apply(lambda d: _fill_row(d)[1])
        logger.info("Prophet regressors filled with real Open-Meteo weather forecast")
    except Exception as exc:
        logger.warning("Weather forecast fetch failed — using last-known values: %s", exc)
        future["humidity"]   = last_humidity
        future["wind_speed"] = last_wind_speed

    pred          = model.predict(future)
    forecast_rows = pred.tail(FORECAST_HOURS)[["yhat"]].reset_index(drop=True)

    return [
        {
            "hour":   h + 1,
            "aqi":    max(0.0, round(float(row["yhat"]), 1)),
            "source": "Prophet ML model",
        }
        for h, row in forecast_rows.iterrows()
    ]


# ── Physical inversion baseline ────────────────────────────────────────

def _physical_baseline_forecast(history: list[AqiReading]) -> list[dict]:
    """
    Rule-based baseline anchored on the latest known AQI.
    Applies a degradation factor when humidity is high or wind is low
    (proxy for temperature inversion that traps pollution near ground level).
    """
    if history:
        base_aqi  = history[-1].aqi
        humidity  = history[-1].humidity  or 60.0
        wind_kmh  = history[-1].wind_speed or 5.0
    else:
        base_aqi  = 150.0
        humidity  = 70.0
        wind_kmh  = 3.0

    factor = 1.0
    if humidity > 70:
        factor += 0.05
    if wind_kmh < 2:
        factor += 0.05

    return [
        {
            "hour":   h + 1,
            "aqi":    round(min(base_aqi * (factor ** ((h + 1) / 24)), 350), 1),
            "source": "Physical inversion baseline",
        }
        for h in range(FORECAST_HOURS)
    ]


# ── DB history loader ──────────────────────────────────────────────────

def _load_history(db: Session, zone_id: str, lookback_days: int) -> list[AqiReading]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    return (
        db.query(AqiReading)
        .filter(
            AqiReading.zone_id == zone_id,
            AqiReading.recorded_at >= cutoff,
        )
        .order_by(AqiReading.recorded_at.asc())
        .all()
    )


# ── One-time historical data seed ─────────────────────────────────────

def seed_historical_data(zone_id: str, db: Session) -> int:
    """
    Pull 9 months of historical AQI from Open-Meteo archive and write to DB.
    Call once per zone to bootstrap the Prophet training set.
    Returns the number of rows inserted.
    """
    from app.services.ingest import fetch_historical_for_training, ensure_zones_seeded

    ensure_zones_seeded(db)

    # Nov 2025 – Aug 2026 covers the smog season + recovery period
    records = fetch_historical_for_training(zone_id, "2025-11-01", "2026-08-24")
    inserted = 0

    for rec in records:
        exists = (
            db.query(AqiReading)
            .filter(
                AqiReading.zone_id == zone_id,
                AqiReading.recorded_at == rec["ds"].replace(tzinfo=timezone.utc),
            )
            .first()
        )
        if not exists:
            db.add(AqiReading(
                zone_id=     zone_id,
                aqi=         rec["aqi"],
                pm25=        rec["pm25"],
                temperature= rec["temperature"],
                humidity=    rec["humidity"],
                wind_speed=  rec["wind_speed"],
                recorded_at= rec["ds"].replace(tzinfo=timezone.utc),
            ))
            inserted += 1

    db.commit()
    logger.info("Seeded %d historical rows for zone %s", inserted, zone_id)
    return inserted
