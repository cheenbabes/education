# Worksheet And Clustering Handoff

This document captures the current state of the unlaunched worksheet system and the standards clustering pipeline so a future agent can continue the work directly from the repo.

## Current State

- Worksheets are not launched yet on the web app.
- The standards clustering pipeline is implemented and its main outputs are already in the repo.
- Local embedding caches and worksheet eval reports existed outside git and have now been preserved in the repo as part of this commit.

Current data counts:

- `kg-service/data/topic_clusters.json`: 48,500 raw topic clusters
- `kg-service/data/clusters/all_named_clusters.json`: 444 clustering outputs from the full K-8 run
- `kg-service/data/canonical_clusters.json`: 589 canonical worksheet-generation clusters
- `kg-service/data/sample_50_clusters.json`: 50-cluster validation set
- `kg-service/data/standard_to_cluster.json`: standard code -> canonical cluster key map
- `kg-service/data/clusters/embeddings_*.npy`: 36 cached embedding arrays, one per `(grade, subject)` cell

## Key KG Files

Pipeline source:

- `kg-service/scripts/deduplicate_clusters.py`
- `kg-service/scripts/export_canonical_clusters.py`
- `kg-service/scripts/generate_sample_worksheets.py`
- `kg-service/scripts/extract_clusters.py`
- `kg-service/scripts/review_clusters.html`
- `kg-service/scripts/split_flagged_clusters.py`
- `kg-service/api/standard_worksheet.py`
- `kg-service/evals/worksheet_eval.py`

Important data outputs:

- `kg-service/data/topic_clusters.json`
- `kg-service/data/canonical_clusters.json`
- `kg-service/data/sample_50_clusters.json`
- `kg-service/data/standard_to_cluster.json`
- `kg-service/data/standard_worksheets_insert.sql`
- `kg-service/data/clusters/standards_*.json`
- `kg-service/data/clusters/embeddings_*.npy`
- `kg-service/data/clusters/named_clusters_*.json`
- `kg-service/data/clusters/canonical_clusters_approved.json`
- `kg-service/data/clusters/all_named_clusters.json`
- `kg-service/reports/worksheet-eval*.json`

Local KG test/dev support:

- `kg-service/tests/test_progress_api.py`
- `kg-service/tests/test_standards_api.py`
- `kg-service/pytest.ini`
- `kg-service/requirements-dev.txt`

## Key Web Files

These are the main web-side worksheet integration points:

- `web/src/app/api/worksheets/route.ts`
- `web/src/app/api/worksheets/standard/route.ts`
- `web/src/app/api/worksheets/standard/[id]/pdf/route.ts`
- `web/src/app/api/lessons/[id]/worksheet/route.ts`
- `web/src/lib/worksheetSvg.ts`
- `web/src/lib/featureFlags.ts`

## Pipeline Shape

### Standards clustering

1. Extract or collect standards into normalized topic data.
2. Build per-cell standards files: `standards_{slug}.json`
3. Embed the `description_plain` texts into `embeddings_{slug}.npy`
4. Cluster with HDBSCAN into `named_clusters_{slug}.json`
5. Review / split flagged clusters
6. Export canonical worksheet-generation clusters into `data/canonical_clusters.json`

### Worksheet generation

1. Read canonical clusters from `kg-service/data/canonical_clusters.json`
2. Generate structured worksheets via `POST /generate-standard-worksheet`
3. Save generated worksheets to the web DB through `/api/worksheets/standard`
4. Render PDFs from the web-side PDF route

## Critical Reuse Rule For Embeddings

For any slug, the row order in:

- `kg-service/data/clusters/embeddings_{slug}.npy`

must match the row order in:

- `kg-service/data/clusters/standards_{slug}.json`

That is what makes `--skip-embed` safe.

If a standards file is regenerated or reordered, do not reuse the old embedding file for that slug.

## Typical Tuning Command

```bash
cd kg-service
python -m scripts.deduplicate_clusters --grade 3 --subject Math --skip-embed
```

That reuses:

- `kg-service/data/clusters/standards_3-math.json`
- `kg-service/data/clusters/embeddings_3-math.npy`

and rewrites:

- `kg-service/data/clusters/named_clusters_3-math.json`

## Relevant Historical Commits

- `a59cd1b` - initial embedding + HDBSCAN clustering pipeline
- `477bc0f` - Grade 3 Math pilot results
- `14155f0` - full K-8 clustering outputs
- `fbc99d8` - standard worksheet generation endpoint + batch script
- `0e9787e` - batch script updated to use canonical clusters / Claude

## Launch Context

- Worksheets are intentionally not launched yet.
- The repo still contains worksheet routes and pipeline code.
- The web side currently feature-gates worksheet availability.
- Future work can tune the clustering outputs or worksheet generation quality without rebuilding the entire pipeline from scratch.
