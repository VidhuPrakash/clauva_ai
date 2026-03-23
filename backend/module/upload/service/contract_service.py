from typing import Any, cast

from postgrest import CountMethod

from db.supabase_client import get_user_client


async def create_contract(user_id: str, name: str, token: str) -> str:
    client = get_user_client(token)
    result = (
        client.table("contracts")
        .insert({"user_id": user_id, "name": name, "status": "processing"})
        .execute()
    )
    data = cast(list[dict[str, Any]], result.data)
    return data[0]["id"]


async def update_status(contract_id: str, status: str, token: str) -> None:
    client = get_user_client(token)
    client.table("contracts").update({"status": status}).eq("id", contract_id).execute()


async def get_contracts(
    user_id: str,
    token: str,
    page: int = 1,
    limit: int = 10,
) -> dict[str, Any]:
    client = get_user_client(token)

    # calculate offset
    offset = (page - 1) * limit

    # get total count
    count_result = (
        client.table("contracts")
        .select("*", count=CountMethod.exact)
        .eq("user_id", user_id)
        .execute()
    )
    total = count_result.count or 0

    # get paginated data
    result = (
        client.table("contracts")
        .select("id, name, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    data = cast(list[dict[str, Any]], result.data)

    return {
        "contracts": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": -(-total // limit),
            "has_next": offset + limit < total,
            "has_prev": page > 1,
        },
    }


async def get_contract(
    contract_id: str, user_id: str, token: str
) -> dict[str, Any] | None:
    client = get_user_client(token)
    result = (
        client.table("contracts")
        .select("*")
        .eq("id", contract_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return cast(dict[str, Any] | None, result.data)
