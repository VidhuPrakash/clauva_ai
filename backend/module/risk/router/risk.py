from fastapi import APIRouter, Depends

from auth.supabase_auth import get_current_user

router = APIRouter(prefix="/risk-scan", tags=["risk"])


@router.get("/{contract_id}")
async def risk_scan(contract_id: str, user=Depends(get_current_user)):
    return {"message": "risk route ready", "contract_id": contract_id}
