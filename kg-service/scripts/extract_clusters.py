"""Extract canonical topic clusters from the knowledge graph.

Groups standards by (grade, subject, conceptual domain) and deduplicates
across states so we have a manageable set of unique teaching topics.
"""

from __future__ import annotations
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# Allow imports from the kg-service root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import kuzu
from config import settings


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def extract_clusters() -> list[dict]:
    """Query KG and group standards into canonical topic clusters."""
    db = kuzu.Database(str(settings.kuzu_db_path))
    conn = kuzu.Connection(db)

    # Fetch all standards with their grade, subject, domain, cluster
    result = conn.execute("""
        MATCH (st:State)-[:HAS_STANDARD]->(s:Standard)-[:FOR_GRADE]->(g:Grade),
              (s)-[:FOR_SUBJECT]->(sub:Subject)
        RETURN s.code, s.description_plain, s.domain, s.cluster,
               g.level, sub.name
    """)

    # Group by (grade, subject, cluster/domain)
    groups: dict[tuple, list[dict]] = defaultdict(list)
    total_rows = 0
    while result.has_next():
        row = result.get_next()
        total_rows += 1
        code, desc_plain, domain, cluster, grade, subject = row
        # Use cluster field if available, fall back to domain, then description prefix
        topic_key = (cluster or domain or "")[:60].strip() or (desc_plain or "")[:60].strip()
        group_key = (grade, subject, slugify(topic_key[:40]))
        groups[group_key].append({
            "code": code,
            "description_plain": desc_plain,
            "domain": domain,
            "cluster": cluster,
        })

    print(f"Total standard rows fetched: {total_rows}")
    print(f"Unique group keys: {len(groups)}")

    clusters = []
    for (grade, subject, topic_slug), standards in groups.items():
        if len(standards) < 2:  # Skip singletons — likely noise
            continue
        sample = standards[0]
        cluster_key = f"grade{grade}-{slugify(subject)}-{topic_slug}"
        clusters.append({
            "cluster_key": cluster_key[:80],
            "grade": grade,
            "subject": subject,
            "title": f"Grade {grade} {subject}: {(sample['cluster'] or sample['domain'] or (sample['description_plain'] or '')[:50]).strip()}",
            "standard_codes": list({s["code"] for s in standards[:10]}),
            "standard_count": len(standards),
        })

    # Sort by grade then subject for readability
    clusters.sort(key=lambda c: (int(c["grade"]) if c["grade"].isdigit() else 0, c["subject"]))
    return clusters


def main():
    print("Extracting topic clusters from knowledge graph...")
    clusters = extract_clusters()
    out_path = Path(__file__).resolve().parent.parent / "data" / "topic_clusters.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(clusters, indent=2))
    print(f"\nExtracted {len(clusters)} clusters → {out_path}")

    # Print summary by grade/subject
    by_subject = Counter(c["subject"] for c in clusters)
    print("\nBy subject:", dict(by_subject))
    by_grade = Counter(c["grade"] for c in clusters)
    print("By grade:", dict(sorted(by_grade.items(), key=lambda x: (int(x[0]) if x[0].isdigit() else 0))))

    # Print cross-tab
    print("\nGrade x Subject distribution:")
    subjects = sorted(by_subject.keys())
    grades = sorted(by_grade.keys(), key=lambda x: int(x) if x.isdigit() else 0)
    header = f"{'Grade':<8}" + "".join(f"{s:<20}" for s in subjects)
    print(header)
    for g in grades:
        row = f"{g:<8}"
        for s in subjects:
            count = sum(1 for c in clusters if c["grade"] == g and c["subject"] == s)
            row += f"{count:<20}"
        print(row)


if __name__ == "__main__":
    main()
