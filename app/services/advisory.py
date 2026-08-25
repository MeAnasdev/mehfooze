"""
Advisory service — translates AQI forecast into plain-language, role-specific guidance.

Rule table (AQI → message + actions) per profile.
An AI layer can augment these rules in a future phase.
"""

# Rule-based advisory matrix  {profile: [(aqi_threshold, message, [actions])]}
_RULES: dict[str, list[tuple[int, str, list[str]]]] = {
    "citizen": [
        (50,  "Air quality is good. Enjoy outdoor activities freely.", []),
        (100, "Air quality is moderate. Sensitive individuals should limit prolonged outdoor exposure.", ["Avoid heavy outdoor exercise if you have asthma or heart conditions."]),
        (150, "Air quality is unhealthy for sensitive groups. Reduce outdoor time.", ["Wear an N95 mask outdoors.", "Keep windows closed."]),
        (200, "Air quality is unhealthy. Avoid outdoor activities.", ["Stay indoors as much as possible.", "Use an air purifier if available."]),
        (300, "Air quality is very unhealthy. Stay indoors.", ["Do not go outside unless essential.", "Wear an N95 mask even briefly outdoors."]),
        (999, "Hazardous air quality. Emergency conditions.", ["Stay indoors. Seal gaps in doors and windows.", "Seek medical attention if you experience breathing difficulty."]),
    ],
    "parent": [
        (50,  "Good air quality — children can play outside safely.", []),
        (100, "Moderate air quality. Children with asthma should stay indoors during peak hours (6–10 AM).", ["Monitor children with respiratory conditions."]),
        (150, "Outdoor AQI is unhealthy today — keep children indoors, especially 6–10 AM.", ["Cancel outdoor PE or recess.", "Ensure good indoor ventilation."]),
        (200, "Unhealthy air. Keep children indoors for the day.", ["No outdoor activities.", "Run an air purifier in children's rooms."]),
        (999, "Hazardous. Children must not go outside.", ["School should consider closure or indoor-only day.", "Contact school administration."]),
    ],
    "patient": [
        (50,  "Good conditions for respiratory patients today.", []),
        (100, "Moderate AQI. Take your prescribed medication before going out.", ["Carry your inhaler.", "Avoid high-traffic areas."]),
        (150, "Unhealthy for sensitive groups. Avoid outdoor exposure.", ["Stay indoors.", "Use prescribed medication as directed.", "Wear N95 if you must go out."]),
        (200, "Unhealthy air. High risk for respiratory patients.", ["Do not go outside.", "Contact your doctor if symptoms worsen."]),
        (999, "Hazardous. Seek medical advice immediately if experiencing symptoms.", ["Emergency level — stay indoors.", "Call emergency services if breathing is severely impaired."]),
    ],
    "worker": [
        (50,  "Safe conditions for outdoor work today.", []),
        (100, "Moderate AQI. Take regular breaks in ventilated areas.", ["Wear a basic dust mask if working in heavy traffic."]),
        (150, "Unhealthy for prolonged outdoor work. Limit exposure.", ["Wear an N95 mask.", "Take 10-minute indoor breaks every hour.", "Stay hydrated."]),
        (200, "Unhealthy conditions. Minimise outdoor work shifts.", ["Full N95 coverage required.", "Seek shade and limit continuous outdoor time to 30 min."]),
        (999, "Hazardous. Outdoor work should be suspended.", ["Do not work outdoors.", "Report conditions to your supervisor."]),
    ],
    "school": [
        (100, "GO — Outdoor activities are safe today.", []),
        (150, "CAUTION — Outdoor activities for sensitive students should be moved indoors.", ["Shorten outdoor periods.", "Keep asthmatic students inside."]),
        (999, "NO-GO — Outdoor activities should be cancelled today.", ["All physical education and recess should be held indoors.", "Notify parents if outdoor exposure occurred."]),
    ],
}


def _current_max_aqi() -> float:
    """
    Placeholder — in production this queries the latest reading from the DB or cache.
    Returns a representative city-wide AQI.
    """
    # TODO: replace with a real DB / cache query
    return 145.0


def build_advisory(profile: str) -> dict:
    """Return {message, actions} for the given profile based on current AQI."""
    aqi = _current_max_aqi()
    rules = _RULES.get(profile, _RULES["citizen"])

    for threshold, message, actions in rules:
        if aqi <= threshold:
            return {"message": message, "actions": actions}

    # Fallback to last rule
    _, message, actions = rules[-1]
    return {"message": message, "actions": actions}
