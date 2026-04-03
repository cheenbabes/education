"""
Auto-split the 208 flagged clusters by re-running HDBSCAN on each one
with a tighter min_cluster_size, then name the sub-clusters with GPT-4.1.

Usage:
    python -m scripts.split_flagged_clusters \
        --approved data/clusters/canonical_clusters_approved.json \
        --flagged  data/clusters/all_named_clusters.json

The script:
1. Loads already-approved clusters (236 from manual auto-approve)
2. For each flagged cluster, extracts its standards' embeddings from saved .npy files
3. Re-runs HDBSCAN with min_cluster_size=4 to force finer splits
4. Names each sub-cluster with GPT-4.1 (only if it actually split)
5. If a cluster refuses to split further, approves it as-is
6. Writes combined canonical_clusters_approved.json
"""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

import hdbscan
import numpy as np
from openai import OpenAI

from config import settings
from api.generate import _call_llm

DATA_DIR = Path(__file__).parent.parent / "data" / "clusters"
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", getattr(settings, "openai_api_key", None)))

NAMING_SYSTEM = """You are an expert K-12 curriculum specialist. These educational standards all describe the same teaching concept after being clustered together.

Respond with JSON only:
{
  "canonical_name": "Grade {grade} {subject}: {Topic} — {Subtopic}",
  "coherence_score": 1-5,
  "coherence_reason": "one sentence"
}

Coherence: 5=perfect single concept, 4=mostly same, 3=slightly mixed, 2=two topics, 1=unrelated mix.
Format name exactly as: "Grade {grade} {subject}: {main topic} — {subtopic}"
Use "Kindergarten" not "Grade K"."""


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:80]


def cell_slug(grade: str, subject: str) -> str:
    return f"{grade.lower()}-{subject.lower().replace(' ', '_')}"


def load_cell_data(grade: str, subject: str):
    """Load standards list and embeddings for a (grade, subject) cell."""
    slug = cell_slug(grade, subject)
    stds_path = DATA_DIR / f"standards_{slug}.json"
    embed_path = DATA_DIR / f"embeddings_{slug}.npy"
    if not stds_path.exists() or not embed_path.exists():
        return None, None
    stds = json.loads(stds_path.read_text())
    embeddings = np.load(embed_path)
    return stds, embeddings


def get_cluster_embeddings(codes: list[str], stds: list[dict], embeddings: np.ndarray):
    """Extract embeddings for the specific standard codes in this cluster."""
    code_set = set(codes)
    indices = [i for i, s in enumerate(stds) if s.get("code") in code_set]
    if not indices:
        return np.array([]), []
    return embeddings[indices], [stds[i] for i in indices]


