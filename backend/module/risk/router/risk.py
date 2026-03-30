from fastapi import APIRouter, Depends

from auth.supabase_auth import get_current_user, get_token
from module.risk.controller.risk_controller import (
    handle_get_flags,
    handle_risk_scan,
)
from services.vector_service import get_all_chunks, search_knowledge_base

router = APIRouter(prefix="/risk-scan", tags=["risk"])


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
    token: str = Depends(get_token),
):
    return await handle_get_flags(contract_id=contract_id, token=token)


@router.get("/{contract_id}")
async def risk_scan(
    contract_id: str,
    user=Depends(get_current_user),
    token: str = Depends(get_token),
):
    lang = user["user_metadata"].get("language", "en")
    return await handle_risk_scan(
        contract_id=contract_id,
        user_id=user["sub"],
        token=token,
        lang=lang,
    )
