"""Vector embeddings for semantic standards search.

Lazy-loads standards embeddings per (state, grade) into memory. Each entry
is cached to disk on first compute so we embed every standard at most once.

Uses OpenAI `text-embedding-3-small` (1536-dim, $0.02/1M tokens — ~$0.0002 to
embed a full state+grade catalog of 500 standards).

Fails open: if OPENAI_API_KEY is missing or the API errors, returns None and
the caller falls back to the keyword-based scorer.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from pathlib import Path
from threading import Lock
from typing import Optional

import numpy as np
from openai import OpenAI

from config import settings

logger = logging.getLogger(__name__)

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536
CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "embeddings"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache keyed by (state, grade) → (codes: list[str], matrix: np.ndarray)
_CACHE: dict[tuple[str, str], tuple[list[str], np.ndarray, str]] = {}
_LOCK = Lock()


def _cache_path(state: str, grade: str) -> Path:
    return CACHE_DIR / f"{state.upper()}_{grade}.npz"


def _manifest_hash(items: list[dict]) -> str:
    """Hash of the standards payload — lets us invalidate the cache when the
    underlying catalog changes (re-ingested JSON, new enrichments)."""
    h = hashlib.sha256()
    for std in items:
        h.update(std.get("code", "").encode())
        h.update(b"\x00")
        h.update((std.get("description_plain") or std.get("description") or "").encode())
        h.update(b"\x01")
    return h.hexdigest()[:16]


def _build_text(std: dict) -> str:
    """Compose the text we embed for a single standard. Mirrors what the
    keyword scorer looks at so queries align on the same surface."""
    parts = [
        std.get("description_plain") or std.get("description") or "",
        std.get("domain") or "",
        std.get("cluster") or "",
        std.get("subject") or "",
    ]
    return " ".join(p for p in parts if p).strip()


def _get_client() -> Optional[OpenAI]:
    key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
    if not key or key == "dummy":
        return None
    try:
        return OpenAI(api_key=key, timeout=20.0)
    except Exception as e:
        logger.warning("OpenAI client init failed: %s", e)
        return None


def _embed_texts(texts: list[str], client: OpenAI) -> Optional[np.ndarray]:
    """Embed a list of texts in one or more batches. Returns (n, dim) ndarray."""
    if not texts:
        return np.zeros((0, EMBED_DIM), dtype=np.float32)
    out: list[list[float]] = []
    batch_size = 500
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        try:
            resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
            out.extend(item.embedding for item in resp.data)
        except Exception as e:
            logger.warning("Embedding call failed at batch %d: %s", i, e)
            return None
    return np.asarray(out, dtype=np.float32)


def _normalise(matrix: np.ndarray) -> np.ndarray:
    if matrix.size == 0:
        return matrix
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return matrix / norms


def load_or_build(
    state: str,
    grade: str,
    standards: list[dict],
) -> Optional[tuple[list[str], np.ndarray]]:
    """Return (codes, normalised_matrix) for the state/grade catalog, or None
    if embeddings are unavailable. Uses a disk cache keyed by manifest hash."""
    key = (state.upper(), str(grade))
    manifest = _manifest_hash(standards)

    with _LOCK:
        cached = _CACHE.get(key)
        if cached and cached[2] == manifest:
            return cached[0], cached[1]

    path = _cache_path(state, grade)
    if path.exists():
        try:
            data = np.load(path, allow_pickle=False)
            if str(data.get("manifest", "")) == manifest:
                codes = [str(c) for c in data["codes"].tolist()]
                matrix = data["matrix"].astype(np.float32)
                with _LOCK:
                    _CACHE[key] = (codes, matrix, manifest)
                logger.info("Loaded standards embeddings from disk: %s/%s (n=%d)", state, grade, len(codes))
                return codes, matrix
        except Exception as e:
            logger.warning("Failed to read embedding cache %s: %s", path, e)

    client = _get_client()
    if client is None:
        return None

    codes = [s["code"] for s in standards]
    texts = [_build_text(s) for s in standards]
    raw = _embed_texts(texts, client)
    if raw is None:
        return None
    matrix = _normalise(raw)

    try:
        np.savez_compressed(path, codes=np.asarray(codes), matrix=matrix, manifest=np.asarray(manifest))
        logger.info("Built + cached embeddings %s/%s (n=%d) → %s", state, grade, len(codes), path)
    except Exception as e:
        logger.warning("Failed to write embedding cache %s: %s", path, e)

    with _LOCK:
        _CACHE[key] = (codes, matrix, manifest)

    return codes, matrix


def embed_query(query: str) -> Optional[np.ndarray]:
    """Return a unit-normalised (1, dim) vector for a query, or None on failure."""
    client = _get_client()
    if client is None:
        return None
    raw = _embed_texts([query], client)
    if raw is None or raw.size == 0:
        return None
    return _normalise(raw)


def semantic_rank(
    query: str,
    standards: list[dict],
    state: str,
    grade: str,
    min_score: float = 0.25,
    max_results: int = 50,
) -> Optional[list[dict]]:
    """Return top standards ranked by cosine similarity to the query, or None
    if embeddings are unavailable (caller should fall back)."""
    built = load_or_build(state, grade, standards)
    if built is None:
        return None
    codes, matrix = built
    if matrix.size == 0:
        return []

    q_vec = embed_query(query)
    if q_vec is None:
        return None

    # cosine = dot product since both sides are unit-normalised
    sims = (matrix @ q_vec.T).reshape(-1)
    order = np.argsort(-sims)
    code_to_std = {s["code"]: s for s in standards}

    # Dedupe by code — source data sometimes has the same standard recorded
    # under multiple subjects. Keep the first (highest-scoring) occurrence.
    seen_codes: set[str] = set()
    out: list[dict] = []
    for idx in order:
        score = float(sims[idx])
        if score < min_score:
            break
        code = codes[idx]
        if code in seen_codes:
            continue
        std = code_to_std.get(code)
        if std is None:
            continue
        seen_codes.add(code)
        out.append({**std, "score": round(score, 4)})
        if len(out) >= max_results:
            break
    return out
