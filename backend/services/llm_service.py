import os
from typing import cast

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

from core import logger

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")

_client = None


def get_client() -> InferenceClient:
    global _client
    if _client is None:
        _client = InferenceClient(
            provider="auto",
            api_key=HF_TOKEN,
        )
    return _client


def ask_llm(prompt: str) -> str:

    try:
        client = get_client()

        response = client.chat.completions.create(
            model=HF_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal contract analyst. Answer questions accurately based only on the provided contract clauses.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=512,
            temperature=0.3,
        )

        result = cast(str, response.choices[0].message.content).strip()

        return result

    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise Exception(f"LLM failed: {str(e)}")
