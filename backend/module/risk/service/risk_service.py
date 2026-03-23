from typing import Any, cast

from db.supabase_client import get_user_client


async def save_flags(
    contract_id: str,
    findings: list[dict],
    token: str,
) -> None:
    """
    Saves the risk findings to the database.

    Parameters:
        contract_id (str): The ID of the contract.
        findings (list[dict]): A list of risk findings, each containing the clause_text, risk_type, severity, explanation, and detection_method.
        token (str): The JWT token of the user.

    Returns:
        None
    """
    if not findings:
        return

    client = get_user_client(token)
    rows = [
        {
            "contract_id": contract_id,
            "clause_text": f["clause_text"],
            "risk_type": f["risk_type"],
            "severity": f["severity"],
            "explanation": f["explanation"],
            "detection_method": f["detection_method"],
        }
        for f in findings
    ]
    client.table("risk_flags").insert(rows).execute()


async def get_flags(
    contract_id: str,
    token: str,
) -> list[dict[str, Any]]:
    """
    Retrieves the risk findings for a given contract and user.

    Parameters:
        contract_id (str): The ID of the contract.
        token (str): The JWT token of the user.

    Returns:
        list[dict[str, Any]]: A list of risk findings, each containing the clause_text, risk_type, severity, explanation, and detection_method.
    """
    client = get_user_client(token)
    result = (
        client.table("risk_flags")
        .select("*")
        .eq("contract_id", contract_id)
        .order("severity", desc=False)
        .execute()
    )
    return cast(list[dict[str, Any]], result.data)
