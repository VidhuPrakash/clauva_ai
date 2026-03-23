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
        .select("id, email, role, created_at")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "users": cast(list[dict[str, Any]], result.data),
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
        .select("id, email, role, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return cast(dict[str, Any] | None, result.data)


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


async def get_stats() -> dict[str, Any]:
    users = (
        supabase_admin.table("profiles").select("*", count=CountMethod.exact).execute()
    )
    contracts = (
        supabase_admin.table("contracts").select("*", count=CountMethod.exact).execute()
    )
    queries = (
        supabase_admin.table("queries").select("*", count=CountMethod.exact).execute()
    )
    flags = (
        supabase_admin.table("risk_flags")
        .select("*", count=CountMethod.exact)
        .execute()
    )
    return {
        "total_users": users.count or 0,
        "total_contracts": contracts.count or 0,
        "total_queries": queries.count or 0,
        "total_risk_flags": flags.count or 0,
    }
