from typing import Any

from fastapi import HTTPException

from module.upload.service.contract_service import (
    create_contract,
    get_contracts,
    update_status,
)
from services.pdf_service import extract_and_chunk
from services.vector_service import store_chunks


async def handle_upload(
    file_bytes: bytes, filename: str, user_id: str, token: str
) -> dict:

    try:
        chunks = extract_and_chunk(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if len(chunks) == 0:
        raise HTTPException(
            status_code=400, detail="No text could be extracted from this PDF"
        )

    # create contract record
    contract_id = await create_contract(user_id, filename, token)
    # store in ChromaDB
    try:
        store_chunks(chunks, contract_id, user_id)
    except Exception as e:
        await update_status(contract_id, "failed", token)
        raise HTTPException(status_code=500, detail=f"Vector store failed: {str(e)}")

    #  mark ready
    await update_status(contract_id, "ready", token)
    return {
        "contract_id": contract_id,
        "filename": filename,
        "chunks_count": len(chunks),
        "status": "ready",
    }


async def handle_list_contracts(
    user_id: str,
    token: str,
    page: int,
    limit: int,
) -> dict[str, Any]:
    result = await get_contracts(
        user_id=user_id,
        token=token,
        page=page,
        limit=limit,
    )
    return result
