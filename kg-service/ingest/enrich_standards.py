"""Enrich raw standards with parent-friendly plain-language descriptions.

Reads cached standards JSON from data/standards/<STATE>.json, sends batches
to an LLM to generate description_plain, and saves back.

Usage:
    python -m ingest.enrich_standards --states OR
    python -m ingest.enrich_standards  # all cached states
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from config import settings

CACHE_DIR = Path(__file__).parent.parent / "data" / "standards"

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
        model=settings.openai_extraction_model,
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


def enrich_state(state_abbr: str, batch_size: int = 40) -> int:
    """Add plain-language descriptions to cached standards for a state."""
    cache_file = CACHE_DIR / f"{state_abbr}.json"
    if not cache_file.exists():
        print(f"  No cached data for {state_abbr}")
        return 0

    standards = json.loads(cache_file.read_text())

    # Find standards that need enrichment
    needs_enrichment = [s for s in standards if not s.get("description_plain")]
    if not needs_enrichment:
        print(f"  {state_abbr}: all {len(standards)} standards already enriched")
        return 0

    print(f"  {state_abbr}: enriching {len(needs_enrichment)} of {len(standards)} standards")

    # Build a lookup for quick update
    by_code_grade = {}
    for s in standards:
        by_code_grade[(s["code"], s["grade"])] = s

    enriched = 0
    for i in range(0, len(needs_enrichment), batch_size):
        batch = needs_enrichment[i:i + batch_size]
        user_msg = "Rewrite these standards in parent-friendly language:\n\n"
        for s in batch:
            user_msg += f'- Code: {s["code"]} | Grade: {s["grade"]} | Subject: {s["subject"]} | Description: {s["description"]}\n'

        try:
            raw = _call_llm(SYSTEM_PROMPT, user_msg)
            results = _parse_json_response(raw)
            for r in results:
                code = r.get("code", "")
                plain = r.get("description_plain", "")
                # Find matching standard(s) and update
                for s in batch:
                    if s["code"] == code and plain:
                        s["description_plain"] = plain
                        enriched += 1
                        break
        except Exception as e:
            print(f"    WARNING: Batch {i//batch_size + 1} failed: {e}")
            continue

        done = min(i + batch_size, len(needs_enrichment))
        print(f"    Batch {i//batch_size + 1}: {done}/{len(needs_enrichment)}")

    # Save back
    cache_file.write_text(json.dumps(standards, indent=2))
    print(f"  {state_abbr}: enriched {enriched} standards")
    return enriched


def main():
    parser = argparse.ArgumentParser(description="Enrich standards with plain-language descriptions")
    parser.add_argument("--states", nargs="*", help="State abbreviations (default: all cached)")
    parser.add_argument("--batch-size", type=int, default=40, help="Standards per LLM call")
    args = parser.parse_args()

    if args.states:
        states = args.states
    else:
        states = sorted(f.stem for f in CACHE_DIR.glob("*.json") if f.stem != "_jurisdictions")

    provider = settings.extraction_provider
    model = settings.openai_extraction_model if provider == "openai" else settings.sonnet_model
    print(f"Using {provider} ({model}) for enrichment\n")

    total = 0
    for state in states:
        total += enrich_state(state, batch_size=args.batch_size)

    print(f"\nTotal enriched: {total} standards")


if __name__ == "__main__":
    main()
