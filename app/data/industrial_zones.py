"""
Documented industrial areas in Lahore.

SOURCE: EPA Punjab (epd.punjab.gov.pk) and The Urban Unit's 2025
"Environmental Mapping of Industries in the Lahore Division" (official
Government of Punjab / EPA Punjab publication).

HONESTY RULE: These are documented industrial *areas*, not proof that a
specific factory is emitting at any given moment. Attribution in the app must
always be phrased "likely source" / "consistent with" — never "proven."
Each entry carries its source label for transparency.
"""

INDUSTRIAL_ZONES = [
    {
        "id":     "qie-kot-lakhpat",
        "name":   "Quaid-e-Azam Industrial Estate (Kot Lakhpat)",
        "lat":    31.4659,
        "lng":    74.3372,
        "source": "EPA Punjab / Kot Lakhpat industrial area",
    },
    {
        "id":     "sundar",
        "name":   "Sundar Industrial Estate (Raiwind Road)",
        "lat":    31.2811,
        "lng":    74.1788,
        "source": "EPA Punjab official (epd.punjab.gov.pk)",
    },
    {
        "id":     "shahdara-belt",
        "name":   "Shahdara Industrial Belt (Band Road)",
        "lat":    31.6356,
        "lng":    74.3117,
        "source": "Urban Unit 2025 industrial mapping",
    },
    {
        "id":     "kahna-ferozepur",
        "name":   "Kahna / Ferozepur Road Industrial Belt",
        "lat":    31.3900,
        "lng":    74.3800,
        "source": "Urban Unit 2025 industrial mapping",
    },
    {
        "id":     "multan-road",
        "name":   "Multan Road Industrial Corridor",
        "lat":    31.4550,
        "lng":    74.2600,
        "source": "Urban Unit 2025 industrial mapping",
    },
]

SOURCE_ATTRIBUTION = "EPA Punjab / Urban Unit 2025"
