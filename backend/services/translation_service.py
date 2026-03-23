import os

import requests
from dotenv import load_dotenv

from core import logger

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
TRANSLATION_MODEL = "facebook/nllb-200-distilled-600M"
TRANSLATION_URL = f"https://api-inference.huggingface.co/models/{TRANSLATION_MODEL}"

# NLLB-200 language codes
LANGUAGE_CODES: dict[str, str] = {
    "ml": "mal_Mlym",
    "ta": "tam_Taml",
    "ar": "arb_Arab",
    "hi": "hin_Deva",
    "kn": "kan_Knda",
    "te": "tel_Telu",
    "en": "eng_Latn",
}

SUPPORTED_LANGUAGES = set(LANGUAGE_CODES.keys())


def is_supported(lang: str) -> bool:
    return lang in SUPPORTED_LANGUAGES


def translate(text: str, target_lang: str) -> str:
    """
    Translate text from English to target language.
    Returns original text if lang is 'en' or unsupported.
    """
    if not text or not text.strip():
        return text

    if target_lang == "en" or target_lang not in LANGUAGE_CODES:
        return text

    target_code = LANGUAGE_CODES[target_lang]
    source_code = LANGUAGE_CODES["en"]

    logger.info(f"Translating to {target_lang} ({target_code})...")

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": text,
        "parameters": {
            "src_lang": source_code,
            "tgt_lang": target_code,
        },
    }

    try:
        response = requests.post(
            TRANSLATION_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and result:
            translated = result[0].get("translation_text", text)
            logger.success(f"Translation complete → {target_lang}")
            return translated

        if isinstance(result, dict) and "error" in result:
            logger.error(f"Translation API error: {result['error']}")
            return text

        return text

    except requests.exceptions.Timeout:
        logger.error("Translation request timed out — returning original text")
        return text
    except Exception as e:
        logger.error(f"Translation failed: {e} — returning original text")
        return text


def translate_risk_flags(
    flags: list[dict],
    target_lang: str,
) -> list[dict]:
    """
    Translate explanation field of each risk flag.
    clause_text and matched_clause stay in English for accuracy.
    """
    if target_lang == "en":
        return flags

    translated_flags = []
    for flag in flags:
        translated_flag = {**flag}
        if flag.get("explanation"):
            translated_flag["explanation"] = translate(
                flag["explanation"],
                target_lang,
            )
        translated_flags.append(translated_flag)

    return translated_flags
