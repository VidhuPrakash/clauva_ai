from fastapi import APIRouter, Depends

from auth.supabase_auth import get_current_user

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def query_contract(user=Depends(get_current_user)):
    return {"message": "query route ready"}
