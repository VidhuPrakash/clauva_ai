from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth.supabase_auth import get_current_user, get_token
from module.query.controller.query_controller import (
    handle_get_history,
    handle_query,
)

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    contract_id: str
    question: str


@router.post("")
async def query_contract(
    body: QueryRequest,
    user=Depends(get_current_user),
    token: str = Depends(get_token),
):
    if not body.contract_id.strip() or not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="contract_id and question are required",
        )

    return await handle_query(
        contract_id=body.contract_id,
        question=body.question,
        user_id=user["sub"],
        token=token,
    )


@router.get("/history/{contract_id}")
async def get_history(
    contract_id: str,
    user=Depends(get_current_user),
    token: str = Depends(get_token),
):
    return await handle_get_history(
        contract_id=contract_id,
        user_id=user["sub"],
        token=token,
    )
