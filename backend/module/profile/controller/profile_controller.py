from module.profile.service.profile_service import update_profile


async def handle_update_profile(
    user_id: str,
    country: str | None,
    timezone: str | None,
    language: str | None,
) -> dict:
    await update_profile(user_id, country, timezone, language)
    return {"ok": True}
