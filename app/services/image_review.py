"""
Image review flagging for citizen report photos (Phase 4 — EXPERIMENTAL).

HONESTY / SCOPE — read this before extending:
  This module does NOT claim to verify that a photo shows real pollution.
  We have no validated Lahore-specific pollution image classifier, so we do
  not present any automated output as "verified" or "proven".

  What it DOES do:
    - Perform lightweight, transparent heuristic checks (photo present?
      corroborated by sensor? plausible type/location?) to decide whether a
      report should be prioritised for HUMAN review.
    - Always label its output as "experimental" and route uncertain cases to
      a human, never auto-approve or auto-reject based on the image.

  This is the honest version: assistive triage for human reviewers, not a
  black-box "AI verification" claim.
"""

import logging

logger = logging.getLogger(__name__)


def assess_report_for_review(report) -> dict:
    """
    Produce an experimental review recommendation for a pollution report.

    Inputs come from the already-computed corroboration fields on the report
    (sensor_corroborated, likely_source, photo presence). We deliberately do
    NOT run an unvalidated image classifier and present it as truth.

    Returns:
      {
        "reviewPriority": "high" | "normal" | "low",
        "humanReviewRecommended": bool,
        "signals": [str, ...],       # transparent reasons
        "experimental": True,        # always — never presented as verified
        "note": str,
      }
    """
    signals: list[str] = []
    score = 0

    has_photo = bool(getattr(report, "photo_url", None))
    if has_photo:
        signals.append("Photo evidence attached")
        score += 1
    else:
        signals.append("No photo attached — weaker evidence")

    if getattr(report, "sensor_corroborated", False):
        signals.append("Nearby sensor shows elevated AQI (corroborated)")
        score += 2

    if getattr(report, "likely_source", None):
        signals.append(f"Near documented industrial area: {report.likely_source}")
        score += 1

    # Decide priority — higher score = stronger case worth prioritising
    if score >= 3:
        priority = "high"
    elif score >= 1:
        priority = "normal"
    else:
        priority = "low"

    return {
        "reviewPriority": priority,
        # We ALWAYS recommend a human makes the final call — no auto-verification.
        "humanReviewRecommended": True,
        "signals": signals,
        "experimental": True,
        "note": (
            "Experimental triage only. This does not verify the photo's contents. "
            "A human reviewer makes the final decision."
        ),
    }
