import re
from io import BytesIO

import pdfplumber


def extract_and_chunk(file_bytes: bytes) -> list[str]:
    """
    Extract text from a PDF and split it into clauses.

    Args:
        file_bytes (bytes): The contents of the PDF file

    Returns:
        list[str]: A list of clauses extracted from the PDF
    """
    text = _extract_text(file_bytes)
    chunks = _split_into_clauses(text)
    return chunks


def _extract_text(file_bytes: bytes) -> str:
    """
    Extract text from a PDF file.

    Args:
        file_bytes (bytes): The contents of the PDF file

    Returns:
        str: The text extracted from the PDF file
    """

    text = ""
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def _split_into_clauses(text: str) -> list[str]:
    # Split on common legal clause patterns
    """
    Split a given text into clauses based on common legal clause patterns.

    Args:
        text (str): The text to be split into clauses

    Returns:
        list[str]: A list of clauses extracted from the text

    The function splits the text into clauses based on the following patterns:

    - WHEREAS
    - NOW THEREFORE
    - ARTICLE <number>
    - Section <number>
    - <number>. <capital letter>
    - (<lowercase letter>) <capital letter>

    If a chunk is too long, it is further split into smaller pieces by paragraph.
    If no clauses are found, the text is chunked by paragraph as a fallback.

    """
    pattern = r"(?=(?:WHEREAS|NOW[,\s]+THEREFORE|ARTICLE\s+\w+|Section\s+\d+|\d+\.\s+[A-Z]|\([a-z]\)\s+[A-Z]))"
    raw_chunks = re.split(pattern, text)

    clauses = []
    for chunk in raw_chunks:
        chunk = chunk.strip()
        # skip empty or too short chunks
        if len(chunk) < 50:
            continue
        # if chunk is too long, split into smaller pieces by paragraph
        if len(chunk) > 1000:
            sub_chunks = _split_by_paragraph(chunk)
            clauses.extend(sub_chunks)
        else:
            clauses.append(chunk)

    # fallback: if no clauses found, chunk by paragraph
    if len(clauses) == 0:
        clauses = _split_by_paragraph(text)

    return clauses


def _split_by_paragraph(text: str) -> list[str]:
    """
    Split a given text into paragraphs.

    Args:
        text (str): The text to be split into paragraphs

    Returns:
        list[str]: A list of paragraphs extracted from the text

    The function splits the text into paragraphs based on two or more line breaks.
    It then filters out any empty or too short paragraphs (less than 50 characters) and
    returns the remaining paragraphs.
    """
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if len(p.strip()) > 50]
