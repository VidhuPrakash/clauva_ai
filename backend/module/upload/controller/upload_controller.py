from fastapi import HTTPException

from core import logger
from module.upload.service.contract_service import (
    create_contract,
    update_status,
)
from services.pdf_service import extract_and_chunk
from services.vector_service import store_chunks


async def handle_upload(
    file_bytes: bytes, filename: str, user_id: str, token: str
) -> dict:

    # extract and chunk
    logger.info(f"Extracting text from {filename}...")
    try:
        chunks = extract_and_chunk(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if len(chunks) == 0:
        raise HTTPException(
            status_code=400, detail="No text could be extracted from this PDF"
        )

    logger.success(f"Extracted {len(chunks)} clauses from {filename}.")

    # create contract record
    contract_id = await create_contract(user_id, filename, token)
    logger.info(f"Contract created: {contract_id}")

    # store in ChromaDB
    try:
        store_chunks(chunks, contract_id, user_id)
    except Exception as e:
        await update_status(contract_id, "failed", token)
        raise HTTPException(status_code=500, detail=f"Vector store failed: {str(e)}")

    #  mark ready
    await update_status(contract_id, "ready", token)
    logger.success(f"Contract {contract_id} is ready.")

    return {
        "contract_id": contract_id,
        "filename": filename,
        "chunks_count": len(chunks),
        "status": "ready",
    }
