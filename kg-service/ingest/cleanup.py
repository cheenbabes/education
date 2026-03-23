"""Post-audit cleanup of extracted principles.

Applies decisions from conflict report review:
1. Remove specific off-topic/contradictory principles
2. Reframe specific principles
3. Auto-merge duplicates within each philosophy

Usage:
    python -m ingest.cleanup --dry-run    # Preview changes
    python -m ingest.cleanup              # Apply changes
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from config import settings

# ── Principles to REMOVE (by philosophy → principle name, case-insensitive) ──

REMOVE = {
    "adaptive": [
        "Screen Time Limitation",  # from cdc-milestone-checklists
        "Screen Time Limitation",  # from cdc-milestone-moments (both copies)
    ],
    "charlotte-mason": [
        "Judicious Selection",
        "Cultivation of Taste",
        "Depth Over Quantity",
        "Parental Self-Education",
    ],
    "classical": [
        # Off-topic (practical/admin, not philosophy)
        "Physical Education and Health",
        "Record Keeping and Accountability",
        "Standardized Testing as Evaluation",
        "Community and Outsourcing",
        "Parental Responsibility and Diplomacy",
        # Contradictions — removing religious framing, keeping secular
        "Integrated Biblical Worldview",
        "Biblical Worldview in All Subjects",
        "Rejection of Educational Neutrality",
        "Christ-Centered Education",
    ],
    "unschooling": [
        "No Ranking or Labeling",
        "Value of Experience over Credentials",
        "Natural Authority over Official Authority",
        "Critique of Institutionalization",
        "Critical View of Institutional Schooling",
    ],
    "waldorf-adjacent": [
        "Threefold Social Order",
    ],
}

# ── Principles to REFRAME (update description) ──

REFRAME = {
    "adaptive": {
        "Moral and Character Development": (
            "The learning community — whether family, co-op, or school — defines the "
            "values and character traits most important to them, and weaves those into "
            "lessons where appropriate and natural. Because adaptive education is "
            "responsive to each community's culture, moral and character emphasis will "
            "vary from group to group. Values are integrated organically without "
            "overemphasizing any single moral framework."
        ),
    },
}


def _normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", name.lower()).strip()


def _should_remove(philosophy: str, principle_name: str) -> bool:
    removals = REMOVE.get(philosophy, [])
    norm_removals = {_normalize(r) for r in removals}
    return _normalize(principle_name) in norm_removals


def _get_reframe(philosophy: str, principle_name: str) -> str | None:
    reframes = REFRAME.get(philosophy, {})
    for name, new_desc in reframes.items():
        if _normalize(name) == _normalize(principle_name):
            return new_desc
    return None


def deduplicate_principles(principles: list[dict]) -> tuple[list[dict], list[tuple]]:
    """Remove duplicate principles, keeping the one with the longer description."""
    seen: dict[str, dict] = {}
    merged_pairs: list[tuple] = []

    for p in principles:
        norm = _normalize(p.get("name", ""))
        if not norm:
            continue
        if norm in seen:
            existing = seen[norm]
            # Keep the one with the longer description
            if len(p.get("description", "")) > len(existing.get("description", "")):
                merged_pairs.append((existing["name"], p["name"]))
                seen[norm] = p
            else:
                merged_pairs.append((p["name"], existing["name"]))
        else:
            seen[norm] = p

    return list(seen.values()), merged_pairs


def process_philosophy(philosophy: str, dry_run: bool = False) -> dict:
    """Process all extracted files for a philosophy."""
    extracted_dir = settings.extracted_path / philosophy
    if not extracted_dir.exists():
        return {"philosophy": philosophy, "error": "not found"}

    stats = {
        "philosophy": philosophy,
        "removed": [],
        "reframed": [],
        "deduped": [],
        "before": {"principles": 0, "activities": 0, "materials": 0},
        "after": {"principles": 0, "activities": 0, "materials": 0},
    }

    # Collect all principles across files for cross-file dedup
    all_principles = []
    file_data = {}

    for jf in sorted(extracted_dir.glob("*.json")):
        if jf.name.endswith(".meta.json"):
            continue
        data = json.loads(jf.read_text())
        file_data[jf] = data

        for p in data.get("principles", []):
            stats["before"]["principles"] += 1
            all_principles.append({**p, "_source_file": str(jf)})
        stats["before"]["activities"] += len(data.get("activity_types", []))
        stats["before"]["materials"] += len(data.get("material_types", []))

    # Step 1: Remove flagged principles
    filtered = []
    for p in all_principles:
        if _should_remove(philosophy, p.get("name", "")):
            stats["removed"].append(p["name"])
        else:
            filtered.append(p)

    # Step 2: Reframe specific principles
    for p in filtered:
        new_desc = _get_reframe(philosophy, p.get("name", ""))
        if new_desc:
            stats["reframed"].append(p["name"])
            p["description"] = new_desc

    # Step 3: Deduplicate
    deduped, merged_pairs = deduplicate_principles(filtered)
    stats["deduped"] = [f"{a} -> {b}" for a, b in merged_pairs]

    stats["after"]["principles"] = len(deduped)

    # Now rebuild each file's principles from the deduped set
    if not dry_run:
        # Group deduped principles back by source file
        # For deduped items, we keep them in first file encountered
        deduped_norms = {_normalize(p["name"]) for p in deduped}
        assigned = set()

        for jf, data in file_data.items():
            new_principles = []
            for p in data.get("principles", []):
                norm = _normalize(p["name"])
                if norm in deduped_norms and norm not in assigned:
                    # Check if this was reframed
                    reframe = _get_reframe(philosophy, p["name"])
                    if reframe:
                        p["description"] = reframe
                    new_principles.append(p)
                    assigned.add(norm)
                elif norm not in deduped_norms:
                    pass  # removed
                # else: duplicate assigned to earlier file

            data["principles"] = new_principles
            stats["after"]["activities"] += len(data.get("activity_types", []))
            stats["after"]["materials"] += len(data.get("material_types", []))

            # Write back
            jf.write_text(json.dumps(data, indent=2))

    return stats


def main():
    parser = argparse.ArgumentParser(description="Clean up extracted principles")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    args = parser.parse_args()

    extracted = settings.extracted_path
    philosophies = sorted(
        d.name for d in extracted.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    )

    all_stats = []
    total_removed = 0
    total_reframed = 0
    total_deduped = 0

    for phil in philosophies:
        stats = process_philosophy(phil, dry_run=args.dry_run)
        all_stats.append(stats)

        removed = len(stats.get("removed", []))
        reframed = len(stats.get("reframed", []))
        deduped = len(stats.get("deduped", []))
        total_removed += removed
        total_reframed += reframed
        total_deduped += deduped

        before_p = stats["before"]["principles"]
        after_p = stats["after"]["principles"]

        print(f"\n{'='*50}")
        print(f"  {phil}: {before_p} -> {after_p} principles")
        print(f"{'='*50}")

        if stats["removed"]:
            print(f"  Removed ({removed}):")
            for r in stats["removed"]:
                print(f"    - {r}")
        if stats["reframed"]:
            print(f"  Reframed ({reframed}):")
            for r in stats["reframed"]:
                print(f"    - {r}")
        if stats["deduped"]:
            print(f"  Deduped ({deduped}):")
            for d in stats["deduped"]:
                print(f"    - {d}")

    mode = "DRY RUN" if args.dry_run else "APPLIED"
    print(f"\n{'='*50}")
    print(f"  SUMMARY ({mode})")
    print(f"{'='*50}")
    print(f"  Removed:  {total_removed} principles")
    print(f"  Reframed: {total_reframed} principles")
    print(f"  Deduped:  {total_deduped} duplicate pairs merged")
    print()

    print(f"{'Philosophy':<25} {'Before':>6} {'After':>6} {'Delta':>6}")
    print("-" * 45)
    for s in all_stats:
        before = s["before"]["principles"]
        after = s["after"]["principles"]
        delta = after - before
        print(f"{s['philosophy']:<25} {before:>6} {after:>6} {delta:>+6}")


if __name__ == "__main__":
    main()
