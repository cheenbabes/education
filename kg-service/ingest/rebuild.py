"""Build or rebuild the Kuzu knowledge graph from extracted data and standards.

Uses COPY FROM CSV for bulk loading (~100x faster than individual queries).

Usage:
    python -m ingest.rebuild
    python -m ingest.rebuild --force   # skip hash check, always rebuild
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import tempfile
import time
from pathlib import Path

import kuzu

from config import settings
from kg.schema import create_schema
from kg.static_data import GRADES, MILESTONES, PHILOSOPHIES, STATES, SUBJECTS


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


def _sanitize(val) -> str:
    """Sanitize a value for CSV: replace newlines and tabs with spaces."""
    if isinstance(val, str):
        return val.replace("\n", " ").replace("\r", " ").replace("\t", " ").strip()
    return val


def _write_csv(path: str, headers: list[str], rows: list[list]) -> int:
    """Write rows to a CSV file. Returns row count."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([_sanitize(v) for v in row])
    return len(rows)


def _remove_db_if_exists() -> None:
    """Remove existing Kuzu database for clean rebuild."""
    db_path = settings.kuzu_db_path
    if db_path.is_file():
        db_path.unlink()
    elif db_path.is_dir():
        import shutil
        shutil.rmtree(db_path)
    for suffix in [".lock", ".wal"]:
        p = db_path.parent / (db_path.name + suffix)
        if p.exists():
            p.unlink()


def _prepare_standards_data(states: list[str] | None) -> tuple[list, list, list, list]:
    """Load standards from cached JSON. Returns (nodes, state_links, grade_links, subject_links)."""
    from ingest.standards import fetch_all_states

    all_standards = fetch_all_states(states)

    unique: dict[str, dict] = {}
    state_links: set[tuple[str, str]] = set()
    grade_links: set[tuple[str, str]] = set()
    subject_links: set[tuple[str, str]] = set()

    for state_abbr, standards in all_standards.items():
        for s in standards:
            code = s["code"]
            if code not in unique:
                unique[code] = s
            state_links.add((state_abbr, code))
            grade_links.add((code, s["grade"]))
            subject_links.add((code, s["subject"]))

    nodes = list(unique.values())
    return nodes, list(state_links), list(grade_links), list(subject_links)


def _prepare_philosophy_data() -> tuple[list, list, list, list, list, list]:
    """Load extracted philosophy data. Returns (principles, activities, materials, val_edges, sug_edges, use_edges)."""
    extracted = settings.extracted_path
    if not extracted.exists():
        return [], [], [], [], [], []

    principles = []
    activities = []
    materials = []
    val_edges = []  # Philosophy -> Principle
    sug_edges = []  # Principle -> ActivityType
    use_edges = []  # ActivityType -> MaterialType

    for phil_dir in sorted(extracted.iterdir()):
        if not phil_dir.is_dir():
            continue
        philosophy = phil_dir.name

        for json_file in sorted(phil_dir.glob("*.json")):
            if json_file.name.endswith(".meta.json"):
                continue

            data = json.loads(json_file.read_text())
            source = json_file.stem

            pr_ids = []
            act_ids = []
            mat_ids = []

            for i, pr in enumerate(data.get("principles", [])):
                pr_id = f"{philosophy}:{source}:pr:{i}"
                principles.append({
                    "id": pr_id,
                    "name": pr["name"],
                    "description": pr["description"],
                    "philosophy_name": philosophy,
                })
                val_edges.append((philosophy, pr_id))
                pr_ids.append(pr_id)

            for j, act in enumerate(data.get("activity_types", [])):
                act_id = f"{philosophy}:{source}:act:{j}"
                activities.append({
                    "id": act_id,
                    "name": act["name"],
                    "description": act["description"],
                    "indoor_outdoor": act.get("indoor_outdoor", "both"),
                    "age_range_low": act.get("age_range_low", 4),
                    "age_range_high": act.get("age_range_high", 12),
                })
                act_ids.append(act_id)

            for k, mat in enumerate(data.get("material_types", [])):
                mat_id = f"{philosophy}:{source}:mat:{k}"
                materials.append({
                    "id": mat_id,
                    "name": mat["name"],
                    "category": mat.get("category", "other"),
                    "household_alternative": mat.get("household_alternative", ""),
                })
                mat_ids.append(mat_id)

            # Cross-product edges per source document
            for pr_id in pr_ids:
                for act_id in act_ids:
                    sug_edges.append((pr_id, act_id))

            for act_id in act_ids:
                for mat_id in mat_ids:
                    use_edges.append((act_id, mat_id))

    return principles, activities, materials, val_edges, sug_edges, use_edges


