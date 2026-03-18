from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth.supabase_auth import get_current_user
from module.query.controller.query_controller import (
    handle_get_history,
    handle_query,
)

router = APIRouter(prefix="/query", tags=["query"])
security = HTTPBearer()


class QueryRequest(BaseModel):
    contract_id: str
    question: str


@router.post("")
async def query_contract(
    body: QueryRequest,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Queries a contract to answer a user's question.

    Parameters:
        body (QueryRequest): The request body containing the contract_id and question.
        user (Depends): The authenticated user.
        credentials (HTTPAuthorizationCredentials): The JWT token of the user.

    Raises:
        HTTPException: If contract_id or question is empty.

    Returns:
        dict: The answer to the user's question, along with the sources and contract_id.
    """
    if not body.contract_id.strip() or not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="contract_id and question are required",
        )

    return await handle_query(
        contract_id=body.contract_id,
        question=body.question,
        user_id=user["sub"],
        token=credentials.credentials,
    )


@router.get("/history/{contract_id}")
async def get_history(
    contract_id: str,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Retrieves the query history for a given contract and user.

    Parameters:
        contract_id (str): The ID of the contract.
        user (Depends): The authenticated user.
        credentials (HTTPAuthorizationCredentials): The JWT token of the user.

    Returns:
        list[dict]: A list of queries, each containing the question, answer, sources, created_at, and contract_id.
    """
    return await handle_get_history(
        contract_id=contract_id,
        user_id=user["sub"],
        token=credentials.credentials,
    )
