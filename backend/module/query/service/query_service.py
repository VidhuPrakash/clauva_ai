from typing import Any, cast

from db.supabase_client import get_user_client


async def save_query(
    user_id: str,
    contract_id: str,
    question: str,
    answer: str,
    sources: list[dict],
    token: str,
) -> str:
    """
    Saves a query to the database.

    Args:
        user_id (str): The ID of the user who made the query.
        contract_id (str): The ID of the contract the query was made on.
        question (str): The question asked by the user.
        answer (str): The answer to the question.
        sources (list[dict]): A list of sources used to answer the question.
        token (str): The JWT token of the user.

    Returns:
        str: The ID of the saved query.
    """
    client = get_user_client(token)
    result = (
        client.table("queries")
        .insert(
            {
                "user_id": user_id,
                "contract_id": contract_id,
                "question": question,
                "answer": answer,
                "sources": sources,
            }
        )
        .execute()
    )
    data = cast(list[dict[str, Any]], result.data)
    return data[0]["id"]


async def get_query_history(
    contract_id: str,
    user_id: str,
    token: str,
) -> list[dict[str, Any]]:
    """
    Retrieves the query history for a given contract and user.

    Args:
        contract_id (str): The ID of the contract.
        user_id (str): The ID of the user.
        token (str): The JWT token of the user.

    Returns:
        list[dict[str, Any]]: A list of queries, each containing the question, answer, sources, created_at, and contract_id.
    """
    client = get_user_client(token)
    result = (
        client.table("queries")
        .select("*")
        .eq("contract_id", contract_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return cast(list[dict[str, Any]], result.data)
