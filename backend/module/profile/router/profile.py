from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth.supabase_auth import get_current_user
from module.profile.controller.profile_controller import handle_update_profile

router = APIRouter(prefix="/me", tags=["profile"])


class ProfileUpdateRequest(BaseModel):
    country: str | None = None
    timezone: str | None = None
    language: str | None = None


@router.patch("/profile")
async def update_my_profile(
    body: ProfileUpdateRequest,
    user=Depends(get_current_user),
):
    return await handle_update_profile(
        user_id=user["sub"],
        country=body.country,
        timezone=body.timezone,
        language=body.language,
    )
