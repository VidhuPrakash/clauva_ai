from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.supabase_auth import get_current_user
from module.risk.controller.risk_controller import (
    handle_get_flags,
    handle_risk_scan,
)
from services.vector_service import get_all_chunks, search_knowledge_base

router = APIRouter(prefix="/risk-scan", tags=["risk"])
security = HTTPBearer()


@router.get("/debug/{contract_id}")
async def debug_scan(
    contract_id: str,
    user=Depends(get_current_user),
):
    clauses = get_all_chunks(contract_id)
    results = []
    for clause in clauses:
        matches = search_knowledge_base(
            clause=clause,
            top_k=3,
            score_threshold=0.0,
        )
        results.append(
            {
                "clause_preview": clause[:150],
                "top_matches": matches,
            }
        )
    return results


@router.get("/flags/{contract_id}")
async def get_flags(
    contract_id: str,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    return await handle_get_flags(
        contract_id=contract_id,
        token=credentials.credentials,
    )


@router.get("/{contract_id}")
async def risk_scan(
    contract_id: str,
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    lang: str = Query(default="en"),  # ← add lang param
):
    return await handle_risk_scan(
        contract_id=contract_id,
        user_id=user["sub"],
        token=credentials.credentials,
        lang=lang,
    )
