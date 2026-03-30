import os
from typing import cast

from dotenv import load_dotenv

from core import logger

load_dotenv()

# ── Provider selection ────────────────────────────────────────────────────────
# Set LLM_PROVIDER to one of: groq | ollama | hf
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()

# ── Per-task model names ──────────────────────────────────────────────────────
# Fast YES/NO model used for risk clause verification
RISK_VERIFY_MODEL = os.getenv("RISK_VERIFY_MODEL", "llama-3.1-8b-instant")
# Capable model used for contract Q&A answers
QA_MODEL = os.getenv("QA_MODEL", "llama-3.3-70b-versatile")

# ── Provider credentials / config ─────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
HF_TOKEN = os.getenv("HF_TOKEN", "")

_SYSTEM = (
    "You are a legal contract analyst. "
    "Answer questions accurately based only on the provided contract clauses."
)


# ── Provider implementations ──────────────────────────────────────────────────


def _ask_groq(prompt: str, model: str) -> str:
    from groq import Groq

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        max_tokens=512,
        temperature=0.3,
    )
    return cast(str, response.choices[0].message.content).strip()


def _ask_ollama(prompt: str, model: str) -> str:
    import ollama

    client = ollama.Client(host=OLLAMA_BASE_URL)
    response = client.chat(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        options={"temperature": 0.3},
    )
    return response.message.content.strip()


def _ask_hf(prompt: str, model: str) -> str:
    from huggingface_hub import InferenceClient

    client = InferenceClient(provider="auto", api_key=HF_TOKEN)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ],
        max_tokens=512,
        temperature=0.3,
    )
    return cast(str, response.choices[0].message.content).strip()


def _ask(prompt: str, model: str) -> str:
    if LLM_PROVIDER == "groq":
        return _ask_groq(prompt, model)
    elif LLM_PROVIDER == "ollama":
        return _ask_ollama(prompt, model)
    elif LLM_PROVIDER == "hf":
        return _ask_hf(prompt, model)
    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER '{LLM_PROVIDER}'. Valid options: groq, ollama, hf"
        )


def ask_verify_llm(prompt: str) -> str:
    """Fast YES/NO model for risk clause verification (RISK_VERIFY_MODEL)."""
    try:
        return _ask(prompt, RISK_VERIFY_MODEL)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise Exception(f"LLM failed: {str(e)}")


def ask_qa_llm(prompt: str) -> str:
    """Capable model for contract Q&A answers (QA_MODEL)."""
    try:
        return _ask(prompt, QA_MODEL)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise Exception(f"LLM failed: {str(e)}")


# Backward-compat alias
def ask_llm(prompt: str) -> str:
    return ask_qa_llm(prompt)
