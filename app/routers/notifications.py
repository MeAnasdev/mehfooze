"""
Push notification endpoints — FCM token registration and hazard alerts.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import FcmToken

router = APIRouter(tags=["notifications"])


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
    """Register an FCM token for push notifications."""
    existing = db.query(FcmToken).filter(FcmToken.token == req.token).first()
    if existing:
        existing.profile = req.profile
        existing.platform = req.platform
        db.commit()
        return RegisterTokenResponse(id=existing.id, registered=True)

    token_id = str(uuid.uuid4())[:8]
    db.add(FcmToken(
        id=token_id,
        user_id=req.userId,
        token=req.token,
        profile=req.profile,
        platform=req.platform,
    ))
    db.commit()
    return RegisterTokenResponse(id=token_id, registered=True)


class NotificationPayload(BaseModel):
    title: str
    body: str
    zone: str | None = None
    severity: str = "info"


@router.post("/notifications/send-test")
def send_test_notification(payload: NotificationPayload, db: Session = Depends(get_db)):
    """Send a test notification to all registered tokens (dev only)."""
    tokens = db.query(FcmToken).all()
    if not tokens:
        raise HTTPException(status_code=404, detail="No tokens registered")

    # In production, this would use firebase_admin to send via FCM
    # For now, return the payload that would be sent
    sent_count = 0
    for t in tokens:
        # TODO: Integrate firebase_admin.messaging.send()
        # message = messaging.Message(
        #     notification=messaging.Notification(title=payload.title, body=payload.body),
        #     token=t.token,
        # )
        # messaging.send(message)
        sent_count += 1

    return {"sent": sent_count, "payload": payload.model_dump()}


class AlertCheckResponse(BaseModel):
    alerts: list[dict]
    checked: bool


@router.get("/notifications/alerts", response_model=AlertCheckResponse)
def check_alerts(db: Session = Depends(get_db)):
    """Check for recent unsent hazard alerts."""
    from app.services.hazard import get_active_alerts
    alerts = get_active_alerts(db)
    return AlertCheckResponse(alerts=alerts, checked=True)


@router.post("/notifications/check-hazard")
def trigger_hazard_check(db: Session = Depends(get_db)):
    """Manually trigger a hazard alert check (dev/admin use)."""
    from app.services.hazard import check_and_create_alerts
    alerts = check_and_create_alerts(db)
    return {"created": len(alerts), "alerts": alerts}
