# Worksheet Launch Assessment

*Prepared April 13, 2026*

## Executive Summary

The current standard worksheet corpus is strong enough to launch if worksheets are positioned as a premium, standards-aligned companion to lessons. It is not strong enough to market as a full printable K-8 curriculum library or as a giant browse-first worksheet catalog.

The important point is that lesson generation may feel open-ended to parents, but the standards-aligned worksheet path is not open-ended in the same way. Most lesson requests still collapse onto the same canonical standards clusters. That means worksheet sufficiency is mostly a question of cluster coverage and worksheet quality, not raw lesson prompt variety.

The launch recommendation is: ship the standard worksheet cutover once the production migration and one-time worksheet import are done, keep the UX lesson-first, and use narrower positioning language. The main follow-up after launch should be Social Studies re-clustering and variant expansion.

## Current State

| Area | Status | Evidence |
| --- | --- | --- |
| Raw standards corpus | Complete | `kg-service/data/standards/` contains 52 JSON files and 491,286 total rows |
| Standard-to-cluster mapping | Complete | `kg-service/data/standard_to_cluster.json` contains 26,249 mapped standard codes |
| Canonical worksheet cluster set | Complete locally | `kg-service/data/canonical_clusters.json` contains 588 canonical clusters |
| Worksheet generation corpus | Complete locally | `kg-service/data/standard_worksheets_insert.sql` contains 1,764 inserts = 588 `identify` + 588 `practice` + 588 `extend` |
| Web cutover implementation | Complete on branch | Branch `feature/worksheets-cutover-launch`, commit `873435a` |
| Production rollout | Still operationally pending | Last Railway check on April 13, 2026 still showed the older worksheet corpus and no `StandardWorksheetAccess` table yet |

## What Stage The Work Is In

The worksheet work is not in an early research stage anymore. It is in launch-prep / cutover stage.

1. Standards extraction and clustering are done.
2. Canonical worksheet clusters are defined and saved.
3. Three worksheet variants per canonical cluster have been generated for the local launch corpus.
4. The web app has already been cut over to the standard worksheet model locally.
5. The remaining work is production rollout, verification, and feature-flag enablement.

This matters because future work should not restart the clustering pipeline from scratch unless the goal is to improve the corpus itself. The product path is already built.

## Coverage Shape

### By Subject

| Subject | Canonical clusters | Coherence profile | Read |
| --- | --- | --- | --- |
| Math | 180 | 155 score-5, 25 score-4 | Launch-ready |
| Science | 180 | 149 score-5, 31 score-4 | Launch-ready |
| Language Arts | 179 | 179 score-5 | Strongest area |
| Social Studies | 49 | 5 score-5, 20 score-4, 24 score-3 | Weak area |

### By Grade Pattern

- Math has 20 canonical clusters at every grade K-8.
- Science has 20 canonical clusters at every grade K-8.
- Language Arts has 20 canonical clusters at every grade except grade 8, which has 19.
- Social Studies is sparse and uneven: K=4, 1=9, 2=6, 3=6, 4=4, 5=7, 6=2, 7=9, 8=2.

The total count is therefore not the whole story. Math, Science, and Language Arts are reasonably dense. Social Studies is both thinner and noisier, which is why it is the first quality risk to address after launch.

## How The Embeddings Relate To Worksheets

The embedding files are part of the offline clustering pipeline, not the runtime worksheet experience.

The path looks like this:

1. `standards_{slug}.json` stores the normalized standards for one `(grade, subject)` cell.
2. `embeddings_{slug}.npy` stores vector embeddings for those standard descriptions.
3. `named_clusters_{slug}.json` stores clustering output derived from those embeddings.
4. `canonical_clusters.json` is the curated export used to generate the worksheet library.
5. `standard_worksheets_insert.sql` is the generated worksheet corpus that gets imported into the web app database.

At runtime, the web app does not use those embedding files. The runtime path is:

1. lesson standards
2. standard code -> canonical cluster key mapping
3. `StandardWorksheet` lookup in the web database
4. PDF render / access tracking

So the embeddings matter for tuning, repairing, or re-running the cluster pipeline. They do not matter for serving worksheet PDFs to users.

## Concrete Examples

These examples show how many different standards still converge onto a small reusable worksheet library.

| Subject | Standard code(s) | Canonical cluster | Result |
| --- | --- | --- | --- |
| Science | `5-PS2-1` | `grade5-science-forces-gravity` | 3 worksheet variants |
| Language Arts | `CCSS.ELA-Literacy.W.8.1` | `grade8-language-arts-argumentative-writing-claims-evidence-and-counterclaims` | 3 worksheet variants |
| Social Studies | `SS.7.CG`, `7.e`, `7-2` | `grade7-social-studies-civics-and-economics-civic-participation-and-economic-systems` | 3 worksheet variants |

This is why `1,764` total worksheets can still be enough for launch even though lesson requests can cover a wide range of topics. The standards layer keeps collapsing many requests onto the same canonical worksheet set.

## Product Assessment

### What The Current Corpus Is Good Enough For

- A premium worksheet add-on attached to generated lessons
- Reinforcement, review, and independent practice after a lesson
- A controlled, QA-able worksheet experience that stays aligned to standards and the product's educational model

### What It Is Not Good Enough For Yet

- A full printable K-8 curriculum marketed as a standalone worksheet library
- A browse-first worksheet marketplace that needs to feel massive
- Heavy repeat usage without users noticing the fixed three-variant ceiling per cluster

## Competitive Read

On raw library breadth, large worksheet libraries like Education.com or Twinkl will feel much larger. On dense practice coverage and skill progression, products like IXL are stronger. On freshness and prompt-to-output flexibility, AI-native tools like Diffit or MagicSchool can feel more expansive.

The advantage here is different:

- canonical worksheets that can actually be reviewed and quality-controlled
- tight lesson-to-worksheet retrieval instead of generic search
- standards alignment grounded in the KG work
- philosophy-aware lesson generation on the surrounding product surface

That is a real product advantage, but only if worksheets are framed as a premium lesson companion rather than as an infinite worksheet universe.

## Recommendation

Ship the feature after the production data cutover and feature-flag rollout, but keep the claims tight.

Recommended positioning:

- premium printable practice tied to lesson plans
- standards-aligned reinforcement
- a high-quality worksheet layer for the most common K-8 concepts

Positioning to avoid for now:

- complete printable K-8 curriculum
- huge worksheet library
- unlimited worksheet variety

## Next Steps

### Production Rollout

1. Merge and deploy `feature/worksheets-cutover-launch`.
2. Run the Prisma migration that adds `StandardWorksheetAccess`.
3. Do a one-time replace/import of remote `StandardWorksheet` using `kg-service/data/standard_worksheets_insert.sql`.
4. Verify remote counts: 1,764 total rows, 588 distinct cluster keys, and 588 rows for each worksheet type.
5. Flip the worksheet feature flag after the data checks pass.

### First Improvements After Launch

1. Re-cluster and clean up Social Studies first.
2. Add more than three worksheet variants per cluster, or add a controlled remix/regenerate path.
3. Track which clusters are opened most often so expansion work follows actual demand.
4. Review repeat-use risk for families with multiple children or heavy worksheet usage.

### Working Rule For Future Agents

Do not restart the worksheet project from the top. The system is already in cutover stage. Only go back into the embedding and clustering pipeline if the goal is to improve coverage or cluster quality, especially in Social Studies.