def name_subcluster(samples: list[str], grade: str, subject: str) -> dict:
    """Name a sub-cluster using GPT-4.1."""
    sample_text = "\n".join(f"- {s}" for s in samples[:8])
    user = f"Grade: {grade}\nSubject: {subject}\n\nStandard descriptions:\n{sample_text}"
    raw, _ = _call_llm(
        settings.openai_extraction_model,
        NAMING_SYSTEM,
        user,
        max_tokens=300,
        call_type="cluster_naming",
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


def split_one_cluster(cluster: dict, stds: list[dict], embeddings: np.ndarray) -> list[dict]:
    """
    Try to split a flagged cluster by re-running HDBSCAN with tighter params.
    Returns a list of 1+ sub-clusters (may be just the original if it won't split).
    """
    codes = cluster.get("all_codes", [])
    if not codes:
        return [cluster]

    sub_embs, sub_stds = get_cluster_embeddings(codes, stds, embeddings)
    if len(sub_embs) < 4:
        # Too few points to meaningfully split
        return [cluster]

    # Normalize for cosine-like behavior
    norms = np.linalg.norm(sub_embs, axis=1, keepdims=True)
    normed = sub_embs / np.maximum(norms, 1e-8)

    # Try progressively tighter clustering
    for min_cs in [4, 3, 2]:
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cs,
            min_samples=2,
            metric="euclidean",
            cluster_selection_method="eom",
        )
        labels = clusterer.fit_predict(normed)
        unique = [l for l in set(labels) if l >= 0]
        if len(unique) >= 2:
            break
    else:
        # Couldn't split — return original as approved
        cluster["coherence_score"] = max(cluster.get("coherence_score", 3), 3)
        cluster["needs_review"] = False
        cluster["split_note"] = "could_not_split"
        return [cluster]

    # Assign noise to nearest cluster
    for i, label in enumerate(labels):
        if label == -1:
            sims = [np.dot(normed[i], normed[labels == c].mean(axis=0))
                    for c in unique]
            labels[i] = unique[int(np.argmax(sims))]

    # Build sub-clusters
    result = []
    grade, subject = cluster["grade"], cluster["subject"]
    for sub_id in sorted(set(labels)):
        mask = labels == sub_id
        sub_cluster_stds = [sub_stds[i] for i in range(len(sub_stds)) if mask[i]]
        sample_descs = [s["description_plain"] for s in sub_cluster_stds[:8]]
        sub_codes = [s["code"] for s in sub_cluster_stds]

        try:
            naming = name_subcluster(sample_descs, grade, subject)
            result.append({
                "cluster_id": f"{cluster['cluster_id']}_sub{sub_id}",
                "grade": grade,
                "subject": subject,
                "n_standards": int(mask.sum()),
                "canonical_name": naming.get("canonical_name", f"{cluster['canonical_name']} (part {sub_id+1})"),
                "coherence_score": naming.get("coherence_score", 3),
                "coherence_reason": naming.get("coherence_reason", ""),
                "split_topics": [],
                "merge_suggestion": None,
                "needs_review": False,
                "sample_standards": sample_descs[:5],
                "all_codes": sub_codes,
                "parent_cluster": cluster["cluster_id"],
            })
            print(f"    → [{naming.get('coherence_score',3)}/5] {naming.get('canonical_name','?')[:60]}")
            time.sleep(0.4)
        except Exception as e:
            print(f"    → naming failed: {e}, keeping original segment")
            result.append({**cluster, "cluster_id": f"{cluster['cluster_id']}_sub{sub_id}",
                           "all_codes": sub_codes, "n_standards": int(mask.sum()),
                           "needs_review": False})

    return result


def main(approved_path: str, flagged_path: str):
    # Load already-approved clusters
    approved_file = Path(approved_path)
    if approved_file.exists():
        approved = json.loads(approved_file.read_text())
        print(f"Loaded {len(approved)} already-approved clusters")
    else:
        approved = []
        print("No pre-approved file found — starting fresh")

    # Load all clusters to find flagged ones
    all_clusters = json.loads(Path(flagged_path).read_text())
    approved_keys = {(c["grade"], c["subject"], c.get("cluster_id")) for c in approved}

    flagged = [c for c in all_clusters
               if c.get("needs_review")
               and (c["grade"], c["subject"], c.get("cluster_id")) not in approved_keys]

    print(f"Flagged clusters to auto-split: {len(flagged)}")

    # Group by (grade, subject) cell to load embeddings once per cell
    from collections import defaultdict
    by_cell = defaultdict(list)
    for c in flagged:
        by_cell[(c["grade"], c["subject"])].append(c)

    new_clusters = list(approved)  # start with approved
    total_input = len(flagged)
    processed = 0

    for (grade, subject), cell_clusters in by_cell.items():
        print(f"\n--- Grade {grade} {subject} ({len(cell_clusters)} flagged) ---")
        stds, embeddings = load_cell_data(grade, subject)
        if stds is None:
            print(f"  No embedding data found, approving as-is")
            for c in cell_clusters:
                c["needs_review"] = False
                new_clusters.append(c)
            continue

        for cluster in cell_clusters:
            processed += 1
            print(f"  [{processed}/{total_input}] Splitting: {cluster.get('canonical_name','?')[:55]} (score {cluster.get('coherence_score','?')})")
            sub_clusters = split_one_cluster(cluster, stds, embeddings)
            new_clusters.extend(sub_clusters)

    # Save combined result
    out_path = DATA_DIR / "canonical_clusters_approved.json"
    out_path.write_text(json.dumps(new_clusters, indent=2))

    total = len(new_clusters)
    from_splits = total - len(approved)
    print(f"\n{'='*60}")
    print(f"Done. Total canonical clusters: {total}")
    print(f"  Original approved: {len(approved)}")
    print(f"  From auto-splits:  {from_splits}")
    print(f"Saved to: {out_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--approved", default="data/clusters/canonical_clusters_approved.json",
                        help="JSON downloaded from review tool (the 236 you approved)")
    parser.add_argument("--flagged", default="data/clusters/all_named_clusters.json",
                        help="Full K-8 cluster output")
    args = parser.parse_args()
    main(args.approved, args.flagged)
