"""PDF -> LLM -> structured JSON extraction pipeline.

Supports both OpenAI and Anthropic as the LLM provider.
Set EXTRACTION_PROVIDER=openai (default) or EXTRACTION_PROVIDER=anthropic in .env.

Usage:
    python -m ingest.extract --philosophy unschooling
    python -m ingest.extract --philosophy unschooling --force
    python -m ingest.extract --all
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from config import settings
from ingest.pdf_reader import extract_text, file_hash
from prompts.extract_philosophy import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

# GPT-4.1 has ~1M token context. At ~4 chars/token:
#   300K chars ≈ 75K tokens — safe chunk size leaving room for prompt + response
CHUNK_SIZE = 300_000
CHUNK_OVERLAP = 5_000   # overlap between chunks to avoid cutting mid-sentence
EXTRACTION_VERSION = "2"  # bump to force re-extraction of all cached files


def _cache_path(philosophy: str, pdf_name: str) -> Path:
    out_dir = settings.extracted_path / philosophy
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"{Path(pdf_name).stem}.json"


def _meta_path(philosophy: str, pdf_name: str) -> Path:
    return settings.extracted_path / philosophy / f"{Path(pdf_name).stem}.meta.json"


def _should_extract(philosophy: str, pdf_path: Path, force: bool = False) -> bool:
    if force:
        return True
    cache = _cache_path(philosophy, pdf_path.name)
    meta = _meta_path(philosophy, pdf_path.name)
    if not cache.exists() or not meta.exists():
        return True
    stored = json.loads(meta.read_text())
    # Re-extract if file changed OR if extracted with an older version
    if stored.get("sha256") != file_hash(pdf_path):
        return True
    if stored.get("version") != EXTRACTION_VERSION:
        return True
    return False


def _call_openai(system: str, user: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_extraction_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=4096,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


def _call_anthropic(system: str, user: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=settings.sonnet_model,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text.strip()


def _call_llm(system: str, user: str) -> str:
    if settings.extraction_provider == "openai":
        return _call_openai(system, user)
    else:
        return _call_anthropic(system, user)


def _parse_llm_response(raw: str, pdf_name: str) -> dict | None:
    """Strip markdown fences and parse JSON. Returns None on failure."""
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"  ERROR: Could not parse JSON for {pdf_name}: {exc}")
        print(f"  Raw response (first 300 chars): {raw[:300]}")
        return None


def _normalize_name(name: str) -> str:
    """Lowercase and strip punctuation for deduplication."""
    import re
    return re.sub(r"[^a-z0-9 ]", "", name.lower()).strip()


def _merge_chunks(chunks: list[dict]) -> dict:
    """Merge extraction results from multiple chunks, deduplicating by name."""
    merged: dict[str, list] = {
        "principles": [],
        "activity_types": [],
        "material_types": [],
        "age_guidance": [],
    }
    seen: dict[str, set] = {k: set() for k in merged}

    for chunk in chunks:
        for key in merged:
            for item in chunk.get(key, []):
                norm = _normalize_name(item.get("name", ""))
                if norm and norm not in seen[key]:
                    seen[key].add(norm)
                    merged[key].append(item)

    return merged


def _chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks of CHUNK_SIZE chars."""
    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        # Try to break at a paragraph boundary near the end
        if end < len(text):
            boundary = text.rfind("\n\n", start, end)
            if boundary > start + CHUNK_SIZE // 2:
                end = boundary
        chunks.append(text[start:end])
        start = end - CHUNK_OVERLAP
    return chunks


