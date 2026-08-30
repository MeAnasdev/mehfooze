"""
Hazard alert service — checks AQI levels and generates alerts when thresholds are crossed.
Integrates with the notification system to send push alerts.
"""

import uuid
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

try:
    from app.models.reading import AqiReading
    from app.models.hazard import HazardAlert
except ModuleNotFoundError:
    from models.reading import AqiReading
    from models.hazard import HazardAlert

logger = logging.getLogger(__name__)

# AQI thresholds for hazard alerts
THRESHOLDS = [
    (200, "danger", "Air quality is Unhealthy. Avoid outdoor activity."),
    (150, "warning", "Air quality is Unhealthy for Sensitive Groups. Limit outdoor exertion."),
    (100, "caution", "Air quality is Moderate. Sensitive groups should take care."),
]


def check_and_create_alerts(db: Session) -> list[dict]:
    """
    Check current AQI readings and create hazard alerts when thresholds are crossed.
    Only creates an alert if no alert exists for that zone in the last 6 hours.
    """
    from app.services.ingest import LAHORE_ZONES

    now = datetime.now(timezone.utc)
    alerts = []

    for zone in LAHORE_ZONES:
        # Get latest reading for this zone
        reading = (
            db.query(AqiReading)
            .filter(AqiReading.zone_id == zone["id"])
            .order_by(AqiReading.recorded_at.desc())
            .first()
        )
        if not reading or reading.aqi <= 100:
            continue

        # Check if we already alerted for this zone recently (6h cooldown)
        six_hours_ago = now.timestamp() - 6 * 3600
        recent_alert = (
            db.query(HazardAlert)
            .filter(
                HazardAlert.zone_id == zone["id"],
                HazardAlert.created_at.timestamp() > six_hours_ago,
            )
            .first()
        )
        if recent_alert:
            continue

        # Find matching threshold
        for threshold_aqi, severity, message in THRESHOLDS:
            if reading.aqi >= threshold_aqi:
                alert_id = str(uuid.uuid4())[:8]
                alert = HazardAlert(
                    id=alert_id,
                    zone_id=zone["id"],
                    severity=severity,
                    aqi=reading.aqi,
                    message=f"{zone['name']}: {message}",
                    sent=False,
                    created_at=now,
                )
                db.add(alert)
                alerts.append({
                    "id": alert_id,
                    "zone": zone["id"],
                    "severity": severity,
                    "aqi": reading.aqi,
                    "message": alert.message,
                })
                logger.info("Created hazard alert for %s: AQI %s (%s)", zone["id"], reading.aqi, severity)
                break  # Only one alert per zone per check

    if alerts:
        db.commit()

    return alerts


def get_active_alerts(db: Session, limit: int = 20) -> list[dict]:
    """Get recent hazard alerts (last 24 hours)."""
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    alerts = (
        db.query(HazardAlert)
        .filter(HazardAlert.created_at >= cutoff)
        .order_by(HazardAlert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "zone": a.zone_id,
            "severity": a.severity,
            "aqi": a.aqi,
            "message": a.message,
            "sent": a.sent,
            "createdAt": a.created_at.isoformat(),
        }
        for a in alerts
    ]
