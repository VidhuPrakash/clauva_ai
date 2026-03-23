from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer

from auth.supabase_auth import get_admin_user
from module.admin.controller.admin_controller import (
    handle_get_all_users,
    handle_get_stats,
    handle_get_user_detail,
)

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()


@router.get("/stats")
async def get_stats(
    admin=Depends(get_admin_user),
):
    """
    Retrieves the admin stats.

    Returns:
        dict: A dictionary containing the total number of users, contracts, queries, and risk flags.
    """
    return await handle_get_stats()


@router.get("/users")
async def get_all_users(
    admin=Depends(get_admin_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
):
    return await handle_get_all_users(page=page, limit=limit)


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin=Depends(get_admin_user),
):
    """
    Retrieves the detail of a user.

    Parameters:
        user_id (str): The ID of the user.

    Returns:
        dict: A dictionary containing the user's profile, contracts, queries, and a summary of their activities.
    """
    return await handle_get_user_detail(user_id)
