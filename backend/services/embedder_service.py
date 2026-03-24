import os

from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY")
EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
API_URL = (
    f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"
)


_embeddings = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HF_TOKEN", "")
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def embed_text(text: str) -> list[float]:
    """
    Embeds a given text using the HuggingFace embeddings model.

    Args:
        text: The text to embed.

    Returns:
        A list of floats representing the embedding of the text.
    """
    embeddings = get_embeddings()
    result = embeddings.embed_query(text)
    return result


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """
    Embeds a list of text chunks using the HuggingFace embeddings model.

    Args:
        chunks: A list of text chunks to embed.

    Returns:
        A list of lists of floats, where each inner list represents the embedding of a text chunk.
    """
    embeddings = get_embeddings()
    result = embeddings.embed_documents(chunks)
    return result