def extract_pdf(philosophy: str, pdf_path: Path) -> dict:
    """Extract structured data from a single document, chunking if needed."""
    print(f"  Extracting: {pdf_path.name}")
    text = extract_text(pdf_path)

    if not text.strip():
        print(f"  WARNING: No text extracted from {pdf_path.name}, skipping.")
        return {}

    chunks = _chunk_text(text)
    n_chunks = len(chunks)
    if n_chunks > 1:
        print(f"  Chunking into {n_chunks} parts ({len(text):,} chars total)")

    chunk_results = []
    for i, chunk in enumerate(chunks):
        if n_chunks > 1:
            print(f"  Chunk {i+1}/{n_chunks}...")
        user_msg = USER_PROMPT_TEMPLATE.format(
            philosophy=philosophy,
            filename=pdf_path.name,
            text=chunk,
        )
        time.sleep(2)  # rate limit
        try:
            raw = _call_llm(SYSTEM_PROMPT, user_msg)
        except Exception as e:
            print(f"  ERROR: LLM call failed (chunk {i+1}): {e}")
            continue
        result = _parse_llm_response(raw, pdf_path.name)
        if result:
            chunk_results.append(result)

    if not chunk_results:
        return {}

    data = _merge_chunks(chunk_results) if len(chunk_results) > 1 else chunk_results[0]

    # Cache the merged result
    cache = _cache_path(philosophy, pdf_path.name)
    cache.write_text(json.dumps(data, indent=2))
    meta = _meta_path(philosophy, pdf_path.name)
    meta.write_text(json.dumps({
        "sha256": file_hash(pdf_path),
        "source": pdf_path.name,
        "version": EXTRACTION_VERSION,
        "chunks": n_chunks,
    }))

    print(f"  -> {len(data.get('principles', []))} principles, "
          f"{len(data.get('activity_types', []))} activities, "
          f"{len(data.get('material_types', []))} materials"
          + (f" (merged from {n_chunks} chunks)" if n_chunks > 1 else ""))

    return data


def extract_philosophy(philosophy: str, force: bool = False) -> list[dict]:
    """Extract data from all documents for a given philosophy."""
    pdf_dir = settings.docs_root / philosophy
    if not pdf_dir.is_dir():
        print(f"ERROR: No directory found at {pdf_dir}")
        sys.exit(1)

    docs = sorted(
        list(pdf_dir.glob("*.pdf")) + list(pdf_dir.glob("*.epub"))
    )
    if not docs:
        print(f"WARNING: No PDFs/epubs found in {pdf_dir}")
        return []

    print(f"Philosophy: {philosophy} ({len(docs)} documents)")
    results = []
    for doc_path in docs:
        if not _should_extract(philosophy, doc_path, force=force):
            print(f"  Cached v{EXTRACTION_VERSION}: {doc_path.name}")
            cached = _cache_path(philosophy, doc_path.name)
            results.append(json.loads(cached.read_text()))
        else:
            data = extract_pdf(philosophy, doc_path)
            if data:
                results.append(data)

    return results


def extract_all(force: bool = False) -> dict[str, list[dict]]:
    """Extract data from all philosophy directories."""
    all_data = {}
    for subdir in sorted(settings.docs_root.iterdir()):
        if subdir.is_dir() and not subdir.name.startswith("."):
            all_data[subdir.name] = extract_philosophy(subdir.name, force=force)
    return all_data


def main():
    parser = argparse.ArgumentParser(description="Extract structured data from philosophy PDFs")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--philosophy", type=str, help="Philosophy name (directory name)")
    group.add_argument("--all", action="store_true", help="Extract from all philosophies")
    parser.add_argument("--force", action="store_true",
                        help="Re-extract even if cached (use after changing chunk size)")
    args = parser.parse_args()

    provider = settings.extraction_provider
    model = settings.openai_extraction_model if provider == "openai" else settings.sonnet_model
    print(f"Using {provider} ({model}) for extraction")
    print(f"Chunk size: {CHUNK_SIZE:,} chars | Version: {EXTRACTION_VERSION}\n")

    if args.all:
        extract_all(force=args.force)
    else:
        extract_philosophy(args.philosophy, force=args.force)


if __name__ == "__main__":
    main()
