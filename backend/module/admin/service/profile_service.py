from datetime import datetime, timedelta, timezone
from typing import Any, cast

from postgrest import CountMethod

from db.supabase_client import supabase_admin


async def get_all_users(
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    offset = (page - 1) * limit

    count_result = (
        supabase_admin.table("profiles").select("*", count=CountMethod.exact).execute()
    )
    total = count_result.count or 0

    result = (
        supabase_admin.table("profiles")
        .select("id, email, role, created_at, country, language")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    # Merge full_name from Auth user_metadata
    auth_users = supabase_admin.auth.admin.list_users()
    auth_map = {u.id: (u.user_metadata or {}).get("full_name", "") for u in auth_users}
    users: list[dict[str, Any]] = result.data or []
    for u in users:
        u["full_name"] = auth_map.get(u["id"], "")

    return {
        "users": users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": -(-total // limit),
            "has_next": offset + limit < total,
            "has_prev": page > 1,
        },
    }


async def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    result = (
        supabase_admin.table("profiles")
        .select("id, email, role, created_at, country, language")
        .eq("id", user_id)
        .single()
        .execute()
    )
    profile = cast(dict[str, Any] | None, result.data)
    if profile:
        auth_res = supabase_admin.auth.admin.get_user_by_id(user_id)
        profile["full_name"] = (
            (auth_res.user.user_metadata or {}).get("full_name", "")
            if auth_res.user
            else ""
        )
    return profile


async def update_user(
    user_id: str,
    role: str,
    full_name: str | None = None,
    country: str | None = None,
    language: str | None = None,
) -> dict[str, Any] | None:
    patch: dict[str, Any] = {"role": role}
    if country is not None:
        patch["country"] = country
    if language is not None:
        patch["language"] = language
    supabase_admin.table("profiles").update(patch).eq("id", user_id).execute()
    auth_attrs: dict[str, Any] = {"app_metadata": {"role": role}}
    if full_name is not None:
        auth_attrs["user_metadata"] = {"full_name": full_name}
    supabase_admin.auth.admin.update_user_by_id(user_id, auth_attrs)
    return await get_user_by_id(user_id)


async def delete_user(user_id: str) -> None:
    supabase_admin.table("profiles").delete().eq("id", user_id).execute()
    supabase_admin.auth.admin.delete_user(user_id)


async def get_user_contracts(user_id: str) -> list[dict[str, Any]]:
    result = (
        supabase_admin.table("contracts")
        .select("id, name, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return cast(list[dict[str, Any]], result.data)


async def get_user_queries(user_id: str) -> list[dict[str, Any]]:
    result = (
        supabase_admin.table("queries")
        .select("id, question, answer, created_at, contract_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return cast(list[dict[str, Any]], result.data)


async def get_all_contracts(
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    offset = (page - 1) * limit

    count_result = (
        supabase_admin.table("contracts").select("*", count=CountMethod.exact).execute()
    )
    total = count_result.count or 0

    result = (
        supabase_admin.table("contracts")
        .select("id, name, status, created_at, user_id, profiles(email)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    contracts = []
    for c in result.data or []:
        profile = c.pop("profiles", None) or {}
        contracts.append({**c, "user_email": profile.get("email", "")})

    return {
        "contracts": contracts,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": -(-total // limit),
            "has_next": offset + limit < total,
            "has_prev": page > 1,
        },
    }


async def get_stats() -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    def count(table: str, **filters: str) -> int:
        q = supabase_admin.table(table).select("*", count=CountMethod.exact)
        for col, val in filters.items():
            q = q.eq(col, val)
        return q.execute().count or 0

    def count_since(table: str, since: str) -> int:
        return (
            supabase_admin.table(table)
            .select("*", count=CountMethod.exact)
            .gte("created_at", since)
            .execute()
            .count
            or 0
        )

    total_users = count("profiles")
    total_contracts = count("contracts")
    total_queries = count("queries")
    total_risk_flags = count("risk_flags")

    new_users_week = count_since("profiles", week_ago)
    new_users_month = count_since("profiles", month_ago)
    new_contracts_week = count_since("contracts", week_ago)
    new_contracts_month = count_since("contracts", month_ago)
    queries_week = count_since("queries", week_ago)

    contracts_ready = count("contracts", status="ready")
    contracts_processing = count("contracts", status="processing")
    contracts_failed = count("contracts", status="failed")

    return {
        "total_users": total_users,
        "total_contracts": total_contracts,
        "total_queries": total_queries,
        "total_risk_flags": total_risk_flags,
        "new_users_week": new_users_week,
        "new_users_month": new_users_month,
        "new_contracts_week": new_contracts_week,
        "new_contracts_month": new_contracts_month,
        "queries_week": queries_week,
        "contracts_ready": contracts_ready,
        "contracts_processing": contracts_processing,
        "contracts_failed": contracts_failed,
        "avg_contracts_per_user": round(total_contracts / total_users, 1)
        if total_users
        else 0,
    }
