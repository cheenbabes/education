# kg-service/scripts/deduplicate_clusters.py
"""
Deduplicate KG standards into canonical topic clusters using:
  1. text-embedding-3-large (OpenAI) for semantic embeddings
  2. HDBSCAN for automatic cluster detection
  3. GPT-4.1 for cluster naming + coherence scoring

Usage:
  # Stage 1: Grade 3 Math pilot (validate parameters)
  python -m scripts.deduplicate_clusters --pilot

  # Stage 2: Full K-8
  python -m scripts.deduplicate_clusters --grades K,1,2,3,4,5,6,7,8

  # Single cell
  python -m scripts.deduplicate_clusters --grade 3 --subject Math

  # Skip embedding (reuse saved), redo clustering only
  python -m scripts.deduplicate_clusters --grade 3 --subject Math --skip-embed
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Optional

import hdbscan
import numpy as np
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity

from config import settings
from kg.query import get_standards
from api.generate import _call_llm

DATA_DIR = Path(__file__).parent.parent / "data" / "clusters"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SUBJECTS = ["Math", "Science", "Language Arts", "Social Studies"]
GRADES_K8 = ["K", "1", "2", "3", "4", "5", "6", "7", "8"]
ALL_STATES = ["MI", "TX", "CA", "FL", "NY", "PA", "OH", "GA", "NC", "VA",
              "WA", "AZ", "CO", "TN", "IN", "MO", "MD", "WI", "MN", "SC",
              "AL", "LA", "KY", "OR", "OK", "CT", "UT", "NV", "AR", "MS",
              "KS", "NM", "NE", "WV", "ID", "HI", "NH", "ME", "MT", "RI",
              "DE", "SD", "ND", "AK", "VT", "WY"]

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", settings.openai_api_key))

NAMING_SYSTEM = """You are an expert K-12 curriculum specialist. Given a set of educational standards
descriptions from various states, they all describe the same teaching concept.

Respond with JSON only:
{
  "canonical_name": "Grade {grade} {subject}: {Topic} — {Subtopic}",
  "coherence_score": 1-5,
  "coherence_reason": "one sentence",
  "split_topics": ["topic A", "topic B"] or [],
  "merge_suggestion": "another cluster name" or null
}

Coherence scoring:
5 = All standards clearly about the same single concept. No ambiguity.
4 = Mostly the same concept, minor variation in emphasis.
3 = Related but contains 2 distinct sub-concepts. Consider splitting.
2 = Poorly grouped. Contains clearly different topics.
1 = Should definitely be split into 2+ clusters.

