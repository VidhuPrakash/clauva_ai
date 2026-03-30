from typing import Any

from db.supabase_client import supabase_admin


async def update_profile(
    user_id: str,
    country: str | None,
    timezone: str | None,
    language: str | None,
) -> None:
    patch: dict[str, Any] = {}
    if country is not None:
        patch["country"] = country
    if timezone is not None:
        patch["timezone"] = timezone
    if language is not None:
        patch["language"] = language
    if patch:
        supabase_admin.table("profiles").update(patch).eq("id", user_id).execute()
