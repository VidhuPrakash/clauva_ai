import os
from typing import Any

import numpy as np
from dotenv import load_dotenv
from langchain_chroma import Chroma
from sentence_transformers import CrossEncoder

from core import logger
from services.embedder_service import get_embeddings

load_dotenv()

_vectorstore = None
KNOWLEDGE_BASE_COLLECTION = "knowledge_base"
_knowledge_base: Chroma | None = None
_reranker: CrossEncoder | None = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        logger.startup("Loading cross-encoder reranker...")
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        logger.success("Cross-encoder reranker loaded.")
    return _reranker


def get_collection() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        logger.startup(f"Connecting to ChromaDB at {persist_dir}...")
        _vectorstore = Chroma(
            collection_name="contracts",
            embedding_function=get_embeddings(),
            persist_directory=persist_dir,
        )
        logger.success("ChromaDB collection ready.")
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
    logger.success(f"Stored {len(chunks)} chunks in ChromaDB.")


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
    logger.info(f"Retrieved {len(chunks)} chunks from ChromaDB.")
    return chunks


def get_all_chunks(contract_id: str) -> list[str]:
    vectorstore = get_collection()
    results = vectorstore.get(
        where={"contract_id": contract_id},
        include=["documents"],
    )
    docs = results.get("documents", [])
    logger.info(f"Fetched {len(docs)} total chunks for contract.")
    return docs


def get_knowledge_base() -> Chroma:
    global _knowledge_base
    if _knowledge_base is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        logger.startup("Connecting to CUAD knowledge base...")
        _knowledge_base = Chroma(
            collection_name=KNOWLEDGE_BASE_COLLECTION,
            embedding_function=get_embeddings(),
            persist_directory=persist_dir,
        )
        logger.success("CUAD knowledge base ready.")
    return _knowledge_base


def search_knowledge_base(
    clause: str,
    top_k: int = 3,
    score_threshold: float = 0.75,
) -> list[dict[str, Any]]:
    kb = get_knowledge_base()

    results = kb.similarity_search_with_relevance_scores(
        query=clause,
        k=15,
    )

    if not results:
        return []

    reranker = get_reranker()
    pairs = [[clause, doc.page_content] for doc, _ in results]
    raw_scores = reranker.predict(pairs)

    # normalize raw logit scores to 0-1 using sigmoid
    def sigmoid(x: float) -> float:
        return float(1 / (1 + np.exp(-x)))

    reranked: list[dict[str, Any]] = [
        {
            "doc": doc,
            "score": sigmoid(float(raw_scores[i])),
        }
        for i, (doc, _) in enumerate(results)
    ]

    reranked.sort(key=lambda x: float(x["score"]), reverse=True)

    matches: list[dict[str, Any]] = []
    for item in reranked[:top_k]:
        if float(item["score"]) < score_threshold:
            continue
        matches.append(
            {
                "matched_clause": item["doc"].page_content[:300],
                "label": item["doc"].metadata.get("label"),
                "similarity": round(float(item["score"]), 4),
                "source": "cuad",
            }
        )

    return matches