For canonical_name: format exactly as "Grade {grade} {subject}: {main topic} — {subtopic}"
Example: "Grade 3 Math: Fractions — Equal Parts and the Number Line"
For Kindergarten use "Kindergarten" not "Grade K".
"""

def collect_unique_standards(grade: str, subject: str) -> list[dict]:
    """Collect all unique description_plain values for a (grade, subject) cell across states."""
    seen: dict[str, dict] = {}  # description_plain -> representative standard
    for state in ALL_STATES:
        try:
            stds = get_standards(state, grade, subject) or []
        except Exception:
            continue
        for s in stds:
            desc = (s.get("description_plain") or "").strip()
            if desc and desc not in seen:
                seen[desc] = {"code": s.get("code", ""), "state": state,
                              "description_plain": desc, "grade": grade, "subject": subject}
    return list(seen.values())


def embed_batch(texts: list[str], model="text-embedding-3-large") -> np.ndarray:
    """Embed a batch of texts, handling rate limits."""
    all_vecs = []
    batch_size = 500
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        while True:
            try:
                resp = client.embeddings.create(model=model, input=batch)
                vecs = [item.embedding for item in resp.data]
                all_vecs.extend(vecs)
                print(f"  Embedded {min(i + batch_size, len(texts))}/{len(texts)}")
                break
            except Exception as e:
                if "rate" in str(e).lower():
                    print(f"  Rate limit, waiting 20s...")
                    time.sleep(20)
                else:
                    raise
        time.sleep(0.3)
    return np.array(all_vecs, dtype=np.float32)


def cluster_embeddings(
    embeddings: np.ndarray,
    min_cluster_size: int = 8,
    min_samples: int = 3,
) -> np.ndarray:
    """Run HDBSCAN. Returns array of cluster labels (-1 = noise)."""
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=min_samples,
        metric="euclidean",  # L2 on normalized vectors ~ cosine
        cluster_selection_method="eom",
    )
    # Normalize for cosine-like behavior
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normed = embeddings / np.maximum(norms, 1e-8)
    labels = clusterer.fit_predict(normed)
    return labels


def assign_noise_to_nearest(
    embeddings: np.ndarray, labels: np.ndarray
) -> np.ndarray:
    """Assign noise points (-1) to the nearest cluster centroid."""
    labels = labels.copy()
    unique_clusters = [c for c in set(labels) if c >= 0]
    if not unique_clusters:
        return labels
    centroids = np.array([
        embeddings[labels == c].mean(axis=0) for c in unique_clusters
    ])
    noise_mask = labels == -1
    if not noise_mask.any():
        return labels
    sims = cosine_similarity(embeddings[noise_mask], centroids)
    nearest = sims.argmax(axis=1)
    labels[noise_mask] = [unique_clusters[i] for i in nearest]
    return labels


def name_cluster_gpt4(
    samples: list[str], grade: str, subject: str
) -> dict:
    """Use GPT-4.1 to name a cluster and score its coherence."""
    sample_text = "\n".join(f"- {s}" for s in samples[:10])
    user_msg = f"Grade: {grade}\nSubject: {subject}\n\nStandard descriptions:\n{sample_text}"
    raw, _ = _call_llm(
        settings.openai_extraction_model,
        NAMING_SYSTEM,
        user_msg,
        max_tokens=400,
        call_type="cluster_naming",
    )
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(raw)


def process_cell(grade: str, subject: str, skip_embed: bool = False) -> list[dict]:
    """Full pipeline for one (grade, subject) cell. Returns list of cluster dicts."""
    slug = f"{grade.lower()}-{subject.lower().replace(' ', '_')}"
    embed_path = DATA_DIR / f"embeddings_{slug}.npy"
    stds_path = DATA_DIR / f"standards_{slug}.json"

    print(f"\n{'='*60}")
    print(f"Processing: Grade {grade} {subject}")

    # Step 1: Collect unique standards
    if not stds_path.exists() or not skip_embed:
        print("  Collecting unique standards across states...")
        stds = collect_unique_standards(grade, subject)
        stds_path.write_text(json.dumps(stds, indent=2))
        print(f"  Found {len(stds)} unique descriptions")
    else:
        stds = json.loads(stds_path.read_text())
        print(f"  Loaded {len(stds)} unique descriptions")

    if len(stds) < 5:
        print(f"  Too few standards ({len(stds)}), skipping")
        return []

    # Step 2: Embed
    if not embed_path.exists() or not skip_embed:
        print(f"  Embedding {len(stds)} descriptions with text-embedding-3-large...")
        texts = [s["description_plain"] for s in stds]
        embeddings = embed_batch(texts)
        np.save(embed_path, embeddings)
    else:
        embeddings = np.load(embed_path)
        print(f"  Loaded embeddings {embeddings.shape}")

    # Step 3: Cluster -- auto-tune min_cluster_size
    # Target: 8-20 clusters per cell. Start at floor(sqrt(n_stds)) and adjust.
    n = len(stds)
    target_clusters = max(5, min(20, n // 15))  # aim for n/15 clusters
    min_cs = max(4, n // (target_clusters * 2))
    print(f"  Clustering (n={n}, min_cluster_size={min_cs}, target~{target_clusters})...")
    labels = cluster_embeddings(embeddings, min_cluster_size=min_cs)
    labels = assign_noise_to_nearest(embeddings, labels)
    n_clusters = len(set(labels))
    print(f"  Got {n_clusters} clusters")

    # Step 4: Build cluster groups
    clusters = []
    for cluster_id in sorted(set(labels)):
        mask = labels == cluster_id
        cluster_stds = [stds[i] for i in range(len(stds)) if mask[i]]
        cluster_embeddings_subset = embeddings[mask]
        # Intra-cluster coherence score (avg cosine similarity to centroid)
        centroid = cluster_embeddings_subset.mean(axis=0)
        sims = cosine_similarity(cluster_embeddings_subset, centroid.reshape(1, -1)).flatten()
        intra_coherence = float(sims.mean())
        clusters.append({
            "cluster_id": cluster_id,
            "grade": grade,
            "subject": subject,
            "n_standards": int(mask.sum()),
            "intra_coherence": round(intra_coherence, 3),
            "sample_standards": [s["description_plain"] for s in cluster_stds[:8]],
            "all_codes": [s["code"] for s in cluster_stds],
        })

    # Step 5: Name each cluster with GPT-4.1
    print(f"  Naming {n_clusters} clusters with GPT-4.1...")
    for i, cluster in enumerate(clusters):
        try:
            naming = name_cluster_gpt4(cluster["sample_standards"], grade, subject)
            cluster["canonical_name"] = naming.get("canonical_name", f"Grade {grade} {subject}: Cluster {i+1}")
            cluster["coherence_score"] = naming.get("coherence_score", 3)
            cluster["coherence_reason"] = naming.get("coherence_reason", "")
            cluster["split_topics"] = naming.get("split_topics", [])
            cluster["merge_suggestion"] = naming.get("merge_suggestion")
            cluster["needs_review"] = cluster["coherence_score"] < 4 or bool(cluster["split_topics"])
            print(f"    [{i+1}/{n_clusters}] {cluster['canonical_name'][:60]} (score: {cluster['coherence_score']})")
        except Exception as e:
            print(f"    [{i+1}/{n_clusters}] naming failed: {e}")
            cluster["canonical_name"] = f"Grade {grade} {subject}: Cluster {i+1}"
            cluster["coherence_score"] = 0
            cluster["needs_review"] = True
        time.sleep(0.5)

    # Save
    out_path = DATA_DIR / f"named_clusters_{slug}.json"
    out_path.write_text(json.dumps(clusters, indent=2))
    n_needs_review = sum(1 for c in clusters if c.get("needs_review"))
    print(f"  Saved to {out_path}")
    print(f"  Auto-approve: {n_clusters - n_needs_review}, needs review: {n_needs_review}")
    return clusters


def run_pilot():
    """Grade 3 Math pilot -- validate parameters before full run."""
    clusters = process_cell("3", "Math")
    print(f"\n{'='*60}")
    print("PILOT RESULTS: Grade 3 Math")
    print(f"Total clusters: {len(clusters)}")
    print(f"Expected: 8-15 clusters")
    print(f"\nCluster names:")
    for c in sorted(clusters, key=lambda x: -x.get("coherence_score", 0)):
        flag = "!! REVIEW" if c.get("needs_review") else "ok"
        print(f"  {flag} [{c['coherence_score']}/5] {c['canonical_name']}")
    # Save pilot summary
    (DATA_DIR / "pilot_summary.json").write_text(json.dumps(clusters, indent=2))
    print(f"\nFull results: {DATA_DIR / 'pilot_summary.json'}")


def run_full(grades: list[str]):
    """Full pipeline for specified grades x all subjects."""
    all_clusters = []
    for grade in grades:
        for subject in SUBJECTS:
            clusters = process_cell(grade, subject)
            all_clusters.extend(clusters)
    out = DATA_DIR / "all_named_clusters.json"
    out.write_text(json.dumps(all_clusters, indent=2))
    total = len(all_clusters)
    needs_review = sum(1 for c in all_clusters if c.get("needs_review"))
    auto = total - needs_review
    print(f"\n{'='*60}")
    print(f"FULL RUN COMPLETE")
    print(f"Total canonical clusters: {total}")
    print(f"Auto-approved (score >=4): {auto} ({auto/total*100:.0f}%)")
    print(f"Needs human review: {needs_review} ({needs_review/total*100:.0f}%)")
    print(f"Saved to: {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", action="store_true", help="Grade 3 Math pilot only")
    parser.add_argument("--grades", help="Comma-separated grades, e.g. K,1,2,3,4,5,6,7,8")
    parser.add_argument("--grade", help="Single grade")
    parser.add_argument("--subject", help="Single subject (use with --grade)")
    parser.add_argument("--skip-embed", action="store_true", help="Reuse saved embeddings")
    args = parser.parse_args()

    if args.pilot:
        run_pilot()
    elif args.grade and args.subject:
        process_cell(args.grade, args.subject, skip_embed=args.skip_embed)
    elif args.grades:
        run_full(args.grades.split(","))
    else:
        run_full(GRADES_K8)
