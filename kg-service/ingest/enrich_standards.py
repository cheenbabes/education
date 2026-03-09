"""Enrich raw standards with parent-friendly plain-language descriptions.

Optimized to minimize API calls:
1. Skip headers/labels (descriptions < 30 chars — not teachable standards)
2. Deduplicate across states (same code+description enriched once, applied everywhere)
3. Uses GPT-4.1-mini by default (simpler task, bulk volume)

Usage:
    python -m ingest.enrich_standards --states OR MI
    python -m ingest.enrich_standards  # all cached states
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from config import settings

CACHE_DIR = Path(__file__).parent.parent / "data" / "standards"
ENRICHMENT_CACHE = CACHE_DIR / "_enrichment_cache.json"

MIN_DESCRIPTION_LENGTH = 30  # skip headers/labels shorter than this

SYSTEM_PROMPT = """\
You are helping homeschooling parents understand educational standards.

For each standard, rewrite the description in simple, parent-friendly language.
Start with "Your child can..." or "Your child will..." or "Your child understands..."

Rules:
- Keep it to one sentence, max two.
- Avoid jargon. A parent with no teaching background should understand.
- Be specific about what the child does, not abstract goals.
- Return a JSON array of objects with "code" and "description_plain" fields.
- Match the order and codes exactly as provided.
"""


def _call_openai(system: str, user: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_enrichment_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=8192,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


def _call_anthropic(system: str, user: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model=settings.sonnet_model,
        max_tokens=8192,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text.strip()


def _call_llm(system: str, user: str) -> str:
    if settings.extraction_provider == "openai":
        return _call_openai(system, user)
    return _call_anthropic(system, user)


def _parse_json_response(raw: str) -> list[dict]:
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)


def _load_enrichment_cache() -> dict[str, str]:
    """Load cross-state enrichment cache: {code+description_key: description_plain}."""
    if ENRICHMENT_CACHE.exists():
        return json.loads(ENRICHMENT_CACHE.read_text())
    return {}


def _save_enrichment_cache(cache: dict[str, str]) -> None:
    ENRICHMENT_CACHE.write_text(json.dumps(cache, indent=2))


def _cache_key(code: str, description: str) -> str:
    """Unique key for a standard: code + first 100 chars of description."""
    return f"{code}||{description[:100]}"


def enrich_all_states(states: list[str], batch_size: int = 40) -> int:
    """Enrich standards across multiple states with cross-state dedup.

    Phase 1: Apply cached enrichments (free — no API calls)
    Phase 2: Batch-enrich remaining unique (code, description) pairs
    Phase 3: Apply new enrichments back to all states
    """
    enrichment_cache = _load_enrichment_cache()
    print(f"Enrichment cache: {len(enrichment_cache):,} entries loaded")

    # Load all state data
    state_data: dict[str, list[dict]] = {}
    for state in states:
        cache_file = CACHE_DIR / f"{state}.json"
        if not cache_file.exists():
            print(f"  No cached data for {state}, skipping")
            continue
        state_data[state] = json.loads(cache_file.read_text())

    # Phase 1: Apply cached enrichments
    applied = 0
    needs_enrichment: dict[str, dict] = {}  # cache_key -> {code, description, subject}

    for state, standards in state_data.items():
        for s in standards:
            if s.get("description_plain"):
                continue
            if len(s["description"]) < MIN_DESCRIPTION_LENGTH:
                # Auto-fill headers with a cleaned-up version
                s["description_plain"] = s["description"]
                applied += 1
                continue

            key = _cache_key(s["code"], s["description"])
            if key in enrichment_cache:
                s["description_plain"] = enrichment_cache[key]
                applied += 1
            else:
                needs_enrichment[key] = {
                    "code": s["code"],
                    "description": s["description"],
                    "subject": s["subject"],
                    "grade": s["grade"],
                }

    print(f"Phase 1 — Applied from cache: {applied:,}")
    print(f"Phase 2 — Unique standards to enrich via API: {len(needs_enrichment):,}")
    print(f"  Batches needed: {len(needs_enrichment) // batch_size + 1}")

    # Phase 2: Enrich unique standards via API
    items = list(needs_enrichment.items())
    api_enriched = 0

    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        user_msg = "Rewrite these standards in parent-friendly language:\n\n"
        for key, s in batch:
            user_msg += f'- Code: {s["code"]} | Grade: {s["grade"]} | Subject: {s["subject"]} | Description: {s["description"]}\n'

        time.sleep(1)  # rate limiting

        try:
            raw = _call_llm(SYSTEM_PROMPT, user_msg)
            results = _parse_json_response(raw)
            for r in results:
                code = r.get("code", "")
                plain = r.get("description_plain", "")
                if not plain:
                    continue
                # Find matching entries in batch by code
                for key, s in batch:
                    if s["code"] == code:
                        enrichment_cache[key] = plain
                        api_enriched += 1
        except Exception as e:
            print(f"    WARNING: Batch {i // batch_size + 1} failed: {e}")
            continue

        done = min(i + batch_size, len(items))
        if (i // batch_size + 1) % 25 == 0 or done == len(items):
            print(f"    Progress: {done:,}/{len(items):,} ({api_enriched:,} enriched)")
            # Periodic cache save
            _save_enrichment_cache(enrichment_cache)

    # Final cache save
    _save_enrichment_cache(enrichment_cache)
    print(f"Phase 2 — Enriched via API: {api_enriched:,}")

    # Phase 3: Apply new enrichments back to all state data
    phase3_applied = 0
    for state, standards in state_data.items():
        for s in standards:
            if s.get("description_plain"):
                continue
            key = _cache_key(s["code"], s["description"])
            if key in enrichment_cache:
                s["description_plain"] = enrichment_cache[key]
                phase3_applied += 1

        # Save state file
        cache_file = CACHE_DIR / f"{state}.json"
        cache_file.write_text(json.dumps(standards, indent=2))

    print(f"Phase 3 — Applied new enrichments: {phase3_applied:,}")
    total = applied + api_enriched + phase3_applied
    print(f"\nTotal enriched: {total:,}")
    return total


def main():
    parser = argparse.ArgumentParser(description="Enrich standards with plain-language descriptions")
    parser.add_argument("--states", nargs="*", help="State abbreviations (default: all cached)")
    parser.add_argument("--batch-size", type=int, default=40, help="Standards per LLM call")
    args = parser.parse_args()

    if args.states:
        states = args.states
    else:
        states = sorted(f.stem for f in CACHE_DIR.glob("*.json") if f.stem.startswith(tuple("ABCDEFGHIJKLMNOPQRSTUVWXYZ")))

    provider = settings.extraction_provider
    model = settings.openai_enrichment_model if provider == "openai" else settings.sonnet_model
    print(f"Using {provider} ({model}) for enrichment\n")

    enrich_all_states(states, batch_size=args.batch_size)


if __name__ == "__main__":
    main()
