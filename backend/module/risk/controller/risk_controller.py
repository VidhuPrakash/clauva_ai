import json

from fastapi import HTTPException

from core.risk_rules import get_explanation, get_severity, is_boilerplate, is_skip_label
from module.risk.service.risk_service import get_flags, save_flags
from services.llm_service import ask_qa_llm, ask_verify_llm
from services.translation_service import is_supported, translate_risk_flags
from services.vector_service import get_all_chunks, search_knowledge_base

# Circuit-breaker: set to False when quota/payment errors are detected
_llm_available: bool = True


def _verify_with_llm(clause: str, risk_type: str, explanation: str) -> bool:
    """
    Use RISK_VERIFY_MODEL to verify if this clause genuinely contains the flagged risk.
    Returns True if confirmed, False if false positive.
    Disables itself for the rest of the process when quota is exhausted (402).
    """
    global _llm_available
    if not _llm_available:
        return True  # API unavailable — keep the flag

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
        response = ask_verify_llm(prompt)
        start = response.find("{")
        end = response.rfind("}") + 1
        if start == -1 or end == 0:
            return True  # if LLM fails, keep the flag
        result = json.loads(response[start:end])
        return bool(result.get("confirmed", True))
    except Exception as e:
        err = str(e)
        if "402" in err or "Payment Required" in err or "credits" in err.lower():
            _llm_available = False
            print(
                "[WARN] LLM quota exhausted — skipping LLM verification for this scan"
            )
        return True  # keep the flag


def _generate_overall_review(findings: list[dict]) -> str:
    """Ask the LLM to produce a one-paragraph plain-English overview of the risk findings."""
    if not findings:
        return "No significant risks were detected in this contract."

    high = [f for f in findings if f.get("severity") == "HIGH"]
    medium = [f for f in findings if f.get("severity") == "MEDIUM"]
    low = [f for f in findings if f.get("severity") == "LOW"]

    risk_summary = "\n".join(
        f"- [{f['severity']}] {f['risk_type']}: {f['explanation']}"
        for f in findings[:15]  # cap to avoid huge prompts
    )

    prompt = f"""You are a legal risk analyst. Based on the following risk flags found in a contract, write a concise 2-3 sentence plain-English overall assessment. Mention the most critical issues and the general risk level.

Risk flags:
{risk_summary}

Stats: {len(high)} HIGH, {len(medium)} MEDIUM, {len(low)} LOW risk flags.

Write only the assessment paragraph, no headings or bullet points."""

    try:
        return ask_qa_llm(prompt).strip()
    except Exception:
        # Fallback to a simple template summary if LLM is unavailable
        parts = []
        if high:
            parts.append(
                f"{len(high)} high-severity issue(s) including {high[0]['risk_type']}"
            )
        if medium:
            parts.append(f"{len(medium)} medium-severity issue(s)")
        if low:
            parts.append(f"{len(low)} low-severity issue(s)")
        return (
            f"This contract has {len(findings)} risk flag(s): " + ", ".join(parts) + "."
        )


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
        overall_review = _generate_overall_review(translated)
        return _format_response(
            translated,
            contract_id,
            cached=True,
            lang=lang,
            overall_review=overall_review,
        )

    clauses = get_all_chunks(contract_id)
    print(f"[DEBUG] Total clauses: {len(clauses)}")
    if not clauses:
        raise HTTPException(
            status_code=404,
            detail="No clauses found. Please upload the contract first.",
        )

    findings = []

    for i, clause in enumerate(clauses):
        if len(clause.strip()) < 100:
            print(
                f"[DEBUG] Clause {i} skipped: too short ({len(clause.strip())} chars)"
            )
            continue

        if is_boilerplate(clause):
            print(f"[DEBUG] Clause {i} skipped: boilerplate")
            continue

        matches = search_knowledge_base(
            clause=clause,
            top_k=3,
            score_threshold=0.45,
        )
        print(
            f"[DEBUG] Clause {i} matches: {len(matches)} — scores: {[m['similarity'] for m in matches]}"
        )
        if not matches:
            continue

        seen_labels: set[str] = set()

        for match in matches:
            cuad_label = str(match.get("label", ""))
            print(
                f"[DEBUG]   label={cuad_label}, similarity={match['similarity']}, skip={is_skip_label(cuad_label)}"
            )
            if cuad_label in seen_labels:
                continue
            if is_skip_label(cuad_label):
                continue

            seen_labels.add(cuad_label)
            severity = get_severity(cuad_label)
            explanation = get_explanation(cuad_label)

            if match["similarity"] < 0.52:
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
    overall_review = _generate_overall_review(translated_findings)

    return _format_response(
        translated_findings,
        contract_id,
        cached=False,
        lang=lang,
        overall_review=overall_review,
    )


def _format_response(
    findings: list[dict],
    contract_id: str,
    cached: bool,
    lang: str = "en",
    overall_review: str = "",
) -> dict:
    high = [f for f in findings if f.get("severity") == "HIGH"]
    medium = [f for f in findings if f.get("severity") == "MEDIUM"]
    low = [f for f in findings if f.get("severity") == "LOW"]

    return {
        "contract_id": contract_id,
        "cached": cached,
        "lang": lang,
        "overall_review": overall_review,
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
