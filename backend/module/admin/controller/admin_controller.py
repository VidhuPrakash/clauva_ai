from typing import Any

from fastapi import HTTPException

from module.admin.service.profile_service import (
    delete_user,
    get_all_contracts,
    get_all_users,
    get_stats,
    get_user_by_id,
    get_user_contracts,
    get_user_queries,
    update_user,
)


async def handle_get_stats() -> dict[str, Any]:
    """
    Retrieves the admin stats.

    Returns:
        dict[str, Any]: A dictionary containing the total number of users, contracts, queries, and risk flags.
    """
    stats = await get_stats()
    return stats


async def handle_get_all_contracts(
    page: int,
    limit: int,
) -> dict[str, Any]:
    return await get_all_contracts(page=page, limit=limit)


async def handle_get_all_users(
    page: int,
    limit: int,
) -> dict[str, Any]:
    result = await get_all_users(page=page, limit=limit)

    # enrich each user with contract count
    enriched = []
    for user in result["users"]:
        contracts = await get_user_contracts(user["id"])
        enriched.append(
            {
                **user,
                "contract_count": len(contracts),
            }
        )

    result["users"] = enriched
    return result


async def handle_get_user_detail(user_id: str) -> dict[str, Any]:
    """
    Retrieves the detail of a user, including their profile, contract count, query count, and a summary of their activities.

    Parameters:
        user_id (str): The ID of the user.

    Returns:
        dict[str, Any]: A dictionary containing the user's profile, contract count, query count, and a summary of their activities.

    Raises:
        HTTPException: If the user is not found.
    """
    profile = await get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    contracts = await get_user_contracts(user_id)
    queries = await get_user_queries(user_id)

    return {
        "profile": profile,
        "contracts": contracts,
        "queries": queries,
        "summary": {
            "total_contracts": len(contracts),
            "total_queries": len(queries),
        },
    }


async def handle_update_user(
    user_id: str,
    role: str,
    full_name: str | None = None,
    country: str | None = None,
    language: str | None = None,
) -> dict[str, Any]:
    profile = await get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await update_user(
        user_id, role, full_name=full_name, country=country, language=language
    )
    return updated or {}


async def handle_delete_user(user_id: str) -> dict[str, str]:
    profile = await get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    await delete_user(user_id)
    return {"message": "User deleted"}
