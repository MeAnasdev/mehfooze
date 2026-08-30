"""
Exposure service — hourly exposure logging and 24h summary.

Reads from the AqiReading table (already populated by ingest service),
computes per-hour exposure for a user's current zone, and returns
a 24h summary for the exposure dial.
"""

from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from app.models.reading import AqiReading
except ModuleNotFoundError:
    from models.reading import AqiReading


def get_24h_exposure(zone_id: str, db: Session) -> dict:
    """
    Return hourly AQI readings for the last 24 hours in a zone.
    Used by the exposure dial frontend component.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    rows = (
        db.query(AqiReading)
        .filter(AqiReading.zone_id == zone_id, AqiReading.recorded_at >= cutoff)
        .order_by(AqiReading.recorded_at.asc())
        .all()
    )

    hours = []
    for row in rows:
        h = row.recorded_at.hour if row.recorded_at.tzinfo else row.recorded_at.replace(tzinfo=timezone.utc).hour
        hours.append({
            "hour": h,
            "aqi": row.aqi,
            "pm25": row.pm25 or 0,
            "pm10": row.pm10 or 0,
            "o3": row.o3 or 0,
            "no2": row.no2 or 0,
            "recordedAt": row.recorded_at.isoformat(),
        })

    aqi_values = [r.aqi for r in rows]
    avg_aqi = sum(aqi_values) / len(aqi_values) if aqi_values else 0
    peak_aqi = max(aqi_values) if aqi_values else 0

    return {
        "zoneId": zone_id,
        "hours": hours,
        "averageAqi": round(avg_aqi, 1),
        "peakAqi": round(peak_aqi, 1),
        "totalHours": len(hours),
    }
