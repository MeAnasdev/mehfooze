"""
Push notification endpoints — FCM token registration and hazard alert dispatch.

Firebase Admin SDK is initialised once at module load.
FIREBASE_SERVICE_ACCOUNT_PATH must point to a valid service account JSON file.
All API keys are server-side only — never exposed to clients.
"""

import logging
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import FcmToken
from app.models.hazard import HazardAlert

logger = logging.getLogger(__name__)

# ── Firebase Admin initialisation (once at process start) ─────────────────────
_FCM_AVAILABLE = False
messaging = None  # Will be set below if SDK initialises successfully

try:
    import firebase_admin
    from firebase_admin import messaging as _messaging
    from firebase_admin import credentials as _credentials

    _service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    if _service_account_path and os.path.exists(_service_account_path):
        if not firebase_admin._apps:          # only initialise once
            cred = _credentials.Certificate(_service_account_path)
            firebase_admin.initialize_app(cred)
        messaging = _messaging
        _FCM_AVAILABLE = True
        logger.info("Firebase Admin SDK initialised — FCM ready.")
    else:
        logger.warning(
            "FIREBASE_SERVICE_ACCOUNT_PATH not set or file not found. "
            "Push notifications will be logged but not delivered."
        )
except Exception as exc:
    logger.error("Firebase Admin SDK failed to initialise: %s", exc)

