import os

from dotenv import load_dotenv
from langchain_chroma import Chroma

from core import logger
from services.embedder_service import get_embeddings

load_dotenv()

_vectorstore = None


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
