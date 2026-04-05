# Standards Cluster Deduplication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deduplicate 48,500 raw KG clusters into ~450 canonical topic clusters (K-8) using text-embedding-3-large + HDBSCAN, with GPT-4.1 naming and confidence scoring, and a browser-based review tool so a human only touches ~20% of clusters.

**Architecture:** Three stages gated by quality checks. Stage 1: Grade 3 Math pilot (~114 unique descriptions → expected 10 clusters) to validate HDBSCAN parameters before spending on the full run. Stage 2: Full K-8 embedding + clustering per (grade, subject) cell. Stage 3: GPT-4.1 names every cluster with a coherence score; human reviews only low-confidence ones via an HTML review tool; exports approved canonical cluster JSON.

**Tech Stack:** Python, `hdbscan`, `scikit-learn`, `numpy`, OpenAI `text-embedding-3-large`, GPT-4.1, vanilla HTML/JS review tool.

**Cost estimate:** ~$0.03 embeddings + ~$9 GPT-4.1 naming = ~$9 total for full K-8.

---

## Key Design Decisions

**Cluster per (grade, subject) cell, not globally.** Grade 1 addition and Grade 8 algebra share no vocabulary — global clustering would be meaningless. We run HDBSCAN independently on each of the 36 cells (9 grades × 4 subjects).

**Deduplicate by exact description_plain first.** Many states use identical or near-identical wording. Removing exact duplicates before embedding reduces the embedding set from ~19K to ~4K, dropping cost and improving cluster quality.

**Embed description_plain, not standard codes.** Codes like "3.NF.A.1" are meaningless to an embedding model. The description_plain is already human-readable and consistent.

**HDBSCAN over k-means.** HDBSCAN doesn't require specifying k, marks genuine outliers as noise, and handles variable cluster density. Noise points (typically unusual state-specific standards) get assigned to the nearest cluster post-hoc.

**GPT-4.1 scores coherence 1-5.** Clusters scoring ≥4 are auto-approved. Clusters scoring <4 go to the human review tool. Expected: ~80% auto-approve, ~20% human review (~90 of 450 clusters).

---

## Stage 1: Grade 3 Math Pilot

### Task 1: Install clustering dependencies

**Files:** `kg-service/requirements.txt` (add)

