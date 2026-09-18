"""
Hazard alert service — checks AQI levels and generates alerts when thresholds are crossed.
After creating alerts, automatically dispatches unsent notifications via FCM.
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

# AQI thresholds for hazard alerts (descending — highest severity matched first)
THRESHOLDS = [
    (200, "danger",  "Air quality is Unhealthy. Avoid outdoor activity."),
    (150, "warning", "Air quality is Unhealthy for Sensitive Groups. Limit outdoor exertion."),
    (100, "caution", "Air quality is Moderate. Sensitive groups should take care."),
]


def check_and_create_alerts(db: Session) -> list[dict]:
    """
    Check current AQI readings and create HazardAlert records when thresholds
    are crossed. Enforces a 6-hour cooldown per zone to prevent alert fatigue.
    After creating records, immediately dispatches FCM notifications for
    any unsent alerts (including those created in this call).
    """
    from app.services.ingest import LAHORE_ZONES

    now = datetime.now(timezone.utc)
    created_alerts = []

    for zone in LAHORE_ZONES:
        # Latest reading for this zone
        reading = (
            db.query(AqiReading)
            .filter(AqiReading.zone_id == zone["id"])
            .order_by(AqiReading.recorded_at.desc())
            .first()
        )
        if not reading or reading.aqi <= 100:
            continue

        # 6-hour cooldown check — use proper datetime comparison
        from datetime import timedelta
        six_hours_ago = now - timedelta(hours=6)
        recent_alert = (
            db.query(HazardAlert)
            .filter(
                HazardAlert.zone_id == zone["id"],
                HazardAlert.created_at >= six_hours_ago,
            )
            .first()
        )
        if recent_alert:
            continue

        # Match the highest applicable threshold
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
                created_alerts.append({
                    "id":       alert_id,
                    "zone":     zone["id"],
                    "severity": severity,
                    "aqi":      reading.aqi,
                    "message":  alert.message,
                })
                logger.info(
                    "Created hazard alert for %s: AQI %.1f (%s)",
                    zone["id"], reading.aqi, severity,
                )
                break  # one alert per zone per check

    if created_alerts:
        db.commit()

    # Dispatch all unsent alerts (including ones just created) via FCM
    try:
        from app.routers.notifications import dispatch_unsent_alerts
        dispatched = dispatch_unsent_alerts(db)
        if dispatched:
            logger.info("Dispatched %d notification(s) after hazard check.", dispatched)
    except Exception as exc:
        logger.error("FCM dispatch failed after hazard check: %s", exc)

    return created_alerts


def get_active_alerts(db: Session, limit: int = 20) -> list[dict]:
    """Return recent hazard alerts (last 24 hours), newest first."""
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
            "id":        a.id,
            "zone":      a.zone_id,
            "severity":  a.severity,
            "aqi":       a.aqi,
            "message":   a.message,
            "sent":      a.sent,
            "createdAt": a.created_at.isoformat(),
        }
        for a in alerts
    ]
