from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from auth.supabase_auth import get_admin_user
from module.admin.controller.admin_controller import (
    handle_delete_user,
    handle_get_all_contracts,
    handle_get_all_users,
    handle_get_stats,
    handle_get_user_detail,
    handle_update_user,
)


class UserUpdateRequest(BaseModel):
    role: str
    full_name: str | None = None
    country: str | None = None
    language: str | None = None


router = APIRouter(prefix="/admin", tags=["admin"])


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


@router.get("/contracts")
async def get_all_contracts(
    admin=Depends(get_admin_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
):
    return await handle_get_all_contracts(page=page, limit=limit)


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
    return await handle_get_user_detail(user_id)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdateRequest,
    admin=Depends(get_admin_user),
):
    return await handle_update_user(
        user_id,
        body.role,
        full_name=body.full_name,
        country=body.country,
        language=body.language,
    )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin=Depends(get_admin_user),
):
    return await handle_delete_user(user_id)
