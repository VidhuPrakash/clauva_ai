import json

from fastapi import HTTPException

from core.risk_rules import get_explanation, get_severity, is_boilerplate, is_skip_label
from module.risk.service.risk_service import get_flags, save_flags
from services.llm_service import ask_llm
from services.translation_service import is_supported, translate_risk_flags
from services.vector_service import get_all_chunks, search_knowledge_base


def _verify_with_llm(clause: str, risk_type: str, explanation: str) -> bool:
    """
    Ask Qwen to verify if this clause genuinely contains the flagged risk.
    Returns True if confirmed, False if false positive.
    """
    prompt = f"""You are a legal risk analyst. A risk scanner flagged this contract clause.
Your job is to verify if the flag is correct.

Contract clause:
\"\"\"{clause}\"\"\"

Flagged risk: {risk_type}
Risk description: {explanation}

Does this clause genuinely contain or represent a '{risk_type}' risk?
Answer with JSON only, no explanation outside JSON:
{{"confirmed": true or false, "reason": "one sentence"}}"""

    try:
        response = ask_llm(prompt)
        # extract JSON from response
        start = response.find("{")
        end = response.rfind("}") + 1
        if start == -1 or end == 0:
            return True  # if LLM fails, keep the flag
        result = json.loads(response[start:end])
        return bool(result.get("confirmed", True))
    except Exception:
        return True  # if parsing fails, keep the flag


async def handle_risk_scan(
    contract_id: str,
    user_id: str,
    token: str,
    lang: str = "en",
) -> dict:

    # validate language
    if lang != "en" and not is_supported(lang):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{lang}'. Supported: ml, ta, ar, hi, kn, te, en",
        )

    existing_flags = await get_flags(contract_id, token)
    if existing_flags:
        translated = translate_risk_flags(existing_flags, lang)
        return _format_response(translated, contract_id, cached=True, lang=lang)

    clauses = get_all_chunks(contract_id)

    if not clauses:
        raise HTTPException(
            status_code=404,
            detail="No clauses found. Please upload the contract first.",
        )

    findings = []

    for i, clause in enumerate(clauses):
        if len(clause.strip()) < 100:
            continue

        if is_boilerplate(clause):
            continue

        matches = search_knowledge_base(
            clause=clause,
            top_k=3,
            score_threshold=0.75,
        )

        if not matches:
            continue

        seen_labels: set[str] = set()

        for match in matches:
            cuad_label = str(match.get("label", ""))

            if cuad_label in seen_labels:
                continue
            if is_skip_label(cuad_label):
                continue

            seen_labels.add(cuad_label)
            severity = get_severity(cuad_label)
            explanation = get_explanation(cuad_label)

            if match["similarity"] < 0.90:
                confirmed = _verify_with_llm(clause, cuad_label, explanation)
                if not confirmed:
                    continue

            findings.append(
                {
                    "clause_text": clause[:500],
                    "risk_type": cuad_label,
                    "severity": severity,
                    "explanation": explanation,
                    "detection_method": "cuad_semantic",
                    "matched_clause": match["matched_clause"],
                    "similarity_score": match["similarity"],
                }
            )

    if findings:
        await save_flags(contract_id, findings, token)
    # translate explanations if needed
    translated_findings = translate_risk_flags(findings, lang)

    return _format_response(translated_findings, contract_id, cached=False, lang=lang)


def _format_response(
    findings: list[dict],
    contract_id: str,
    cached: bool,
    lang: str = "en",
) -> dict:
    high = [f for f in findings if f.get("severity") == "HIGH"]
    medium = [f for f in findings if f.get("severity") == "MEDIUM"]
    low = [f for f in findings if f.get("severity") == "LOW"]

    return {
        "contract_id": contract_id,
        "cached": cached,
        "lang": lang,
        "summary": {
            "total_flags": len(findings),
            "high": len(high),
            "medium": len(medium),
            "low": len(low),
        },
        "flags": findings,
    }


async def handle_get_flags(
    contract_id: str,
    token: str,
) -> list[dict]:
    return await get_flags(contract_id, token)
