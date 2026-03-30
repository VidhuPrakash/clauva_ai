import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.supabase_auth import get_current_user
from core import logger
from core.startup import background_startup
from module.admin.router.admin import router as admin_router
from module.profile.router.profile import router as profile_router
from module.query.router.query import router as query_router
from module.risk.router.risk import router as risk_router
from module.upload.router.upload import router as upload_router

_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.startup("Clauva AI starting up...")

    def set_ready(value: bool) -> None:
        global _ready
        _ready = value

    loop = asyncio.get_event_loop()
    loop.create_task(background_startup(set_ready))

    logger.success("Server ready — background services loading...")
    yield

    logger.shutdown("Clauva AI shutting down.")


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
app.include_router(profile_router)


@app.get("/health")
def health():
    return {"status": "ok", "project": "Clauva AI"}


@app.get("/ready")
def ready():
    return {
        "ready": _ready,
        "message": "All services ready" if _ready else "Services loading...",
    }


@app.get("/me")
def me(user=Depends(get_current_user)):
    role = (
        user.get("app_metadata", {}).get("role")
        or user.get("user_metadata", {}).get("role")
        or "user"
    )
    return {"user_id": user["sub"], "email": user.get("email"), "role": role}
