# kg-service/scripts/export_canonical_clusters.py
"""After human review, process the approved clusters into:
  1. canonical_clusters.json — the definitive cluster list for worksheet generation
  2. standard_to_cluster.json — maps any standard code → canonical cluster key

Usage:
  python -m scripts.export_canonical_clusters --input data/clusters/canonical_clusters_approved.json
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:80]


def main(input_path: str):
    clusters = json.loads(Path(input_path).read_text())
    print(f"Processing {len(clusters)} approved clusters...")

    canonical = []
    std_to_cluster = {}

    for c in clusters:
        grade = c["grade"]
        subject = c["subject"]
        name = c["canonical_name"]
        cluster_key = f"grade{grade.lower()}-{slugify(subject)}-{slugify(name.split(':')[-1] if ':' in name else name)}"

        canonical.append({
            "cluster_key": cluster_key,
            "canonical_name": name,
            "grade": grade,
            "subject": subject,
            "n_standards": c["n_standards"],
            "coherence_score": c["coherence_score"],
            "sample_descriptions": c.get("sample_standards", [])[:3],
        })

        for code in c.get("all_codes", []):
            if code:
                std_to_cluster[code] = cluster_key

    # Save
    out_dir = Path("data")
    (out_dir / "canonical_clusters.json").write_text(json.dumps(canonical, indent=2))
    (out_dir / "standard_to_cluster.json").write_text(json.dumps(std_to_cluster, indent=2))

    print(f"Saved {len(canonical)} canonical clusters")
    print(f"Saved {len(std_to_cluster)} standard code → cluster mappings")

    # Summary
    from collections import Counter
    by_subject = Counter(c["subject"] for c in canonical)
    print("\nBy subject:", dict(by_subject))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/clusters/canonical_clusters_approved.json")
    args = parser.parse_args()
    main(args.input)
