import json
import os
from typing import Callable

from dotenv import load_dotenv
from langchain_chroma import Chroma

from core import logger
from services.embedder_service import get_embeddings

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
KNOWLEDGE_BASE_COLLECTION = "knowledge_base"
CUAD_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "CUAD_v1.json"
)


def ensure_knowledge_base() -> None:
    logger.startup("Checking knowledge base...")

    embeddings = get_embeddings()
    vectorstore = Chroma(
        collection_name=KNOWLEDGE_BASE_COLLECTION,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )

    existing = vectorstore.get()
    if len(existing["ids"]) > 0:
        logger.success(f"Knowledge base ready — {len(existing['ids'])} clauses loaded.")
        return

    logger.warning("Knowledge base is empty. Building from CUAD dataset...")

    if not os.path.exists(CUAD_JSON_PATH):
        logger.error(
            f"CUAD_v1.json not found at {CUAD_JSON_PATH}. Skipping knowledge base build."
        )
        return

    with open(CUAD_JSON_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    texts, metadatas, ids = [], [], []
    idx = 0

    for contract in raw["data"]:
        for para in contract["paragraphs"]:
            for qa in para["qas"]:
                if qa["is_impossible"] or not qa["answers"]:
                    continue
                parts = qa["id"].split("__")
                label = parts[1] if len(parts) >= 2 else "Unknown"
                for answer in qa["answers"]:
                    clause_text = answer["text"].strip()
                    if len(clause_text) < 20:
                        continue
                    texts.append(clause_text)
                    metadatas.append(
                        {"label": label, "source": "cuad", "clause_index": idx}
                    )
                    ids.append(f"cuad_{idx}")
                    idx += 1

    BATCH_SIZE = 100
    for i in range(0, len(texts), BATCH_SIZE):
        vectorstore.add_texts(
            texts=texts[i : i + BATCH_SIZE],
            metadatas=metadatas[i : i + BATCH_SIZE],
            ids=ids[i : i + BATCH_SIZE],
        )
        logger.info(f"Stored {min(i + BATCH_SIZE, len(texts))}/{len(texts)} clauses...")

    logger.success(f"Knowledge base built — {len(texts)} clauses stored.")


async def background_startup(set_ready: Callable[[bool], None]) -> None:
    try:
        logger.startup("Loading embedding model...")
        get_embeddings()
        logger.success("Embedding model ready.")

        ensure_knowledge_base()

        set_ready(True)
        logger.success("All background services ready.")
    except Exception as exc:
        logger.error(f"Background startup failed: {exc}")
