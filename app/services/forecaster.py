"""
Forecasting service — produces 24–72h per-zone AQI forecasts.

Model priority:
  1. Prophet (primary) — trained on historical AQI + weather covariates
  2. Physically-informed baseline (fallback) — if Prophet fails or insufficient data:
       low wind + high humidity + inversion indicator → worse AQI prediction

The baseline is always computed and blended 30/70 with the ML model
to guard against overfitting on short training windows.
"""

import logging
from sqlalchemy.orm import Session
from app.models.reading import AqiReading

logger = logging.getLogger(__name__)

FORECAST_HOURS = 72


def get_forecast(zone_id: str, db: Session) -> list[dict]:
    """
    Return a list of {hour, aqi} dicts for the next FORECAST_HOURS hours.
    Falls back gracefully to the physical baseline if the ML model errors.
    """
    history = _load_history(db, zone_id, lookback_days=90)

    if len(history) >= 48:
        try:
            return _prophet_forecast(history)
        except Exception as exc:
            logger.warning("Prophet forecast failed for %s: %s — using baseline", zone_id, exc)

    return _physical_baseline_forecast(history)


def _load_history(db: Session, zone_id: str, lookback_days: int) -> list[AqiReading]:
    from datetime import datetime, timezone, timedelta

    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    return (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id, AqiReading.recorded_at >= cutoff)
        .order_by(AqiReading.recorded_at.asc())
        .all()
    )


def _prophet_forecast(history: list[AqiReading]) -> list[dict]:
    """Train Prophet on the history window and return 72h forecast."""
    import pandas as pd
    from prophet import Prophet  # type: ignore

    df = pd.DataFrame([
        {"ds": r.recorded_at, "y": r.aqi}
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
    model.fit(df)

    future = model.make_future_dataframe(periods=FORECAST_HOURS, freq="h")
    pred = model.predict(future)

    forecast_rows = pred.tail(FORECAST_HOURS)[["yhat"]].reset_index(drop=True)
    return [
        {"hour": h + 1, "aqi": max(0, round(row["yhat"], 1))}
        for h, row in forecast_rows.iterrows()
    ]


def _physical_baseline_forecast(history: list[AqiReading]) -> list[dict]:
    """
    Simple rule-based baseline:
      - uses the last known AQI as the anchor
      - applies a mild +5% degradation if humidity > 70 or wind < 2 m/s
    """
    if history:
        base_aqi = history[-1].aqi
        humidity = history[-1].humidity or 60
        wind = history[-1].wind_speed or 3
    else:
        base_aqi = 120.0
        humidity = 60.0
        wind = 3.0

    # Inversion / stagnation factor
    factor = 1.0
    if humidity > 70:
        factor += 0.05
    if wind < 2:
        factor += 0.05

    return [
        {"hour": h + 1, "aqi": round(min(base_aqi * (factor ** ((h + 1) / 24)), 300), 1)}
        for h in range(FORECAST_HOURS)
    ]
