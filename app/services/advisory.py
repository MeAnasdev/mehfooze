"""
Advisory service — translates real-time AQI into plain-language, role-specific guidance.

AQI is read from the database (latest reading across all zones).
Falls back to the Open-Meteo current reading if DB is empty.
"""

import logging
import httpx
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
try:
    from app.models.reading import AqiReading
    from app.database import SessionLocal
except ModuleNotFoundError:
    from models.reading import AqiReading
    from database import SessionLocal

logger = logging.getLogger(__name__)

# ── Advisory rule matrix ───────────────────────────────────────────────
# Format: {profile: [(aqi_threshold, headline, [action_bullets])]}
# Thresholds follow the US EPA AQI breakpoints exactly.
_RULES: dict[str, list[tuple[int, str, list[str]]]] = {
    "citizen": [
        (50,  "Air quality is Good. Safe for all outdoor activities.",
              []),
        (100, "Air quality is Moderate. Generally safe, but unusually sensitive people may want to limit prolonged outdoor exertion.",
              ["If you feel respiratory discomfort outdoors, move inside."]),
        (150, "Air quality is Unhealthy for Sensitive Groups. Children, elderly, and those with lung or heart disease should reduce outdoor time.",
              ["Wear an N95 mask for outdoor activities.", "Keep windows closed during peak pollution hours (6–10 AM)."]),
        (200, "Air quality is Unhealthy. Everyone may begin to experience health effects.",
              ["Stay indoors as much as possible.", "Use an air purifier if available.", "Wear an N95 mask if you must go outside."]),
        (300, "Air quality is Very Unhealthy. Health warnings of emergency conditions.",
              ["Avoid all outdoor activities.", "Wear an N95 mask even for brief outdoor exposure.", "Seal gaps in doors and windows."]),
        (999, "Air quality is Hazardous. Emergency conditions — entire population is likely to be affected.",
              ["Do not go outside.", "Seal your home.", "Seek medical attention if you experience breathing difficulty."]),
    ],
    "parent": [
        (50,  "Good air quality — children can play outside safely all day.",
              []),
        (100, "Moderate air quality. Healthy children are fine outdoors; those with asthma should avoid strenuous activity during peak hours (6–10 AM).",
              ["Monitor children with respiratory conditions closely."]),
        (150, "Unhealthy for Sensitive Groups. Keep children with asthma or allergies indoors, especially 6–10 AM and after sunset.",
              ["Cancel or move outdoor PE and recess indoors.", "Ensure good indoor ventilation with windows closed.", "Use an air purifier in children's bedrooms."]),
        (200, "Unhealthy air. Keep all children indoors for the day.",
              ["No outdoor activities today.", "Run an air purifier in children's rooms.", "Avoid school runs in heavy traffic — use alternate routes."]),
        (300, "Very Unhealthy. Children must not go outside at all.",
              ["All outdoor activities cancelled.", "Contact the school to confirm indoor-only protocols.", "Keep children home if the school cannot guarantee sealed indoor air."]),
        (999, "Hazardous. Children must stay home.",
              ["Do not send children to school or outside.", "Seek medical attention immediately if a child has breathing difficulty.", "Contact emergency services if symptoms are severe."]),
    ],
    "patient": [
        (50,  "Good conditions for respiratory patients. Usual activities are safe.",
              []),
        (100, "Moderate AQI. Take your prescribed medication before going out. Avoid heavy outdoor exertion.",
              ["Carry your inhaler at all times.", "Avoid high-traffic roads and construction areas."]),
        (150, "Unhealthy for Sensitive Groups. High risk for respiratory and cardiac patients.",
              ["Stay indoors.", "Use prescribed medication as directed by your doctor.", "Wear an N95 mask if outdoor exposure is unavoidable."]),
        (200, "Unhealthy. Do not go outside today.",
              ["Do not leave home unless medically necessary.", "Contact your doctor if symptoms worsen.", "Use your nebuliser or rescue inhaler if you experience tightness."]),
        (300, "Very Unhealthy. Emergency precautions for patients with asthma, COPD, or heart disease.",
              ["Stay indoors with windows sealed.", "Have emergency medication ready.", "Call your doctor proactively — do not wait for symptoms."]),
        (999, "Hazardous. Seek medical advice immediately.",
              ["This is a medical emergency risk level.", "Stay indoors with air purification.", "Call emergency services if you have any breathing difficulty."]),
    ],
    "commuter": [
        (50,  "Safe conditions for outdoor travel today.",
              []),
        (100, "Moderate AQI. Outdoor travel is generally safe; take regular breaks.",
              ["Wear a basic dust/surgical mask if traveling near traffic or construction.", "Stay hydrated."]),
        (150, "Unhealthy for Sensitive Groups. Limit prolonged outdoor exposure for all commuters.",
              ["Wear an N95 mask throughout your outdoor shift.", "Take a 10-minute indoor break every hour.", "Stay hydrated — dehydration worsens respiratory impact."]),
        (200, "Unhealthy. Minimise outdoor travel shifts.",
              ["Full N95 coverage required for all outdoor travel.", "Rotate travelers to limit individual exposure time to 30 minutes continuously.", "Report deteriorating symptoms to your supervisor immediately."]),
        (300, "Very Unhealthy. Outdoor travel shifts should be suspended or moved indoors.",
              ["Do not perform outdoor travel unless safety equipment (N95 + goggles) is available.", "Escalate to management for emergency rotation or suspension."]),
        (999, "Hazardous. All outdoor travel must be suspended immediately.",
              ["Do not travel outdoors under any circumstances.", "Report the situation to your site safety officer.", "Seek medical attention if you have already been exposed."]),
    ],
    "student": [
        (100, "GO — Air quality is safe for all outdoor school activities today.",
              []),
        (150, "CAUTION — Move outdoor activities indoors for students with asthma or allergies. Healthy students may have reduced outdoor time.",
              ["Shorten outdoor periods to under 30 minutes.", "Keep asthmatic and allergic students indoors.", "Inform parents of the caution advisory."]),
        (999, "NO-GO — All outdoor activities must be cancelled today.",
              ["All physical education and recess should be held indoors.", "Keep school windows closed; use fans or AC in recirculation mode.", "Send a notification to parents."]),
    ],
}


