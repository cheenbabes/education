"""Generate standard worksheets from canonical clusters and save to DB.

Usage:
    # Full run — all 589 canonical clusters (1,767 worksheets, ~$32 via Claude)
    python -m scripts.generate_sample_worksheets

    # Dry run (no LLM calls)
    python -m scripts.generate_sample_worksheets --dry-run

    # Single cluster
    python -m scripts.generate_sample_worksheets --cluster-key grade3-math-fractions-...

    # Limit for testing
    python -m scripts.generate_sample_worksheets --limit 5

    # Use sample 50 instead of canonical
    python -m scripts.generate_sample_worksheets --use-sample
"""
from __future__ import annotations
import argparse, json, time, httpx
from pathlib import Path

WORKSHEET_TYPES = ["identify", "practice", "extend"]
KG_URL = "http://127.0.0.1:8000"
DB_URL = "http://localhost:3001"

CANONICAL_PATH = Path(__file__).parent.parent / "data" / "canonical_clusters.json"
SAMPLE_PATH    = Path(__file__).parent.parent / "data" / "sample_50_clusters.json"

def cluster_title(c: dict) -> str:
    """Normalise title field — canonical uses canonical_name, sample uses title."""
    return c.get("canonical_name") or c.get("title", "")

def cluster_descriptions(c: dict) -> list:
    return c.get("sample_descriptions") or c.get("standard_descriptions") or []

def save_to_db(cluster: dict, ws_type: str, ws_num: int, response_data: dict) -> dict:
    title = cluster_title(cluster)
    payload = {
        "clusterKey":    cluster["cluster_key"],
        "clusterTitle":  title,
        "grade":         cluster["grade"],
        "subject":       cluster["subject"],
        "worksheetNum":  ws_num,
        "worksheetType": ws_type,
        "title":         f"{title} — {ws_type.title()}",
        "standardCodes": cluster.get("standard_codes", []),
        "content": {
            "context":   response_data["context"],
            "problems":  response_data["problems"],
            "answerKey": response_data["answer_key"],
        },
    }
    r = httpx.post(f"{DB_URL}/api/worksheets/standard", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()

def already_generated(cluster_key: str, ws_num: int) -> bool:
    """Check DB to avoid re-generating worksheets that already exist."""
    r = httpx.get(f"{DB_URL}/api/worksheets/standard",
                  params={"clusterKey": cluster_key}, timeout=10)
    if r.status_code == 200:
        existing = r.json()
        return any(w["worksheetNum"] == ws_num for w in existing)
    return False

def generate_one(cluster: dict, ws_type: str, ws_num: int, dry_run: bool = False) -> dict:
    print(f"  [{ws_num}/3] {ws_type:<10}", end=" ", flush=True)
    if dry_run:
        print("(dry run)")
        return {"id": "dry-run"}

    # Skip if already in DB
    if already_generated(cluster["cluster_key"], ws_num):
        print("already exists, skipping")
        return {"id": "skipped"}

    title = cluster_title(cluster)
    payload = {
        "cluster_key":           cluster["cluster_key"],
        "cluster_title":         title,
        "grade":                 cluster["grade"],
        "subject":               cluster["subject"],
        "worksheet_type":        ws_type,
        "standard_codes":        cluster.get("standard_codes", []),
        "standard_descriptions": cluster_descriptions(cluster),
        "num_problems":          6,
    }
    r = httpx.post(f"{KG_URL}/generate-standard-worksheet", json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    saved = save_to_db(cluster, ws_type, ws_num, data)
    cost = data.get("cost_usd", 0)
    print(f"ok  (cost: ${cost:.4f}, id: {saved.get('id', '?')[:8]})")
    time.sleep(0.3)
    return saved

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--cluster-key", help="Run only one cluster")
    parser.add_argument("--limit", type=int, help="Limit to first N clusters")
    parser.add_argument("--use-sample", action="store_true",
                        help="Use sample_50_clusters.json instead of canonical")
    parser.add_argument("--subject", help="Filter by subject")
    parser.add_argument("--grade", help="Filter by grade")
    args = parser.parse_args()

    path = SAMPLE_PATH if args.use_sample else CANONICAL_PATH
    clusters = json.loads(path.read_text())
    print(f"Loaded {len(clusters)} clusters from {path.name}")

    if args.cluster_key:
        clusters = [c for c in clusters if c["cluster_key"] == args.cluster_key]
        if not clusters:
            print(f"No cluster found with key: {args.cluster_key}")
            return

    if args.subject:
        clusters = [c for c in clusters if c["subject"] == args.subject]
    if args.grade:
        clusters = [c for c in clusters if c["grade"] == args.grade]
    if args.limit:
        clusters = clusters[:args.limit]

    total = len(clusters) * 3
    print(f"\nGenerating {len(clusters)} clusters × 3 types = {total} worksheets")
    print(f"Estimated cost: ~${total * 0.018:.0f} via Claude\n")

    for i, cluster in enumerate(clusters, 1):
        title = cluster_title(cluster)
        print(f"[{i:3}/{len(clusters)}] {title[:65]}")
        for j, ws_type in enumerate(WORKSHEET_TYPES, 1):
            try:
                generate_one(cluster, ws_type, j, dry_run=args.dry_run)
            except Exception as e:
                print(f"  [{j}/3] {ws_type:<10} ERROR: {e}")

    print(f"\nDone. Generated up to {total} worksheets.")

if __name__ == "__main__":
    main()
