from fastapi import APIRouter, Depends

from auth.supabase_auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def stats(admin=Depends(get_admin_user)):
    return {"message": "admin stats ready"}


@router.get("/users")
async def users(admin=Depends(get_admin_user)):
    return {"message": "admin users ready"}


@router.get("/users/{user_id}")
async def user_detail(user_id: str, admin=Depends(get_admin_user)):
    return {"message": "admin user detail ready", "user_id": user_id}
