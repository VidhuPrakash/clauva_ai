import json
import os
import sys
from typing import Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from langchain_chroma import Chroma

from core.logger import error, info, startup, success, warning
from services.embedder_service import get_embeddings

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
KNOWLEDGE_BASE_COLLECTION = "knowledge_base"
BATCH_SIZE = 100
CUAD_JSON_PATH = os.path.join(os.path.dirname(__file__), "CUAD_v1.json")


def load_cuad_from_json() -> list[dict[str, Any]]:
    startup("Loading CUAD from local JSON file...")

    if not os.path.exists(CUAD_JSON_PATH):
        error(f"CUAD_v1.json not found at {CUAD_JSON_PATH}")
        error(
            "Run: Invoke-WebRequest -Uri 'https://huggingface.co/datasets/theatticusproject/cuad/resolve/main/CUAD_v1/CUAD_v1.json' -OutFile 'scripts/CUAD_v1.json'"
        )
        return []

    with open(CUAD_JSON_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    clauses: list[dict[str, Any]] = []

    for contract in raw["data"]:
        for para in contract["paragraphs"]:
            for qa in para["qas"]:
                # skip unanswerable questions
                if qa["is_impossible"]:
                    continue
                if not qa["answers"]:
                    continue

                # extract label from question id
                # format: "ContractName__LabelName__index"
                parts = qa["id"].split("__")
                label = parts[1] if len(parts) >= 2 else "Unknown"

                for answer in qa["answers"]:
                    clause_text = answer["text"].strip()
                    if len(clause_text) < 20:
                        continue
                    clauses.append(
                        {
                            "clause": clause_text,
                            "label": label,
                        }
                    )

    success(f"Loaded {len(clauses)} labeled clauses from CUAD JSON.")
    return clauses


def build() -> None:
    # load CUAD from local JSON
    ds = load_cuad_from_json()
    if not ds:
        return

    # load embeddings
    startup("Loading embedding model...")
    embeddings = get_embeddings()
    success("Embedding model ready.")

    # connect to ChromaDB
    startup(f"Connecting to ChromaDB at {CHROMA_PERSIST_DIR}...")
    vectorstore = Chroma(
        collection_name=KNOWLEDGE_BASE_COLLECTION,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )

    # check if already built
    existing = vectorstore.get()
    if len(existing["ids"]) > 0:
        warning(f"Knowledge base already has {len(existing['ids'])} entries.")
        answer = input("Rebuild? (y/n): ").strip().lower()
        if answer != "y":
            info("Skipping rebuild.")
            return
        vectorstore.delete_collection()
        vectorstore = Chroma(
            collection_name=KNOWLEDGE_BASE_COLLECTION,
            embedding_function=embeddings,
            persist_directory=CHROMA_PERSIST_DIR,
        )

    # embed and store in batches
    startup(f"Embedding {len(ds)} clauses in batches of {BATCH_SIZE}...")

    texts: list[str] = []
    metadatas: list[dict] = []
    ids: list[str] = []
    stored = 0

    for i, row in enumerate(ds):
        texts.append(row["clause"])
        metadatas.append(
            {
                "label": row["label"],
                "source": "cuad",
                "clause_index": i,
            }
        )
        ids.append(f"cuad_{i}")

        if len(texts) >= BATCH_SIZE:
            vectorstore.add_texts(
                texts=texts,
                metadatas=metadatas,
                ids=ids,
            )
            stored += len(texts)
            info(f"Progress: {stored}/{len(ds)} clauses stored...")
            texts = []
            metadatas = []
            ids = []

    # store remaining
    if texts:
        vectorstore.add_texts(
            texts=texts,
            metadatas=metadatas,
            ids=ids,
        )
        stored += len(texts)

    total = vectorstore.get()
    success(f"Knowledge base built — {len(total['ids'])} clauses stored in ChromaDB.")
    success("You can now run the risk scanner.")


if __name__ == "__main__":
    build()
