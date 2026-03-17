from typing import Any, cast

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
