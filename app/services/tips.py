"""
Proactive tips service — time-based contextual suggestions from Rio.
Returns tips based on time of day + AQI level + user profile.
"""

from datetime import datetime, timezone

try:
    from app.config import settings
except ModuleNotFoundError:
    from config import settings

# Time-of-day periods
def _get_period(hour: int) -> str:
    if 5 <= hour < 9:
        return "morning"
    if 9 <= hour < 12:
        return "late_morning"
    if 12 <= hour < 15:
        return "afternoon"
    if 15 <= hour < 18:
        return "late_afternoon"
    if 18 <= hour < 21:
        return "evening"
    return "night"

# Tips organized by [aqi_range][period][profile]
TIPS = {
    "good": {
        "morning": {
            "default": "Air quality is great this morning. Perfect time for a walk or outdoor exercise!",
            "parent": "Great morning for outdoor play! Let the kids enjoy the fresh air.",
            "patient": "Air quality is good. A gentle morning walk is safe for you today.",
        },
        "afternoon": {
            "default": "Air stays clear this afternoon. Enjoy outdoor activities freely.",
            "parent": "Afternoon air looks good. Outdoor sports and playdates are safe.",
            "patient": "Good air quality this afternoon. Safe for light outdoor activity.",
        },
        "evening": {
            "default": "Evening air is clean. A great time for a stroll.",
            "parent": "Evening air is pleasant. Family outdoor time is safe.",
            "patient": "Good conditions for an evening walk.",
        },
    },
    "moderate": {
        "morning": {
            "default": "Morning air is moderate. Sensitive groups should pace outdoor activity.",
            "parent": "Air is okay but not great. Limit prolonged outdoor play for kids.",
            "patient": "Moderate air this morning. Keep outdoor exertion light.",
            "worker": "Moderate conditions. Wear a mask if working outdoors for extended periods.",
        },
        "afternoon": {
            "default": "Afternoon AQI is rising. Consider shorter outdoor time.",
            "parent": "Air quality dipping this afternoon. Move activities indoors if possible.",
            "patient": "Afternoon air is thicker. Stay indoors or wear a mask outside.",
        },
        "late_afternoon": {
            "default": "Peak pollution hours approaching. Avoid strenuous outdoor activity until evening.",
            "parent": "4-6 PM is peak pollution. Keep kids indoors during this window.",
            "patient": "Late afternoon is the worst time for air quality today. Stay in.",
            "worker": "Peak hours: take more frequent breaks if outdoors.",
        },
        "evening": {
            "default": "Air quality improving as evening sets in. Light outdoor activity is fine.",
            "parent": "Evening air is clearing up. Safe for outdoor play now.",
            "patient": "Evening conditions are better. A short walk is okay.",
        },
    },
    "unhealthy": {
        "morning": {
            "default": "Air quality is unhealthy this morning. Limit outdoor time and wear an N95 if you must go out.",
            "parent": "Keep children indoors today. Air quality is unhealthy.",
            "patient": "Stay indoors. Use air purifier if available.",
            "worker": "Unhealthy conditions. N95 mask required for outdoor work. Take frequent breaks.",
        },
        "afternoon": {
            "default": "Afternoon air is harmful. Avoid outdoor exertion. Keep windows closed.",
            "parent": "Do not let children play outside. Air quality is dangerous.",
            "patient": "Remain indoors. Run air purifier on high.",
        },
        "late_afternoon": {
            "default": "Worst air quality of the day. Stay indoors, seal windows, use air purifier.",
            "parent": "Dangerous air quality. All outdoor activities cancelled.",
            "patient": "Emergency-level air quality. Stay indoors, seal gaps, purify air.",
        },
        "evening": {
            "default": "Air still unhealthy. Stay in until AQI drops below 100.",
            "parent": "Keep kids inside this evening. Air quality hasn't improved enough.",
            "patient": "Evening air remains unhealthy. Continue staying indoors.",
        },
    },
}


def get_tip(profile: str = "citizen", aqi: float = 50) -> dict:
    """Get a proactive tip based on current conditions."""
    now = datetime.now(timezone.utc)
    # Convert to Pakistan time (UTC+5)
    hour = (now.hour + 5) % 24
    period = _get_period(hour)

    # Determine AQI tier
    if aqi <= 50:
        tier = "good"
    elif aqi <= 150:
        tier = "moderate"
    else:
        tier = "unhealthy"

    # Get tip for profile, fallback to default
    tier_tips = TIPS.get(tier, TIPS["moderate"])
    period_tips = tier_tips.get(period, tier_tips.get("afternoon", {}))
    tip = period_tips.get(profile) or period_tips.get("default", "Stay safe and check air quality before heading out.")

    return {
        "tip": tip,
        "period": period,
        "aqiTier": tier,
        "aqi": aqi,
        "profile": profile,
        "generatedAt": now.isoformat(),
    }
