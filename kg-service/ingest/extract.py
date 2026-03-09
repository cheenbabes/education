"""PDF -> Claude -> structured JSON extraction pipeline.

Usage:
    python -m ingest.extract --philosophy nature-based
    python -m ingest.extract --all
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import anthropic

from config import settings
from ingest.pdf_reader import extract_text, file_hash
from prompts.extract_philosophy import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


def _cache_path(philosophy: str, pdf_name: str) -> Path:
    """Return the path where we cache extraction JSON for a given PDF."""
    out_dir = settings.extracted_path / philosophy
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / f"{Path(pdf_name).stem}.json"


def _meta_path(philosophy: str, pdf_name: str) -> Path:
    return settings.extracted_path / philosophy / f"{Path(pdf_name).stem}.meta.json"


def _should_extract(philosophy: str, pdf_path: Path) -> bool:
    """Return True if we need to (re-)extract this PDF."""
    cache = _cache_path(philosophy, pdf_path.name)
    meta = _meta_path(philosophy, pdf_path.name)
    if not cache.exists() or not meta.exists():
        return True
    stored = json.loads(meta.read_text())
    return stored.get("sha256") != file_hash(pdf_path)


def extract_pdf(philosophy: str, pdf_path: Path) -> dict:
    """Extract structured data from a single PDF using Claude."""
    print(f"  Extracting: {pdf_path.name}")
    text = extract_text(pdf_path)

    if not text.strip():
        print(f"  WARNING: No text extracted from {pdf_path.name}, skipping.")
        return {}

    # Truncate very long documents to stay within context limits
    max_chars = 180_000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[... TRUNCATED ...]"

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=settings.sonnet_model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": USER_PROMPT_TEMPLATE.format(
                    philosophy=philosophy,
                    filename=pdf_path.name,
                    text=text,
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()
    # Handle possible markdown fences from the model
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"  ERROR: Could not parse JSON from Claude for {pdf_path.name}: {exc}")
        print(f"  Raw response (first 500 chars): {raw[:500]}")
        return {}

    # Cache the result
    cache = _cache_path(philosophy, pdf_path.name)
    cache.write_text(json.dumps(data, indent=2))

    meta = _meta_path(philosophy, pdf_path.name)
    meta.write_text(json.dumps({"sha256": file_hash(pdf_path), "source": pdf_path.name}))

    print(f"  -> {len(data.get('principles', []))} principles, "
          f"{len(data.get('activity_types', []))} activities, "
          f"{len(data.get('material_types', []))} materials")

    return data


def extract_philosophy(philosophy: str) -> list[dict]:
    """Extract data from all PDFs for a given philosophy."""
    pdf_dir = settings.docs_root / philosophy
    if not pdf_dir.is_dir():
        print(f"ERROR: No directory found at {pdf_dir}")
        sys.exit(1)

    pdfs = sorted(pdf_dir.glob("*.pdf"))
    if not pdfs:
        print(f"WARNING: No PDFs found in {pdf_dir}")
        return []

    print(f"Philosophy: {philosophy} ({len(pdfs)} PDFs)")
    results = []
    for pdf_path in pdfs:
        if not _should_extract(philosophy, pdf_path):
            print(f"  Cached (unchanged): {pdf_path.name}")
            cached = _cache_path(philosophy, pdf_path.name)
            results.append(json.loads(cached.read_text()))
        else:
            data = extract_pdf(philosophy, pdf_path)
            if data:
                results.append(data)

    return results


def extract_all() -> dict[str, list[dict]]:
    """Extract data from all philosophy directories."""
    all_data = {}
    for subdir in sorted(settings.docs_root.iterdir()):
        if subdir.is_dir() and not subdir.name.startswith("."):
            all_data[subdir.name] = extract_philosophy(subdir.name)
    return all_data


def main():
    parser = argparse.ArgumentParser(description="Extract structured data from philosophy PDFs")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--philosophy", type=str, help="Philosophy name (directory name)")
    group.add_argument("--all", action="store_true", help="Extract from all philosophies")
    args = parser.parse_args()

    if args.all:
        extract_all()
    else:
        extract_philosophy(args.philosophy)


if __name__ == "__main__":
    main()
