"""
GET /api/advisory/{profile} — plain-language advisory per user profile.
Profiles: citizen | parent | patient | worker | school
"""

from fastapi import APIRouter, Path
from pydantic import BaseModel
from datetime import datetime, timezone

from app.services.advisory import build_advisory

router = APIRouter(tags=["advisory"])


class AdvisoryOut(BaseModel):
    profile: str
    message: str
    actions: list[str]
    generatedAt: str


VALID_PROFILES = {"citizen", "parent", "patient", "worker", "school"}


@router.get("/advisory/{profile}", response_model=AdvisoryOut)
def get_advisory(
    profile: str = Path(..., description="User profile"),
):
    """Return a role-specific plain-language advisory based on the current forecast."""
    if profile not in VALID_PROFILES:
        profile = "citizen"  # graceful fallback

    advisory = build_advisory(profile)
    return AdvisoryOut(
        profile=profile,
        message=advisory["message"],
        actions=advisory["actions"],
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )
