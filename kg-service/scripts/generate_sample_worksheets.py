"""Generate the 50 sample standard worksheets and save to DB.

Usage:
    python -m scripts.generate_sample_worksheets [--dry-run] [--cluster-key KEY] [--limit N]

Cost estimate: ~$3-4 for all 150 worksheets (50 clusters x 3 types)
"""
from __future__ import annotations
import argparse, json, time, httpx
from pathlib import Path
from datetime import datetime

WORKSHEET_TYPES = ["identify", "practice", "extend"]
KG_URL = "http://localhost:8000"
DB_URL = "http://localhost:3001"  # Next.js API

def save_to_db(cluster, ws_type, ws_num, response_data):
    """Save generated worksheet to DB via Next.js API."""
    payload = {
        "clusterKey":    cluster["cluster_key"],
        "clusterTitle":  cluster["title"],
        "grade":         cluster["grade"],
        "subject":       cluster["subject"],
        "worksheetNum":  ws_num,
        "worksheetType": ws_type,
        "title":         f"{cluster['title']} — {ws_type.title()}",
        "standardCodes": cluster["standard_codes"],
        "content": {
            "context":   response_data["context"],
            "problems":  response_data["problems"],
            "answerKey": response_data["answer_key"],
        },
    }
    r = httpx.post(f"{DB_URL}/api/worksheets/standard", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()

def generate_one(cluster, ws_type, ws_num, dry_run=False):
    print(f"  [{ws_num}/3] {ws_type:<10}", end=" ", flush=True)
    if dry_run:
        print("(dry run)")
        return {"id": "dry-run"}

    payload = {
        "cluster_key":            cluster["cluster_key"],
        "cluster_title":          cluster["title"],
        "grade":                  cluster["grade"],
        "subject":                cluster["subject"],
        "worksheet_type":         ws_type,
        "standard_codes":         cluster.get("standard_codes", []),
        "standard_descriptions":  cluster.get("standard_descriptions", []),
        "num_problems":           6,
    }
    r = httpx.post(f"{KG_URL}/generate-standard-worksheet", json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    saved = save_to_db(cluster, ws_type, ws_num, data)
    cost = data.get("cost_usd", 0)
    print(f"ok  (cost: ${cost:.4f}, id: {saved.get('id', '?')[:8]})")
    time.sleep(0.5)
    return saved

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--cluster-key", help="Run only one cluster")
    parser.add_argument("--limit", type=int, help="Limit to first N clusters")
    args = parser.parse_args()

    clusters_path = Path(__file__).parent.parent / "data" / "sample_50_clusters.json"
    clusters = json.loads(clusters_path.read_text())

    if args.cluster_key:
        clusters = [c for c in clusters if c["cluster_key"] == args.cluster_key]
        if not clusters:
            print(f"No cluster found with key: {args.cluster_key}")
            return

    if args.limit:
        clusters = clusters[:args.limit]

    print(f"\nGenerating worksheets for {len(clusters)} clusters x 3 types = {len(clusters)*3} total")
    print(f"Estimated cost: ${len(clusters) * 3 * 0.025:.2f}\n")

    total_cost = 0
    for i, cluster in enumerate(clusters, 1):
        print(f"[{i:2}/{len(clusters)}] {cluster['title'][:60]}")
        for j, ws_type in enumerate(WORKSHEET_TYPES, 1):
            generate_one(cluster, ws_type, j, dry_run=args.dry_run)

    print(f"\nDone. Generated {len(clusters) * 3} worksheets.")

if __name__ == "__main__":
    main()