**Step 1: Install packages**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/pip install hdbscan scikit-learn numpy
```

**Step 2: Verify install**
```bash
.venv/bin/python -c "import hdbscan, sklearn, numpy; print('ok', hdbscan.__version__)"
```
Expected: `ok 0.8.x`

**Step 3: Add to requirements.txt**
```
hdbscan>=0.8.38
scikit-learn>=1.3.0
numpy>=1.24.0
```

**Step 4: Commit**
```bash
git add kg-service/requirements.txt
git commit -m "feat(clusters): add hdbscan + sklearn dependencies"
```

---

### Task 2: Create the embedding + clustering script

**Files:**
- Create: `kg-service/scripts/deduplicate_clusters.py`

**Step 1: Write the full script**

```python
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
    seen: dict[str, dict] = {}  # description_plain → representative standard
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
        metric="euclidean",  # L2 on normalized vectors ≈ cosine
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
    raw, _ = __import__("api.generate", fromlist=["_call_llm"])._call_llm(
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

    # Step 3: Cluster — auto-tune min_cluster_size
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
    """Grade 3 Math pilot — validate parameters before full run."""
    clusters = process_cell("3", "Math")
    print(f"\n{'='*60}")
    print("PILOT RESULTS: Grade 3 Math")
    print(f"Total clusters: {len(clusters)}")
    print(f"Expected: 8-15 clusters")
    print(f"\nCluster names:")
    for c in sorted(clusters, key=lambda x: -x.get("coherence_score", 0)):
        flag = "⚠ REVIEW" if c.get("needs_review") else "✓"
        print(f"  {flag} [{c['coherence_score']}/5] {c['canonical_name']}")
    # Save pilot summary
    (DATA_DIR / "pilot_summary.json").write_text(json.dumps(clusters, indent=2))
    print(f"\nFull results: {DATA_DIR / 'pilot_summary.json'}")


def run_full(grades: list[str]):
    """Full pipeline for specified grades × all subjects."""
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
    print(f"Auto-approved (score ≥4): {auto} ({auto/total*100:.0f}%)")
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
```

**Step 2: Commit**
```bash
git add kg-service/scripts/deduplicate_clusters.py
git commit -m "feat(clusters): embedding + HDBSCAN clustering pipeline"
```

---

### Task 3: Run the Grade 3 Math pilot

**Step 1: Run pilot**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m scripts.deduplicate_clusters --pilot
```

Expected output:
```
Processing: Grade 3 Math
  Found ~114 unique descriptions
  Embedding 114 descriptions with text-embedding-3-large...
  Got X clusters
  Naming X clusters with GPT-4.1...
PILOT RESULTS: Grade 3 Math
Total clusters: 8-15
Expected: 8-15 clusters
Cluster names:
  ✓ [5/5] Grade 3 Math: Fractions — Equal Parts and the Number Line
  ✓ [5/5] Grade 3 Math: Multiplication — Basic Facts and Arrays
  ...
```

**Gate:** The pilot passes if:
1. Cluster count is 8-15 (not 3, not 50)
2. At least 70% of clusters have coherence_score ≥ 4
3. The cluster names are recognizable Grade 3 Math topics
4. No obvious merges needed (e.g., two separate "fractions" clusters that should be one)

**Step 2: If gate passes, commit embeddings and cluster output**
```bash
git add kg-service/data/clusters/
git commit -m "feat(clusters): Grade 3 Math pilot results — X clusters"
```

**Step 3: If gate fails, tune HDBSCAN parameters**

If too many clusters (>20): increase `min_cluster_size` by 3-5 and rerun with `--skip-embed`.
If too few clusters (<6): decrease `min_cluster_size` by 3 and rerun with `--skip-embed`.
If coherence is low (<60% ≥4): check that description_plain values are actually semantic content (not empty or all the same). Try running without the "EE." prefix standards (alternative equivalent standards) which may add noise.

---

## Stage 2: Full K-8 Run

### Task 4: Run full K-8 embedding + clustering

**Step 1: Run full pipeline**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m scripts.deduplicate_clusters --grades K,1,2,3,4,5,6,7,8
```

This takes ~30-45 minutes (embedding API calls + GPT-4.1 naming).
Expected cost: ~$0.03 embeddings + ~$9 naming = ~$9.

Expected final output:
```
FULL RUN COMPLETE
Total canonical clusters: ~400-500
Auto-approved (score ≥4): ~320-380 (80%)
Needs human review: ~80-120 (20%)
Saved to: kg-service/data/clusters/all_named_clusters.json
```

**Step 2: Quick quality check**
```bash
.venv/bin/python -c "
import json
clusters = json.load(open('data/clusters/all_named_clusters.json'))
from collections import Counter
by_grade = Counter(c['grade'] for c in clusters)
by_subject = Counter(c['subject'] for c in clusters)
print('By grade:', dict(sorted(by_grade.items(), key=lambda x: (int(x[0]) if x[0].isdigit() else -1))))
print('By subject:', dict(by_subject))
print('Score dist:', Counter(c.get('coherence_score',0) for c in clusters))
print('Needs review:', sum(1 for c in clusters if c.get('needs_review')))
"
```

Expected: Each grade/subject cell has 8-18 clusters. Score distribution should be mostly 4s and 5s.

**Step 3: Commit**
```bash
git add kg-service/data/clusters/
git commit -m "feat(clusters): full K-8 canonical cluster run — N clusters total"
```

---

## Stage 3: HTML Review Tool

### Task 5: Build the cluster review tool

**Context:** A single HTML file that loads `all_named_clusters.json`, shows each cluster that needs review (sorted by confidence score, lowest first), and lets a human approve/rename/split/merge. When finished, downloads the approved JSON. No server needed — opens directly from the filesystem.

**Files:**
- Create: `kg-service/scripts/review_clusters.html`

**Step 1: Write the review tool**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cluster Review Tool — The Sage's Compass</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; background: #F5F3EF; color: #222; }
  .header { background: #0B2E4A; color: #F9F6EF; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 1.2rem; font-variant: small-caps; letter-spacing: 0.05em; }
  .progress { font-size: 0.85rem; color: rgba(249,246,239,0.7); }
  .controls { padding: 1rem 2rem; background: #fff; border-bottom: 1px solid #ddd; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  select, input { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-family: Georgia, serif; font-size: 0.85rem; }
  .btn { padding: 0.4rem 1rem; border-radius: 6px; font-family: Georgia, serif; font-size: 0.85rem; cursor: pointer; border: none; }
  .btn-export { background: #0B2E4A; color: #F9F6EF; }
  .btn-load { background: #4a8b6e; color: #fff; }
  .container { max-width: 1100px; margin: 0 auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .cluster-card { background: #fff; border-radius: 10px; padding: 1.25rem; border: 1px solid #e0e0e0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .cluster-card.approved { border-left: 4px solid #4a8b6e; }
  .cluster-card.needs-review { border-left: 4px solid #C4983D; }
  .cluster-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; }
  .cluster-name { font-size: 1rem; font-variant: small-caps; color: #0B2E4A; font-weight: 600; }
  .score-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; white-space: nowrap; }
  .score-5, .score-4 { background: #d4edda; color: #1a5c2a; }
  .score-3 { background: #fff3cd; color: #7a5c00; }
  .score-2, .score-1, .score-0 { background: #f8d7da; color: #7a1a1a; }
  .samples { font-size: 0.78rem; color: #555; margin-bottom: 0.75rem; }
  .samples li { margin-bottom: 0.2rem; padding-left: 0.5rem; border-left: 2px solid #ddd; }
  .reason { font-size: 0.75rem; color: #888; font-style: italic; margin-bottom: 0.75rem; }
  .split-alert { font-size: 0.75rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 0.35rem 0.6rem; margin-bottom: 0.75rem; color: #7a5c00; }
  .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
  .name-input { flex: 1; min-width: 300px; padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 6px; font-family: Georgia, serif; font-size: 0.9rem; }
  .btn-approve { background: #4a8b6e; color: #fff; }
  .btn-split { background: #C4983D; color: #fff; }
  .btn-reject { background: #B04040; color: #fff; }
  .btn-skip { background: #eee; color: #666; }
  .pills { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .pill { font-size: 0.65rem; padding: 0.15rem 0.45rem; border-radius: 4px; background: #eef; color: #44a; }
  .empty-state { text-align: center; padding: 4rem; color: #888; }
  .stats-row { display: flex; gap: 1.5rem; background: #fff; padding: 0.75rem 2rem; border-bottom: 1px solid #eee; font-size: 0.85rem; }
  .stat { display: flex; flex-direction: column; }
  .stat-n { font-size: 1.4rem; font-weight: 700; color: #0B2E4A; line-height: 1; }
  .stat-label { font-size: 0.65rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
</style>
</head>
<body>
<div class="header">
  <h1>Cluster Review Tool · The Sage's Compass</h1>
  <div class="progress" id="progress-text">Load a JSON file to begin</div>
</div>

<div class="controls">
  <input type="file" id="file-input" accept=".json" style="display:none">
  <button class="btn btn-load" onclick="document.getElementById('file-input').click()">Load JSON</button>
  <select id="filter-grade"><option value="">All Grades</option></select>
  <select id="filter-subject"><option value="">All Subjects</option></select>
  <select id="filter-status">
    <option value="needs_review">Needs Review First</option>
    <option value="all">All Clusters</option>
    <option value="approved">Approved Only</option>
  </select>
  <button class="btn btn-export" onclick="exportApproved()" id="export-btn" disabled>Export Approved JSON</button>
  <button class="btn" style="background:#6E6E9E;color:#fff" onclick="approveAll()">Auto-Approve All ≥4</button>
</div>

<div class="stats-row" id="stats-row" style="display:none">
  <div class="stat"><span class="stat-n" id="stat-total">0</span><span class="stat-label">Total</span></div>
  <div class="stat"><span class="stat-n" id="stat-approved" style="color:#4a8b6e">0</span><span class="stat-label">Approved</span></div>
  <div class="stat"><span class="stat-n" id="stat-review" style="color:#C4983D">0</span><span class="stat-label">Needs Review</span></div>
  <div class="stat"><span class="stat-n" id="stat-rejected" style="color:#B04040">0</span><span class="stat-label">Rejected</span></div>
</div>

<div class="container" id="cluster-container">
  <div class="empty-state">Load a JSON file from<br><code>kg-service/data/clusters/all_named_clusters.json</code></div>
</div>

<script>
let clusters = [];
let decisions = {};  // cluster_id+grade+subject → { action, name }

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    clusters = JSON.parse(ev.target.result);
    // Auto-approve high-confidence clusters
    clusters.forEach(c => {
      const key = clusterKey(c);
      if (c.coherence_score >= 4 && !c.split_topics?.length) {
        decisions[key] = { action: 'approved', name: c.canonical_name };
      }
    });
    populateFilters();
    updateStats();
    render();
    document.getElementById('export-btn').disabled = false;
    document.getElementById('stats-row').style.display = 'flex';
  };
  reader.readAsText(file);
});

function clusterKey(c) {
  return `${c.grade}__${c.subject}__${c.cluster_id}`;
}

function populateFilters() {
  const grades = [...new Set(clusters.map(c => c.grade))].sort((a,b) => (parseInt(a)||0)-(parseInt(b)||0));
  const subjects = [...new Set(clusters.map(c => c.subject))].sort();
  const gSel = document.getElementById('filter-grade');
  const sSel = document.getElementById('filter-subject');
  grades.forEach(g => { const o = document.createElement('option'); o.value = g; o.text = g === 'K' ? 'Kindergarten' : 'Grade ' + g; gSel.appendChild(o); });
  subjects.forEach(s => { const o = document.createElement('option'); o.value = s; o.text = s; sSel.appendChild(o); });
  [gSel, sSel, document.getElementById('filter-status')].forEach(el => el.addEventListener('change', render));
}

function updateStats() {
  const total = clusters.length;
  const approved = Object.values(decisions).filter(d => d.action === 'approved').length;
  const rejected = Object.values(decisions).filter(d => d.action === 'rejected').length;
  const review = total - approved - rejected;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-approved').textContent = approved;
  document.getElementById('stat-rejected').textContent = rejected;
  document.getElementById('stat-review').textContent = review;
  document.getElementById('progress-text').textContent = `${approved}/${total} approved · ${review} remaining`;
}

function approveAll() {
  clusters.forEach(c => {
    if (c.coherence_score >= 4) {
      decisions[clusterKey(c)] = { action: 'approved', name: c.canonical_name };
    }
  });
  updateStats(); render();
}

function render() {
  const grade = document.getElementById('filter-grade').value;
  const subject = document.getElementById('filter-subject').value;
  const status = document.getElementById('filter-status').value;

  let filtered = clusters.filter(c => {
    if (grade && c.grade !== grade) return false;
    if (subject && c.subject !== subject) return false;
    const key = clusterKey(c);
    const dec = decisions[key];
    if (status === 'needs_review') return !dec;
    if (status === 'approved') return dec?.action === 'approved';
    return true;
  });

  // Sort: needs review first (by coherence score asc), then approved
  filtered.sort((a, b) => {
    const da = decisions[clusterKey(a)], db = decisions[clusterKey(b)];
    if (!da && db) return -1;
    if (da && !db) return 1;
    return (a.coherence_score || 0) - (b.coherence_score || 0);
  });

  const container = document.getElementById('cluster-container');
  if (!filtered.length) { container.innerHTML = '<div class="empty-state">No clusters match the current filter.</div>'; return; }

  container.innerHTML = filtered.map(c => {
    const key = clusterKey(c);
    const dec = decisions[key];
    const cardClass = dec ? (dec.action === 'approved' ? 'approved' : 'needs-review') : 'needs-review';
    const currentName = dec?.name || c.canonical_name || '';
    const splitAlert = c.split_topics?.length ? `<div class="split-alert">⚠ GPT-4.1 suggests splitting: ${c.split_topics.join(' / ')}</div>` : '';
    const pills = `<div class="pills"><span class="pill">Grade ${c.grade}</span><span class="pill">${c.subject}</span><span class="pill">${c.n_standards} standards</span>${c.merge_suggestion ? '<span class="pill" style="background:#ffe;color:#880">Merge?</span>' : ''}</div>`;
    const samples = c.sample_standards?.slice(0, 5).map(s => `<li>${s.length > 100 ? s.slice(0, 97) + '...' : s}</li>`).join('') || '';
    const scoreClass = `score-${Math.max(0, Math.min(5, c.coherence_score || 0))}`;
    const decBadge = dec ? (dec.action === 'approved' ? '<span style="color:#4a8b6e;font-size:0.75rem;font-weight:600">✓ APPROVED</span>' : '<span style="color:#B04040;font-size:0.75rem;font-weight:600">✗ REJECTED</span>') : '';
    return `<div class="cluster-card ${cardClass}" id="card-${key.replace(/[^a-zA-Z0-9]/g,'_')}">
      <div class="cluster-header">
        <div>
          ${pills}
          <div class="cluster-name">${c.canonical_name || 'Unnamed'}</div>
        </div>
        <div style="display:flex;gap:0.4rem;align-items:center;flex-shrink:0">
          ${decBadge}
          <span class="score-badge ${scoreClass}">${c.coherence_score || '?'}/5</span>
        </div>
      </div>
      ${c.coherence_reason ? `<div class="reason">${c.coherence_reason}</div>` : ''}
      ${splitAlert}
      <ul class="samples">${samples}</ul>
      <div class="actions">
        <input type="text" class="name-input" id="name-${key.replace(/[^a-zA-Z0-9]/g,'_')}" value="${currentName}" placeholder="Canonical name...">
        <button class="btn btn-approve" onclick="decide('${key}', 'approved')">✓ Approve</button>
        <button class="btn btn-reject" onclick="decide('${key}', 'rejected')">✗ Reject</button>
        <button class="btn btn-skip" onclick="decide('${key}', null)">↩ Reset</button>
      </div>
    </div>`;
  }).join('');
}

function decide(key, action) {
  const inputId = 'name-' + key.replace(/[^a-zA-Z0-9]/g,'_');
  const nameEl = document.getElementById(inputId);
  if (action) {
    decisions[key] = { action, name: nameEl ? nameEl.value : '' };
  } else {
    delete decisions[key];
  }
  updateStats(); render();
}

function exportApproved() {
  const approved = clusters
    .filter(c => decisions[clusterKey(c)]?.action === 'approved')
    .map(c => ({
      ...c,
      canonical_name: decisions[clusterKey(c)].name || c.canonical_name,
      review_status: 'approved',
    }));
  const blob = new Blob([JSON.stringify(approved, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'canonical_clusters_approved.json'; a.click();
  alert(`Exported ${approved.length} approved clusters.`);
}
</script>
</body>
</html>
```

**Step 2: Commit**
```bash
git add kg-service/scripts/review_clusters.html
git commit -m "feat(clusters): HTML review tool for cluster deduplication"
```

**Step 3: Test with pilot data**
```bash
open kg-service/scripts/review_clusters.html
# Load: kg-service/data/clusters/pilot_summary.json
```
Verify: All Grade 3 Math clusters appear, coherence scores show, approve/rename works, export downloads JSON.

---

## Stage 4: Post-Review Export and Integration

### Task 6: Export and integrate canonical clusters

**Files:**
- Create: `kg-service/scripts/export_canonical_clusters.py`
- Modify: `kg-service/data/canonical_clusters.json` (output)
- Modify: `kg-service/data/standard_to_cluster.json` (output — mapping)

**Step 1: Write the export script**

```python
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
```

**Step 2: After review, run export**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m scripts.export_canonical_clusters \
  --input data/clusters/canonical_clusters_approved.json
```
Expected: `canonical_clusters.json` and `standard_to_cluster.json` written to `data/`.

**Step 3: Update batch generation to use canonical clusters**

In `kg-service/scripts/generate_sample_worksheets.py`, replace the hardcoded `sample_50_clusters.json` with the canonical clusters:

```python
# At top of generate_sample_worksheets.py, add:
CANONICAL_CLUSTERS_PATH = Path(__file__).parent.parent / "data" / "canonical_clusters.json"

# Update main() to load from canonical file if it exists:
def main():
    if CANONICAL_CLUSTERS_PATH.exists() and not args.use_sample:
        clusters_path = CANONICAL_CLUSTERS_PATH
        print(f"Using canonical clusters: {CANONICAL_CLUSTERS_PATH}")
    else:
        clusters_path = Path(__file__).parent.parent / "data" / "sample_50_clusters.json"
    clusters = json.loads(clusters_path.read_text())
    # ... rest unchanged
```

**Step 4: Commit everything**
```bash
git add kg-service/scripts/ kg-service/data/canonical_clusters.json kg-service/data/standard_to_cluster.json
git commit -m "feat(clusters): canonical cluster export + standard code mapping"
git push origin main
```

---

## Verification Checklist

| Gate | Command | Pass Criteria |
|---|---|---|
| Deps installed | `python -c "import hdbscan"` | No error |
| Pilot quality | `--pilot` output | 8-15 Grade 3 Math clusters, ≥70% score ≥4 |
| Cluster names | Read pilot_summary.json | Names look like real curriculum topics |
| Full K-8 size | Check all_named_clusters.json | 350-550 total clusters |
| Auto-approve rate | Check stats | ≥75% auto-approved (score ≥4) |
| Review tool | Open HTML, load JSON | Approve/export workflow works |
| Export | Run export script | canonical_clusters.json has clean keys |
| Standard mapping | Check standard_to_cluster.json | At least 3,000 codes mapped |

## Cost Summary

| Step | Model | Estimated Cost |
|---|---|---|
| K-8 embeddings (~5K unique descriptions) | text-embedding-3-large | ~$0.04 |
| K-8 cluster naming (~450 clusters) | gpt-4.1 | ~$9.00 |
| Human review time (~80-120 clusters) | — | ~45 minutes |
| **Total** | | **~$9.04** |
