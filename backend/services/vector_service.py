import os
from typing import Any

from dotenv import load_dotenv
from langchain_chroma import Chroma
from sentence_transformers import CrossEncoder

from services.embedder_service import get_embeddings

load_dotenv()

_vectorstore = None
KNOWLEDGE_BASE_COLLECTION = "knowledge_base"
_knowledge_base: Chroma | None = None
_reranker: CrossEncoder | None = None


def get_collection() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        _vectorstore = Chroma(
            collection_name="contracts",
            embedding_function=get_embeddings(),
            persist_directory=persist_dir,
        )
    return _vectorstore


def store_chunks(
    chunks: list[str],
    contract_id: str,
    user_id: str,
) -> None:
    vectorstore = get_collection()
    metadatas = [
        {
            "contract_id": contract_id,
            "user_id": user_id,
            "clause_index": i,
        }
        for i in range(len(chunks))
    ]
    ids = [f"{contract_id}_{i}" for i in range(len(chunks))]
    vectorstore.add_texts(
        texts=chunks,
        metadatas=metadatas,
        ids=ids,
    )


def retrieve_chunks(
    query: str,
    contract_id: str,
    top_k: int = 5,
) -> list[dict]:
    vectorstore = get_collection()
    results = vectorstore.similarity_search_with_score(
        query=query,
        k=top_k,
        filter={"contract_id": contract_id},
    )
    chunks = []
    for doc, score in results:
        chunks.append(
            {
                "text": doc.page_content,
                "clause_index": doc.metadata.get("clause_index"),
                "score": score,
            }
        )
    return chunks


def get_all_chunks(contract_id: str) -> list[str]:
    vectorstore = get_collection()
    results = vectorstore.get(
        where={"contract_id": contract_id},
        include=["documents"],
    )
    docs = results.get("documents", [])
    return docs


def get_knowledge_base() -> Chroma:
    global _knowledge_base
    if _knowledge_base is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        _knowledge_base = Chroma(
            collection_name=KNOWLEDGE_BASE_COLLECTION,
            embedding_function=get_embeddings(),
            persist_directory=persist_dir,
        )

    return _knowledge_base


def search_knowledge_base(
    clause: str,
    top_k: int = 3,
    score_threshold: float = 0.75,
) -> list[dict[str, Any]]:
    kb = get_knowledge_base()

    results = kb.similarity_search_with_relevance_scores(
        query=clause,
        k=top_k,
    )

    matches: list[dict[str, Any]] = []
    for doc, score in results:
        if score < score_threshold:
            continue
        matches.append(
            {
                "matched_clause": doc.page_content[:300],
                "label": doc.metadata.get("label"),
                "similarity": round(score, 4),
                "source": "cuad",
            }
        )

    return matches
