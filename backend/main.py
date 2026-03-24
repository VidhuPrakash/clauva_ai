import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.supabase_auth import get_current_user
from core import logger
from module.admin.router.admin import router as admin_router
from module.query.router.query import router as query_router
from module.risk.router.risk import router as risk_router
from module.upload.router.upload import router as upload_router

_ready = False


async def _background_startup() -> None:
    global _ready
    try:
        logger.startup("Loading HuggingFace embedding model...")
        from services.embedder_service import get_embeddings

        get_embeddings()
        logger.success("Embedding model ready.")

        logger.startup("Initializing ChromaDB...")
        from services.vector_service import get_collection

        get_collection()
        logger.success("ChromaDB ready.")

        logger.startup("Checking CUAD knowledge base...")
        _ensure_knowledge_base()

        logger.startup("Initializing LLM client...")
        from services.llm_service import get_client

        get_client()
        logger.success(f"LLM ready — {os.getenv('HF_MODEL')}")

        _ready = True
        logger.success("All background services ready.")
    except Exception as e:
        logger.error(f"Background startup error: {e}")


def _ensure_knowledge_base() -> None:
    """
    Check if CUAD knowledge base exists in ChromaDB.
    If empty (first deploy or reset), rebuild it automatically.
    """
    from services.vector_service import get_knowledge_base

    kb = get_knowledge_base()
    existing = kb.get()

    if len(existing["ids"]) > 0:
        logger.success(f"CUAD knowledge base ready — {len(existing['ids'])} clauses.")
        return

    logger.warning("Knowledge base is empty — rebuilding from CUAD_v1.json...")

    cuad_path = os.path.join(os.path.dirname(__file__), "data", "CUAD_v1.json")

    if not os.path.exists(cuad_path):
        logger.error(
            f"CUAD_v1.json not found at {cuad_path} — risk scanner will not work."
        )
        return

    import json
    from typing import Any

    with open(cuad_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    clauses: list[dict[str, Any]] = []
    for contract in raw["data"]:
        for para in contract["paragraphs"]:
            for qa in para["qas"]:
                if qa["is_impossible"] or not qa["answers"]:
                    continue
                parts = qa["id"].split("__")
                label = parts[1] if len(parts) >= 2 else "Unknown"
                for answer in qa["answers"]:
                    text = answer["text"].strip()
                    if len(text) > 20:
                        clauses.append({"clause": text, "label": label})

    logger.info(f"Loaded {len(clauses)} clauses — embedding in batches...")

    BATCH_SIZE = 100
    texts = [c["clause"] for c in clauses]
    metadatas = [
        {"label": c["label"], "source": "cuad", "clause_index": i}
        for i, c in enumerate(clauses)
    ]
    ids = [f"cuad_{i}" for i in range(len(clauses))]

    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        batch_meta = metadatas[i : i + BATCH_SIZE]
        batch_ids = ids[i : i + BATCH_SIZE]
        kb.add_texts(
            texts=batch_texts,
            metadatas=batch_meta,
            ids=batch_ids,
        )
        logger.info(
            f"Knowledge base progress: {min(i + BATCH_SIZE, len(texts))}/{len(texts)}"
        )

    logger.success(f"Knowledge base rebuilt — {len(clauses)} clauses stored.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.startup("Clauva AI starting up...")

    loop = asyncio.get_event_loop()
    loop.create_task(_background_startup())

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
    return {"user_id": user["sub"], "email": user.get("email")}
