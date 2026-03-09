"""Build or rebuild the Kuzu knowledge graph from extracted data and standards.

Usage:
    python -m ingest.rebuild
    python -m ingest.rebuild --force   # skip hash check, always rebuild
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

import kuzu

from config import settings
from kg.schema import create_schema
from kg.static_data import GRADES, MILESTONES, PHILOSOPHIES, STATES, SUBJECTS
from ingest.standards import load_standards


BUILD_HASH_FILE = Path(settings.kuzu_db_path).parent / ".kg_build_hash"


def _compute_extracted_hash() -> str:
    """Hash all extracted JSON files to detect changes."""
    h = hashlib.sha256()
    extracted = settings.extracted_path
    if not extracted.exists():
        return "empty"
    for f in sorted(extracted.rglob("*.json")):
        if f.name.endswith(".meta.json"):
            continue
        h.update(f.read_bytes())
    return h.hexdigest()


def _should_rebuild(force: bool = False) -> bool:
    if force:
        return True
    if not BUILD_HASH_FILE.exists():
        return True
    stored = BUILD_HASH_FILE.read_text().strip()
    return stored != _compute_extracted_hash()


def _load_static(conn) -> None:
    """Insert static reference data: states, grades, subjects, philosophies."""
    for s in STATES:
        conn.execute(
            "CREATE (n:State {abbreviation: $abbr, name: $name})",
            parameters={"abbr": s["abbreviation"], "name": s["name"]},
        )

    for g in GRADES:
        conn.execute(
            "CREATE (n:Grade {level: $level, age_range_low: $lo, age_range_high: $hi})",
            parameters={"level": g["level"], "lo": g["age_range_low"], "hi": g["age_range_high"]},
        )

    for name in SUBJECTS:
        conn.execute(
            "CREATE (n:Subject {name: $name})",
            parameters={"name": name},
        )

    for p in PHILOSOPHIES:
        conn.execute(
            "CREATE (n:Philosophy {name: $name, description: $description, disclaimer: $disclaimer})",
            parameters={
                "name": p["name"],
                "description": p["description"],
                "disclaimer": p["disclaimer"] or "",
            },
        )


def _load_milestones(conn) -> None:
    """Insert developmental milestones and link to grades."""
    for m in MILESTONES:
        conn.execute(
            "CREATE (n:DevelopmentalMilestone {id: $id, description: $description, "
            "domain: $domain, age_range_low: $lo, age_range_high: $hi})",
            parameters={
                "id": m["id"],
                "description": m["description"],
                "domain": m["domain"],
                "lo": m["age_range_low"],
                "hi": m["age_range_high"],
            },
        )
        conn.execute(
            "MATCH (g:Grade {level: $grade}), (m:DevelopmentalMilestone {id: $id}) "
            "CREATE (g)-[:HAS_MILESTONE]->(m)",
            parameters={"grade": m["grade"], "id": m["id"]},
        )


def _load_extracted(conn) -> int:
    """Load all extracted philosophy JSON into the graph. Returns count of items loaded."""
    extracted = settings.extracted_path
    if not extracted.exists():
        print("  No extracted data found — run `python -m ingest.extract --all` first.")
        return 0

    total_principles = 0
    total_activities = 0
    total_materials = 0

    for phil_dir in sorted(extracted.iterdir()):
        if not phil_dir.is_dir():
            continue
        philosophy = phil_dir.name

        for json_file in sorted(phil_dir.glob("*.json")):
            if json_file.name.endswith(".meta.json"):
                continue

            data = json.loads(json_file.read_text())
            source = json_file.stem

            # Principles
            for i, pr in enumerate(data.get("principles", [])):
                pr_id = f"{philosophy}:{source}:pr:{i}"
                conn.execute(
                    "MERGE (n:Principle {id: $id}) "
                    "SET n.name = $name, n.description = $description, n.philosophy_name = $phil",
                    parameters={
                        "id": pr_id,
                        "name": pr["name"],
                        "description": pr["description"],
                        "phil": philosophy,
                    },
                )
                conn.execute(
                    "MATCH (p:Philosophy {name: $phil}), (pr:Principle {id: $id}) "
                    "MERGE (p)-[:VALUES]->(pr)",
                    parameters={"phil": philosophy, "id": pr_id},
                )
                total_principles += 1

            # Activity types — create all first, then link
            for j, act in enumerate(data.get("activity_types", [])):
                act_id = f"{philosophy}:{source}:act:{j}"
                conn.execute(
                    "MERGE (n:ActivityType {id: $id}) "
                    "SET n.name = $name, n.description = $description, "
                    "    n.indoor_outdoor = $io, n.age_range_low = $lo, n.age_range_high = $hi",
                    parameters={
                        "id": act_id,
                        "name": act["name"],
                        "description": act["description"],
                        "io": act.get("indoor_outdoor", "both"),
                        "lo": act.get("age_range_low", 4),
                        "hi": act.get("age_range_high", 12),
                    },
                )
                total_activities += 1

            # Create SUGGESTS edges from each principle to each activity (same source doc)
            for i, pr in enumerate(data.get("principles", [])):
                pr_id = f"{philosophy}:{source}:pr:{i}"
                for j, act in enumerate(data.get("activity_types", [])):
                    act_id = f"{philosophy}:{source}:act:{j}"
                    conn.execute(
                        "MATCH (pr:Principle {id: $pr_id}), (a:ActivityType {id: $act_id}) "
                        "MERGE (pr)-[:SUGGESTS]->(a)",
                        parameters={"pr_id": pr_id, "act_id": act_id},
                    )

            # Material types
            for k, mat in enumerate(data.get("material_types", [])):
                mat_id = f"{philosophy}:{source}:mat:{k}"
                conn.execute(
                    "MERGE (n:MaterialType {id: $id}) "
                    "SET n.name = $name, n.category = $cat, n.household_alternative = $alt",
                    parameters={
                        "id": mat_id,
                        "name": mat["name"],
                        "cat": mat.get("category", "other"),
                        "alt": mat.get("household_alternative", ""),
                    },
                )
                # Link each activity to each material from the same source
                for j, _act in enumerate(data.get("activity_types", [])):
                    act_id = f"{philosophy}:{source}:act:{j}"
                    conn.execute(
                        "MATCH (a:ActivityType {id: $act_id}), (m:MaterialType {id: $mat_id}) "
                        "MERGE (a)-[:USES]->(m)",
                        parameters={"act_id": act_id, "mat_id": mat_id},
                    )
                total_materials += 1

    print(f"  Loaded: {total_principles} principles, {total_activities} activities, {total_materials} materials")
    return total_principles + total_activities + total_materials


def _remove_db_if_exists() -> None:
    """Remove existing Kuzu database (file or directory) for clean rebuild."""
    db_path = settings.kuzu_db_path
    if db_path.is_file():
        db_path.unlink()
    elif db_path.is_dir():
        import shutil
        shutil.rmtree(db_path)
    # Also remove lock files and WAL files that Kuzu may leave behind
    for suffix in [".lock", ".wal"]:
        p = db_path.parent / (db_path.name + suffix)
        if p.exists():
            p.unlink()


def rebuild(force: bool = False, states: list[str] | None = None) -> None:
    """Main rebuild entry point."""
    if not _should_rebuild(force):
        print("Graph is up to date (extracted data hash unchanged). Use --force to rebuild anyway.")
        return

    print("Rebuilding knowledge graph...")

    _remove_db_if_exists()
    settings.kuzu_db_path.parent.mkdir(parents=True, exist_ok=True)
    db = kuzu.Database(str(settings.kuzu_db_path))
    conn = kuzu.Connection(db)

    # 1. Create fresh schema
    print("  Creating schema...")
    create_schema(conn)

    # 2. Load static data
    print("  Loading static data (states, grades, subjects, philosophies)...")
    _load_static(conn)

    # 3. Load milestones
    print("  Loading developmental milestones...")
    _load_milestones(conn)

    # 4. Load standards
    print("  Loading standards...")
    n = load_standards(conn, states=states)
    print(f"  Loaded {n} standards")

    # 5. Load extracted philosophy data
    print("  Loading extracted philosophy data...")
    _load_extracted(conn)

    # 6. Save build hash
    BUILD_HASH_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUILD_HASH_FILE.write_text(_compute_extracted_hash())

    print("Done. Knowledge graph rebuilt successfully.")


def main():
    parser = argparse.ArgumentParser(description="Build/rebuild the Kuzu knowledge graph")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if data hasn't changed")
    parser.add_argument("--states", nargs="*", help="State abbreviations to load (default: all)")
    args = parser.parse_args()
    rebuild(force=args.force, states=args.states)


if __name__ == "__main__":
    main()