router = APIRouter(tags=["notifications"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _send_fcm(token: str, title: str, body: str, data: dict | None = None) -> bool:
    """
    Send a single FCM push notification.
    Returns True on success, False on failure.
    Removes the token from the DB if Firebase reports it invalid.
    """
    if not _FCM_AVAILABLE or messaging is None:
        logger.warning("FCM not available — notification logged only: title=%s", title)
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=token,
        )
        response = messaging.send(message)
        logger.info("FCM sent: %s → %s", token[:12], response)
        return True
    except Exception as exc:
        err_str = str(exc).lower()
        if "registration-token-not-registered" in err_str or "invalid-registration-token" in err_str:
            logger.warning("Stale FCM token detected — will be removed: %s", token[:12])
        else:
            logger.error("FCM send failed for token %s: %s", token[:12], exc)
        return False


def _remove_stale_token(token_str: str, db: Session) -> None:
    """Delete a token that Firebase reported as invalid."""
    row = db.query(FcmToken).filter(FcmToken.token == token_str).first()
    if row:
        db.delete(row)
        db.commit()
        logger.info("Removed stale FCM token: %s", token_str[:12])


def dispatch_unsent_alerts(db: Session) -> int:
    """
    Find all HazardAlert records where sent=False and dispatch FCM
    notifications to all registered tokens.

    Respects quiet hours: non-emergency alerts (severity != 'danger')
    between 22:00–06:00 PST (UTC+5) are deferred.
    Emergency override: AQI >= 300 or severity == 'danger' bypasses quiet hours.

    Returns the number of alerts successfully dispatched.
    """
    pst_hour = (datetime.now(timezone.utc).hour + 5) % 24  # UTC+5
    in_quiet_hours = pst_hour >= 22 or pst_hour < 6

    unsent = (
        db.query(HazardAlert)
        .filter(HazardAlert.sent == False)           # noqa: E712
        .order_by(HazardAlert.created_at.asc())
        .all()
    )

    if not unsent:
        return 0

    tokens = db.query(FcmToken).all()
    if not tokens:
        logger.warning("No FCM tokens registered — alerts created but not deliverable.")
        return 0

    dispatched = 0
    severity_labels = {"caution": "⚠️ Air Quality Caution", "warning": "🟠 Air Quality Warning", "danger": "🔴 Air Quality Danger"}

    for alert in unsent:
        # Quiet hours check
        is_emergency = alert.severity == "danger" or alert.aqi >= 300
        if in_quiet_hours and not is_emergency:
            logger.info("Quiet hours active — deferring non-emergency alert %s", alert.id)
            continue

        title = severity_labels.get(alert.severity, "🔔 Air Quality Alert")
        body = alert.message
        data_payload = {
            "type": "hazard_alert",
            "zoneId": alert.zone_id,
            "aqi": str(round(alert.aqi)),
            "severity": alert.severity,
        }

        zone_success = False
        stale_tokens = []

        for t in tokens:
            success = _send_fcm(t.token, title, body, data_payload)
            if success:
                zone_success = True
            else:
                # Check if token is invalid and queue for removal
                stale_tokens.append(t.token)

        # Remove stale tokens
        for stale in stale_tokens:
            _remove_stale_token(stale, db)

        # Mark alert sent if at least one delivery succeeded (or no FCM available — log only)
        if zone_success or not _FCM_AVAILABLE:
            alert.sent = True
            dispatched += 1

    if dispatched > 0:
        db.commit()
        logger.info("Dispatched %d alert(s) via FCM.", dispatched)

    return dispatched


# ── API Endpoints ──────────────────────────────────────────────────────────────

class RegisterTokenRequest(BaseModel):
    token: str
    userId: str
    profile: str = "citizen"
    platform: str = "web"


class RegisterTokenResponse(BaseModel):
    id: str
    registered: bool


@router.post("/notifications/register", response_model=RegisterTokenResponse)
def register_token(req: RegisterTokenRequest, db: Session = Depends(get_db)):
    """Register or update an FCM device token for push notifications."""
    if not req.token:
        raise HTTPException(status_code=400, detail="Token is required.")

    # Validate profile ID
    valid_profiles = {"citizen", "parent", "patient", "commuter", "student"}
    safe_profile = req.profile if req.profile in valid_profiles else "citizen"

    existing = db.query(FcmToken).filter(FcmToken.token == req.token).first()
    if existing:
        existing.profile = safe_profile
        existing.platform = req.platform
        db.commit()
        return RegisterTokenResponse(id=existing.id, registered=True)

    token_id = str(uuid.uuid4())[:8]
    db.add(FcmToken(
        id=token_id,
        user_id=req.userId,
        token=req.token,
        profile=safe_profile,
        platform=req.platform,
    ))
    db.commit()
    logger.info("Registered FCM token for user %s (platform=%s)", req.userId[:8], req.platform)
    return RegisterTokenResponse(id=token_id, registered=True)


class NotificationPayload(BaseModel):
    title: str
    body: str
    zone: str | None = None
    severity: str = "info"


@router.post("/notifications/send-test")
def send_test_notification(payload: NotificationPayload, db: Session = Depends(get_db)):
    """Send a test notification to all registered tokens (dev/admin use only)."""
    tokens = db.query(FcmToken).all()
    if not tokens:
        raise HTTPException(status_code=404, detail="No tokens registered.")

    sent_count = 0
    failed_tokens = []

    for t in tokens:
        success = _send_fcm(
            t.token,
            payload.title,
            payload.body,
            {"type": "test", "zone": payload.zone or "", "severity": payload.severity},
        )
        if success:
            sent_count += 1
        else:
            failed_tokens.append(t.token)

    # Clean up stale tokens
    for stale in failed_tokens:
        _remove_stale_token(stale, db)

    return {
        "sent": sent_count,
        "failed": len(failed_tokens),
        "fcm_available": _FCM_AVAILABLE,
        "payload": payload.model_dump(),
    }


class AlertCheckResponse(BaseModel):
    alerts: list[dict]
    checked: bool


@router.get("/notifications/alerts", response_model=AlertCheckResponse)
def check_alerts(db: Session = Depends(get_db)):
    """Return recent hazard alerts (last 24 hours)."""
    from app.services.hazard import get_active_alerts
    alerts = get_active_alerts(db)
    return AlertCheckResponse(alerts=alerts, checked=True)


@router.post("/notifications/check-hazard")
def trigger_hazard_check(db: Session = Depends(get_db)):
    """Manually trigger hazard detection and dispatch any unsent alerts (dev/admin use)."""
    from app.services.hazard import check_and_create_alerts
    created = check_and_create_alerts(db)
    dispatched = dispatch_unsent_alerts(db)
    return {
        "created": len(created),
        "dispatched": dispatched,
        "fcm_available": _FCM_AVAILABLE,
        "alerts": created,
    }