def get_current_max_aqi(db: Session | None = None) -> float:
    """
    Get the current maximum AQI across all Lahore zones.

    Priority:
      1. True maximum AQI from DB readings in the last 2 hours (covers all zones)
      2. Live Open-Meteo fetch for Gulberg as fallback
      3. Default 150.0 if everything fails

    Using a 2-hour window ensures we capture the most recent ingestion batch
    for every zone, not just the single most-recently-written row (which could
    be from only one zone and understate the worst current air quality).
    """
    # Try DB first — max AQI across all zones in the last 2 hours
    if db:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
            max_aqi = (
                db.query(func.max(AqiReading.aqi))
                .filter(AqiReading.recorded_at >= cutoff)
                .scalar()
            )
            if max_aqi is not None:
                return float(max_aqi)
            # If no readings in the last 2 hours, fall back to the single latest row
            latest = (
                db.query(AqiReading)
                .order_by(AqiReading.recorded_at.desc())
                .first()
            )
            if latest:
                return float(latest.aqi)
        except Exception as exc:
            logger.warning("DB AQI read failed: %s", exc)

    # Fallback: live Open-Meteo for Gulberg (Lahore centre)
    try:
        resp = httpx.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude":  31.5204,
                "longitude": 74.3587,
                "current":   "us_aqi",
                "timezone":  "Asia/Karachi",
                "domains":   "cams_global",
            },
            timeout=8,
        )
        resp.raise_for_status()
        aqi = resp.json()["current"].get("us_aqi")
        if aqi is not None:
            return float(aqi)
    except Exception as exc:
        logger.warning("Open-Meteo advisory AQI fallback failed: %s", exc)

    # Last resort default
    return 150.0


def build_advisory(profile: str, db: Session | None = None) -> dict:
    """
    Return {message, actions, aqi} for the given profile based on current AQI.
    """
    aqi = get_current_max_aqi(db)
    rules = _RULES.get(profile, _RULES["citizen"])

    for threshold, message, actions in rules:
        if aqi <= threshold:
            return {"message": message, "actions": actions, "aqi": aqi}

    # Fallback to the most severe rule
    _, message, actions = rules[-1]
    return {"message": message, "actions": actions, "aqi": aqi}


def aqi_category(aqi: float) -> str:
    """Return the EPA AQI category label for a given AQI value."""
    if aqi <= 50:   return "Good"
    if aqi <= 100:  return "Moderate"
    if aqi <= 150:  return "Unhealthy for Sensitive Groups"
    if aqi <= 200:  return "Unhealthy"
    if aqi <= 300:  return "Very Unhealthy"
    return "Hazardous"


def aqi_colour(aqi: float) -> str:
    """Return the EPA hex colour code for a given AQI value."""
    if aqi <= 50:   return "#00e400"
    if aqi <= 100:  return "#ffff00"
    if aqi <= 150:  return "#ff7e00"
    if aqi <= 200:  return "#ff0000"
    if aqi <= 300:  return "#8f3f97"
    return "#7e0023"
