import os
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.supabase_auth import get_current_user
from core import logger
from module.admin.router.admin import router as admin_router
from module.query.router.query import router as query_router
from module.risk.router.risk import router as risk_router
from module.upload.router.upload import router as upload_router
from services.embedder_service import get_embeddings
from services.vector_service import get_collection


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.startup("Clauva AI starting up...")

    # warm up JWKS cache on startup
    logger.startup("Fetching Supabase JWKS public keys...")
    try:
        # trigger a fetch by calling with a dummy kid — it will cache all keys
        supabase_url = os.getenv("SUPABASE_URL")
        jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
        response = httpx.get(jwks_url, timeout=10)
        response.raise_for_status()
        import time

        keys = {k["kid"]: k for k in response.json().get("keys", [])}
        # update the module-level cache directly
        import auth.supabase_auth as auth_module

        auth_module._jwks_cache = keys
        auth_module._jwks_cache_time = time.time()
        logger.success(f"JWKS cached — {len(keys)} key(s) loaded.")
    except Exception as e:
        logger.warning(f"Could not prefetch JWKS: {e} — will fetch on first request.")

    logger.startup("Loading embedding model...")
    get_embeddings()
    logger.success("Embedding model ready.")

    logger.startup("Initializing ChromaDB...")
    get_collection()
    logger.success("ChromaDB ready.")

    logger.success("Clauva AI is ready to accept requests.")
    yield

    logger.shutdown("Clauva AI shutting down. Goodbye.")


app = FastAPI(title="Clauva AI API", version="1.0.0", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(query_router)
app.include_router(risk_router)
app.include_router(admin_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(user=Depends(get_current_user)):
    return {"user_id": user["sub"], "email": user.get("email")}
