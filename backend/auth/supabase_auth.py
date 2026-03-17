import os
import time

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWK

from core import logger

load_dotenv()

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_jwks_cache: dict = {}
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600


def _get_public_key(kid: str) -> PyJWK:
    global _jwks_cache, _jwks_cache_time

    if not _jwks_cache or (time.time() - _jwks_cache_time) > JWKS_CACHE_TTL:
        logger.info("Fetching JWKS from Supabase...")
        try:
            response = httpx.get(JWKS_URL, timeout=10)
            response.raise_for_status()
            _jwks_cache = {key["kid"]: key for key in response.json().get("keys", [])}
            _jwks_cache_time = time.time()
            logger.success("JWKS fetched and cached.")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            if _jwks_cache:
                logger.warning("Using stale JWKS cache.")
            else:
                raise HTTPException(status_code=503, detail="Auth service unavailable")

    if kid not in _jwks_cache:
        raise HTTPException(status_code=401, detail="Unknown token key")

    # PyJWK handles the conversion correctly and is fully type-safe
    return PyJWK.from_dict(_jwks_cache[kid])


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "ES256")

        if not kid:
            raise HTTPException(status_code=401, detail="Token missing kid")

        pyjwk = _get_public_key(kid)

        # use pyjwk.key — this is the properly typed public key object
        payload = jwt.decode(
            token,
            pyjwk.key,
            algorithms=[alg],
            options={"verify_aud": False},
        )

        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token structure")

        return payload

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_admin_user(user=Depends(get_current_user)):
    from db.supabase_client import supabase_admin

    result = (
        supabase_admin.table("profiles")
        .select("role")
        .eq("id", user["sub"])
        .single()
        .execute()
    )
    if (
        not result.data
        or not isinstance(result.data, dict)
        or result.data.get("role") != "admin"
    ):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
