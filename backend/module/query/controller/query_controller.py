from fastapi import HTTPException

from module.query.service.query_service import get_query_history, save_query
from services.llm_service import ask_llm
from services.vector_service import retrieve_chunks


def _build_prompt(question: str, chunks: list[dict]) -> str:
    """
    Builds a prompt for the LLM to generate an answer.

    The prompt consists of the following parts:

    - An instruction to the LLM to answer the user's question using only the provided contract clauses.
    - A set of rules to follow when generating the answer.
    - The contract clauses.
    - The user's question.

    The LLM is expected to generate an answer in the format of "ANSWER: <answer>"

    Parameters:
        question (str): The user's question.
        chunks (list[dict]): A list of dictionaries, each containing the text of a contract clause.

    Returns:
        str: The prompt for the LLM.
    """
    context = "\n\n".join(
        [f"Clause {i + 1}:\n{chunk['text']}" for i, chunk in enumerate(chunks)]
    )

    return f"""You are a legal contract analyst. \
Answer the user's question using ONLY the contract clauses provided below.

Rules:
- If the answer is not in the clauses, say exactly: \
"This information is not found in the provided contract."
- Never use knowledge outside the contract clauses.
- Be concise and clear.
- Always cite which clause number your answer comes from.

CONTRACT CLAUSES:
{context}

USER QUESTION:
{question}

ANSWER:"""


async def handle_query(
    contract_id: str,
    question: str,
    user_id: str,
    token: str,
) -> dict:
    # retrieve relevant chunks
    """
    Handles a query from a user.

    Retrieves relevant chunks from the contract, builds a prompt for the LLM, asks the LLM, formats the sources, and saves the query to Supabase.

    Args:
        contract_id (str): The ID of the contract.
        question (str): The user's question.
        user_id (str): The ID of the user.
        token (str): The JWT token of the user.

    Returns:
        dict: A dictionary containing the answer, sources, and contract_id.
    """
    chunks = retrieve_chunks(
        query=question,
        contract_id=contract_id,
        top_k=5,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No content found for this contract. Please upload it first.",
        )

    #  build prompt
    prompt = _build_prompt(question, chunks)

    #  ask LLM
    try:
        answer = ask_llm(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # format sources
    sources = [
        {
            "clause_index": chunk.get("clause_index"),
            "text": chunk["text"][:300],
            "score": round(chunk.get("score", 0), 4),
        }
        for chunk in chunks
    ]

    # save to Supabase
    await save_query(
        user_id=user_id,
        contract_id=contract_id,
        question=question,
        answer=answer,
        sources=sources,
        token=token,
    )

    return {
        "answer": answer,
        "sources": sources,
        "contract_id": contract_id,
    }


async def handle_get_history(
    contract_id: str,
    user_id: str,
    token: str,
) -> list[dict]:
    """
    Retrieves the query history for a given contract and user.

    Parameters:
        contract_id (str): The ID of the contract.
        user_id (str): The ID of the user.
        token (str): The JWT token of the user.

    Returns:
        list[dict]: A list of queries, each containing the question, answer, sources, created_at, and contract_id.
    """
    history = await get_query_history(contract_id, user_id, token)
    return history
