from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.supabase_client import supabase_admin

security = HTTPBearer()


def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Returns the raw Bearer token string."""
    return credentials.credentials


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Validate the Bearer token by asking Supabase directly."""
    try:
        response = supabase_admin.auth.get_user(credentials.credentials)
        user = response.user if response else None
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        app_meta = user.app_metadata or {}
        user_meta = user.user_metadata or {}

        # JWT metadata often lacks `role` — fall back to the profiles table
        role = app_meta.get("role") or user_meta.get("role")
        if not role:
            try:
                profile = (
                    supabase_admin.table("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single()
                    .execute()
                )
                role = (profile.data or {}).get("role", "user")
            except Exception:
                role = "user"

        return {
            "sub": user.id,
            "email": user.email,
            "app_metadata": {**app_meta, "role": role},
            "user_metadata": user_meta,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_admin_user(user=Depends(get_current_user)):
    role = user["app_metadata"].get("role") or user["user_metadata"].get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
