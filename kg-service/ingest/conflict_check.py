"""Conflict detection across extracted principles within each philosophy.

Sends all principles for a philosophy to the LLM and asks it to identify:
- Duplicates: principles saying the same thing differently
- Contradictions: principles that directly conflict
- Tensions: principles that pull in different directions

Usage:
    python -m ingest.conflict_check
    python -m ingest.conflict_check --philosophy classical
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from config import settings

CONFLICT_PROMPT = """You are an expert in educational philosophy. Below are all extracted principles for the "{philosophy}" educational philosophy, with source attribution.

Analyze these principles and identify:

1. **DUPLICATES** — Principles that express the same idea in different words. These should be merged.
2. **CONTRADICTIONS** — Principles that directly conflict with each other. These indicate extraction errors or source disagreements.
3. **TENSIONS** — Principles that pull in different directions but aren't outright contradictory. These are often legitimate philosophical nuances.

For each finding, cite the specific principle names and their sources.

Also provide:
4. **QUALITY ASSESSMENT** — Rate the overall coherence of this philosophy's extracted principles (1-10) and note any principles that seem off-topic or poorly extracted.

Respond in JSON:
{{
  "duplicates": [
    {{"principles": ["Name A", "Name B"], "sources": ["source1.pdf", "source2.epub"], "explanation": "..."}}
  ],
  "contradictions": [
    {{"principles": ["Name A", "Name B"], "sources": ["source1.pdf", "source2.epub"], "explanation": "...", "severity": "high|medium|low"}}
  ],
  "tensions": [
    {{"principles": ["Name A", "Name B"], "sources": ["source1.pdf", "source2.epub"], "explanation": "..."}}
  ],
  "off_topic": [
    {{"principle": "Name", "source": "source.pdf", "explanation": "..."}}
  ],
  "coherence_score": 8,
  "coherence_notes": "..."
}}

Here are the principles:

{principles_text}
"""


def gather_principles(philosophy: str) -> list[dict]:
    """Gather all principles with source attribution for a philosophy."""
    extracted_dir = settings.extracted_path / philosophy
    if not extracted_dir.exists():
        return []

    principles = []
    for jf in sorted(extracted_dir.glob("*.json")):
        if jf.name.endswith(".meta.json"):
            continue
        source = jf.stem
        data = json.loads(jf.read_text())
        for p in data.get("principles", []):
            principles.append({
                "name": p["name"],
                "description": p.get("description", ""),
                "source": source,
            })
    return principles


def format_principles(principles: list[dict]) -> str:
    """Format principles for the LLM prompt."""
    lines = []
    for i, p in enumerate(principles, 1):
        lines.append(f"{i}. [{p['source']}] **{p['name']}**: {p['description']}")
    return "\n".join(lines)


def check_conflicts(philosophy: str) -> dict:
    """Run conflict detection for a single philosophy."""
    from openai import OpenAI

    principles = gather_principles(philosophy)
    if not principles:
        return {"philosophy": philosophy, "error": "No principles found"}

    print(f"\n{'='*60}")
    print(f"  {philosophy}: {len(principles)} principles")
    print(f"{'='*60}")

    principles_text = format_principles(principles)
    prompt = CONFLICT_PROMPT.format(
        philosophy=philosophy,
        principles_text=principles_text,
    )

    client = OpenAI()
    response = client.chat.completions.create(
        model=settings.openai_extraction_model,
        messages=[
            {"role": "system", "content": "You are an expert in educational philosophy analysis. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    result = json.loads(response.choices[0].message.content)
    result["philosophy"] = philosophy
    result["principle_count"] = len(principles)
    result["source_count"] = len(set(p["source"] for p in principles))

    # Print summary
    dupes = len(result.get("duplicates", []))
    contras = len(result.get("contradictions", []))
    tensions = len(result.get("tensions", []))
    off_topic = len(result.get("off_topic", []))
    score = result.get("coherence_score", "?")

    print(f"  Coherence: {score}/10")
    print(f"  Duplicates: {dupes}")
    print(f"  Contradictions: {contras}")
    print(f"  Tensions: {tensions}")
    print(f"  Off-topic: {off_topic}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Detect conflicts in extracted philosophy principles")
    parser.add_argument("--philosophy", type=str, help="Check a single philosophy")
    args = parser.parse_args()

    extracted = settings.extracted_path
    if not extracted.exists():
        print("ERROR: No extracted data found")
        sys.exit(1)

    if args.philosophy:
        philosophies = [args.philosophy]
    else:
        philosophies = sorted(
            d.name for d in extracted.iterdir()
            if d.is_dir() and not d.name.startswith(".")
        )

    all_results = []
    for phil in philosophies:
        result = check_conflicts(phil)
        all_results.append(result)

    # Save report
    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    report_path = reports_dir / f"conflict-detection-{timestamp}.json"
    report_path.write_text(json.dumps(all_results, indent=2))
    print(f"\nReport saved: {report_path}")

    # Print summary table
    print(f"\n{'='*60}")
    print("  SUMMARY")
    print(f"{'='*60}")
    print(f"{'Philosophy':<25} {'Score':>5} {'Dupes':>5} {'Confl':>5} {'Tens':>5} {'OffT':>5}")
    print("-" * 60)
    for r in all_results:
        phil = r.get("philosophy", "?")
        score = r.get("coherence_score", "?")
        dupes = len(r.get("duplicates", []))
        contras = len(r.get("contradictions", []))
        tensions = len(r.get("tensions", []))
        off_topic = len(r.get("off_topic", []))
        print(f"{phil:<25} {score:>5} {dupes:>5} {contras:>5} {tensions:>5} {off_topic:>5}")


if __name__ == "__main__":
    main()
