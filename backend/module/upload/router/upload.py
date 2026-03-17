from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi import File as FileParam
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth.supabase_auth import get_current_user
from module.upload.controller.upload_controller import handle_upload

router = APIRouter(prefix="/upload", tags=["upload"])
security = HTTPBearer()


@router.post("")
async def upload_contract(
    file: UploadFile = FileParam(...),
    user=Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    user_id = user["sub"]
    token = credentials.credentials  # ← raw JWT string

    return await handle_upload(file_bytes, file.filename, user_id, token)