def rebuild(force: bool = False, states: list[str] | None = None) -> None:
    """Main rebuild entry point. Uses COPY FROM CSV for bulk loading."""
    if not _should_rebuild(force):
        print("Graph is up to date (extracted data hash unchanged). Use --force to rebuild anyway.")
        return

    start_time = time.time()
    print("Rebuilding knowledge graph...")

    _remove_db_if_exists()
    settings.kuzu_db_path.parent.mkdir(parents=True, exist_ok=True)
    db = kuzu.Database(str(settings.kuzu_db_path))
    conn = kuzu.Connection(db)

    # 1. Create schema
    print("  Creating schema...")
    create_schema(conn)

    # Use a temp directory for all CSV files
    tmp_dir = tempfile.mkdtemp(prefix="kuzu_rebuild_")

    try:
        # 2. Load static node tables via COPY FROM CSV
        print("  Loading static data...")

        # States
        path = os.path.join(tmp_dir, "states.csv")
        _write_csv(path, ["abbreviation", "name"],
                   [[s["abbreviation"], s["name"]] for s in STATES])
        conn.execute(f"COPY State FROM '{path}' (header=true)")

        # Grades
        path = os.path.join(tmp_dir, "grades.csv")
        _write_csv(path, ["level", "age_range_low", "age_range_high"],
                   [[g["level"], g["age_range_low"], g["age_range_high"]] for g in GRADES])
        conn.execute(f"COPY Grade FROM '{path}' (header=true)")

        # Subjects
        path = os.path.join(tmp_dir, "subjects.csv")
        _write_csv(path, ["name"], [[s] for s in SUBJECTS])
        conn.execute(f"COPY Subject FROM '{path}' (header=true)")

        # Philosophies
        path = os.path.join(tmp_dir, "philosophies.csv")
        _write_csv(path, ["name", "description", "disclaimer"],
                   [[p["name"], p["description"], p["disclaimer"] or ""] for p in PHILOSOPHIES])
        conn.execute(f"COPY Philosophy FROM '{path}' (header=true)")

        # Milestones
        path = os.path.join(tmp_dir, "milestones.csv")
        _write_csv(path, ["id", "description", "domain", "age_range_low", "age_range_high"],
                   [[m["id"], m["description"], m["domain"], m["age_range_low"], m["age_range_high"]] for m in MILESTONES])
        conn.execute(f"COPY DevelopmentalMilestone FROM '{path}' (header=true)")

        # HAS_MILESTONE edges
        path = os.path.join(tmp_dir, "has_milestone.csv")
        _write_csv(path, ["from", "to"],
                   [[m["grade"], m["id"]] for m in MILESTONES])
        conn.execute(f"COPY HAS_MILESTONE FROM '{path}' (header=true)")

        print("  Static data loaded.")

        # 3. Prepare and load standards
        print("  Preparing standards data...")
        std_nodes, state_links, grade_links, subject_links = _prepare_standards_data(states)

        print(f"    {len(std_nodes):,} standards, {len(state_links):,} state links, "
              f"{len(grade_links):,} grade links, {len(subject_links):,} subject links")

        # Standard nodes
        path = os.path.join(tmp_dir, "standards.csv")
        n = _write_csv(path, ["code", "description", "description_plain", "domain", "cluster"],
                       [[s["code"], s["description"], s.get("description_plain", ""),
                         s.get("domain", ""), s.get("cluster", "")] for s in std_nodes])
        conn.execute(f"COPY Standard FROM '{path}' (header=true)")
        print(f"    Standards nodes loaded: {n:,}")

        # HAS_STANDARD edges
        path = os.path.join(tmp_dir, "has_standard.csv")
        _write_csv(path, ["from", "to"], state_links)
        conn.execute(f"COPY HAS_STANDARD FROM '{path}' (header=true)")
        print(f"    HAS_STANDARD edges loaded: {len(state_links):,}")

        # FOR_GRADE edges
        path = os.path.join(tmp_dir, "for_grade.csv")
        _write_csv(path, ["from", "to"], grade_links)
        conn.execute(f"COPY FOR_GRADE FROM '{path}' (header=true)")
        print(f"    FOR_GRADE edges loaded: {len(grade_links):,}")

        # FOR_SUBJECT edges
        path = os.path.join(tmp_dir, "for_subject.csv")
        _write_csv(path, ["from", "to"], subject_links)
        conn.execute(f"COPY FOR_SUBJECT FROM '{path}' (header=true)")
        print(f"    FOR_SUBJECT edges loaded: {len(subject_links):,}")

        # 4. Prepare and load philosophy data
        print("  Preparing philosophy data...")
        principles, activities, materials, val_edges, sug_edges, use_edges = _prepare_philosophy_data()

        print(f"    {len(principles)} principles, {len(activities)} activities, "
              f"{len(materials)} materials, {len(val_edges) + len(sug_edges) + len(use_edges)} edges")

        if principles:
            path = os.path.join(tmp_dir, "principles.csv")
            _write_csv(path, ["id", "name", "description", "philosophy_name"],
                       [[p["id"], p["name"], p["description"], p["philosophy_name"]] for p in principles])
            conn.execute(f"COPY Principle FROM '{path}' (header=true)")

        if activities:
            path = os.path.join(tmp_dir, "activities.csv")
            _write_csv(path, ["id", "name", "description", "indoor_outdoor", "age_range_low", "age_range_high"],
                       [[a["id"], a["name"], a["description"], a["indoor_outdoor"],
                         a["age_range_low"], a["age_range_high"]] for a in activities])
            conn.execute(f"COPY ActivityType FROM '{path}' (header=true)")

        if materials:
            path = os.path.join(tmp_dir, "materials.csv")
            _write_csv(path, ["id", "name", "category", "household_alternative"],
                       [[m["id"], m["name"], m["category"], m["household_alternative"]] for m in materials])
            conn.execute(f"COPY MaterialType FROM '{path}' (header=true)")

        if val_edges:
            path = os.path.join(tmp_dir, "values.csv")
            _write_csv(path, ["from", "to"], val_edges)
            conn.execute(f"COPY VALUES FROM '{path}' (header=true)")

        if sug_edges:
            path = os.path.join(tmp_dir, "suggests.csv")
            _write_csv(path, ["from", "to"], sug_edges)
            conn.execute(f"COPY SUGGESTS FROM '{path}' (header=true)")

        if use_edges:
            path = os.path.join(tmp_dir, "uses.csv")
            _write_csv(path, ["from", "to"], use_edges)
            conn.execute(f"COPY USES FROM '{path}' (header=true)")

        print(f"  Philosophy data loaded.")

    finally:
        # Clean up temp CSV files
        import shutil
        shutil.rmtree(tmp_dir, ignore_errors=True)

    # 5. Save build hash
    BUILD_HASH_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUILD_HASH_FILE.write_text(_compute_extracted_hash())

    elapsed = time.time() - start_time
    print(f"Done. Knowledge graph rebuilt in {elapsed:.1f}s.")


def main():
    parser = argparse.ArgumentParser(description="Build/rebuild the Kuzu knowledge graph")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if data hasn't changed")
    parser.add_argument("--states", nargs="*", help="State abbreviations to load (default: all)")
    args = parser.parse_args()
    rebuild(force=args.force, states=args.states)


if __name__ == "__main__":
    main()
