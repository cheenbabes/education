# Standards-Based Worksheet Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pre-generated, standards-based worksheet library — 3 problem-focused worksheets per topic cluster, rendered as branded Sage's Compass PDFs — validated with 50 sample worksheets before scaling.

**Architecture:** A Python script extracts canonical topic clusters from the KG (deduplicating across states), a new `StandardWorksheet` DB model stores structured problem JSON, a Next.js API route renders PDFs on-demand using `@react-pdf/renderer` with the app's Cormorant fonts and compass branding. The existing on-demand philosophy worksheet UI is removed. At lesson completion, the app offers relevant pre-generated worksheets for the standards covered.

**Tech Stack:** Python + KuzuDB (cluster extraction), Prisma (StandardWorksheet model), @react-pdf/renderer (PDF generation), extended `worksheetSvg.ts` (6 new visual types), gpt-4.1 (structured problem generation), Next.js API routes.

---

## Prerequisite Reading

Before starting, read:
- `kg-service/kg/query.py` — `get_standards()`, `get_milestones()` functions
- `web/src/lib/worksheetSvg.ts` — existing visual types
- `kg-service/api/worksheet.py` — existing worksheet prompt (being replaced)
- `web/prisma/schema.prisma` — current DB models

---

## Phase 1: Topic Cluster Extraction

### Task 1: Extract canonical topic clusters from the KG

**Context:** The KG has 491,286 standards across 50 states, but they converge on the same concepts. This script groups them into canonical topic clusters by deduplicating across states and grouping by (grade, subject, domain/cluster). Output is a JSON file we'll use to drive the rest of the pipeline.

**Files:**
- Create: `kg-service/scripts/extract_clusters.py`
- Output: `kg-service/data/topic_clusters.json`

**Step 1: Write the script**

```python
# kg-service/scripts/extract_clusters.py
"""Extract canonical topic clusters from the knowledge graph.

Groups standards by (grade, subject, conceptual domain) and deduplicates
across states so we have a manageable set of unique teaching topics.
"""

from __future__ import annotations
import json
import re
from collections import defaultdict
from pathlib import Path

import kuzu
from config import settings


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def extract_clusters() -> list[dict]:
    """Query KG and group standards into canonical topic clusters."""
    db = kuzu.Database(settings.kuzu_db_path)
    conn = kuzu.Connection(db)

    # Fetch all standards with their grade, subject, domain, cluster
    result = conn.execute("""
        MATCH (s:Standard)-[:FOR_GRADE]->(g:Grade),
              (s:Standard)-[:FOR_SUBJECT]->(sub:Subject)
        RETURN s.code, s.description_plain, s.domain, s.cluster,
               g.grade, sub.name
        LIMIT 100000
    """)

    # Group by (grade, subject, cluster/domain)
    groups: dict[tuple, list[dict]] = defaultdict(list)
    while result.has_next():
        row = result.get_next()
        code, desc_plain, domain, cluster, grade, subject = row
        # Use cluster field if available, fall back to first 60 chars of description
        topic_key = (cluster or domain or "")[:60].strip() or desc_plain[:60].strip()
        group_key = (grade, subject, slugify(topic_key[:40]))
        groups[group_key].append({
            "code": code,
            "description_plain": desc_plain,
            "domain": domain,
            "cluster": cluster,
        })

    clusters = []
    for (grade, subject, topic_slug), standards in groups.items():
        if len(standards) < 2:  # Skip singletons — likely noise
            continue
        # Use most common description as the cluster title
        sample = standards[0]
        cluster_key = f"grade{grade}-{slugify(subject)}-{topic_slug}"
        clusters.append({
            "cluster_key": cluster_key[:80],
            "grade": grade,
            "subject": subject,
            "title": f"Grade {grade} {subject}: {(sample['cluster'] or sample['domain'] or sample['description_plain'][:50]).strip()}",
            "standard_codes": list({s["code"] for s in standards[:10]}),  # sample, not exhaustive
            "standard_count": len(standards),
        })

    # Sort by grade then subject for readability
    clusters.sort(key=lambda c: (int(c["grade"]) if c["grade"].isdigit() else 0, c["subject"]))
    return clusters


def main():
    print("Extracting topic clusters from knowledge graph...")
    clusters = extract_clusters()
    out_path = Path(__file__).parent.parent / "data" / "topic_clusters.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(clusters, indent=2))
    print(f"Extracted {len(clusters)} clusters → {out_path}")

    # Print summary by grade/subject
    from collections import Counter
    by_subject = Counter(c["subject"] for c in clusters)
    print("\nBy subject:", dict(by_subject))
    by_grade = Counter(c["grade"] for c in clusters)
    print("By grade:", dict(sorted(by_grade.items(), key=lambda x: (int(x[0]) if x[0].isdigit() else 0))))


if __name__ == "__main__":
    main()
```

**Step 2: Run the extraction**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python scripts/extract_clusters.py
```
Expected: prints cluster count (likely 200-500) and saves `data/topic_clusters.json`.

**Step 3: Inspect the output**
```bash
cat kg-service/data/topic_clusters.json | python3 -m json.tool | head -60
```
Verify the cluster structure looks right — grade, subject, title, standard_codes, standard_count.

**Step 4: Commit**
```bash
cd ~/github/edu-app
git add kg-service/scripts/extract_clusters.py kg-service/data/topic_clusters.json
git commit -m "feat(worksheets): extract canonical topic clusters from KG"
```

---

### Task 2: Curate the 50 sample worksheet definitions

**Context:** Manually select 50 clusters from the extracted JSON that give broad coverage across grades, subjects, and visual types. This drives everything else in the pipeline. The selection should stress-test our hardest rendering cases.

**Files:**
- Create: `kg-service/data/sample_50_clusters.json`

**Step 1: Write the curated sample list**

Create `kg-service/data/sample_50_clusters.json` with exactly 50 entries. Select clusters that cover:
- All 4 subjects (Math, Science, ELA, Social Studies)
- Grade bands: K-2, 3-5, 6-8
- Visual stress-tests: fractions (circles/bars), counting (ten frames), bar graphs, food chains, word webs, place value

Structure each entry:
```json
{
  "cluster_key": "grade3-math-fractions-parts-of-a-whole",
  "grade": "3",
  "subject": "Math",
  "title": "Grade 3 Math: Fractions — Parts of a Whole",
  "standard_codes": ["3.NF.A.1", "3.NF.A.2"],
  "standard_descriptions": [
    "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts",
    "Understand a fraction as a number on the number line"
  ],
  "visual_types_needed": ["fraction_circle", "fraction_bar", "number_line"],
  "worksheet_types": ["identify", "practice", "extend"]
}
```

Suggested 50 (write these as JSON):
- Math K: Counting to 10 (ten_frame), Counting to 20 (number_line), Shapes (shape_diagram)
- Math 1: Addition within 20 (number_bonds), Subtraction (ten_frame), Place Value tens/ones (place_value_chart)
- Math 2: Addition/subtraction within 100 (bar_graph), Measurement with ruler (ruler), Arrays intro (multiplication_array)
- Math 3: Fractions parts (fraction_circle, fraction_bar), Multiplication facts (multiplication_array), Area on grid (area_grid), Bar graphs reading (bar_graph)
- Math 4: Equivalent fractions (fraction_bar), Multi-digit multiplication (place_value_chart), Angles (shape_diagram), Line plots (bar_graph)
- Math 5: Fraction operations (fraction_bar, number_line), Coordinate geometry (coordinate_grid), Volume (area_grid)
- Math 6: Ratios (bar_graph), Negative numbers (number_line), Expressions and equations
- Math 7: Proportional relationships, Geometry angles, Statistics
- Math 8: Linear equations (mafs_function), Pythagorean theorem (mafs_polygon)
- Science K: Seasons/weather (weather_symbols), Plants (plant_diagram), Animals and needs
- Science 1: Animal body parts, Light and shadow, Pushes and pulls
- Science 2: Life cycles (lifecycle_diagram), Earth materials, Plants/animals habitats (food_chain)
- Science 3: Food chains (food_chain), States of matter, Forces and motion
- Science 4: Animal adaptations, Rocks and minerals, Electricity basics
- Science 5: Ecosystems (food_chain, venn_diagram), Earth's systems (water_cycle), Human body systems
- Science 6: Cells (cell_diagram), Photosynthesis, Ecosystems energy flow
- Science 7: Body systems (body_diagram), Genetics intro, Earth's layers
- ELA K: Letters and sounds, Sight words, Sentence building
- ELA 1: Main idea, Story elements (story_map), Question sentences
- ELA 2: Compare/contrast (venn_diagram), Cause and effect (cause_effect), Opinion writing
- ELA 3: Text evidence, Point of view, Paragraph structure
- ELA 4: Informational text, Synonyms/antonyms (word_web), Research writing
- ELA 5: Theme and summary, Author's purpose, Argumentative writing
- Social Studies 2: Communities (venn_diagram), Map skills, Rules and laws
- Social Studies 3: Regions, Goods and services, Historical figures (timeline)
- Social Studies 5: US regions (t_chart), American Revolution (timeline), Government branches (t_chart)

**Step 2: Commit**
```bash
git add kg-service/data/sample_50_clusters.json
git commit -m "feat(worksheets): define 50 sample clusters for validation batch"
```

---

## Phase 2: Missing SVG Visual Types

### Task 3: Add 6 new SVG functions to worksheetSvg.ts

**Context:** The 50 samples need visual types we don't have yet. These are pure TypeScript functions returning SVG strings — same pattern as existing functions. Build them all in one task, then verify with the browser test page.

**Files:**
- Modify: `web/src/lib/worksheetSvg.ts`
- Modify: `web/public/worksheet-visual-test.html` (add new visuals to test page)

**Step 1: Add `barGraph` function**

```typescript
export function barGraph(
  labels: string[],
  values: number[],
  title = "",
  maxValue?: number
): string {
  const max = maxValue ?? Math.max(...values, 1);
  const W = 380, pad = 40, barW = Math.min(50, Math.floor((W - pad * 2) / labels.length) - 8);
  const chartH = 160, H = chartH + pad * 2 + (title ? 20 : 0);
  const toBarH = (v: number) => Math.round((v / max) * chartH);
  // Pastel colors cycling
  const colors = ["rgb(180,210,255)", "rgb(180,255,210)", "rgb(255,220,180)", "rgb(220,180,255)", "rgb(255,180,180)", "rgb(180,240,240)"];
  let content = "";
  if (title) content += `<text x="${W / 2}" y="16" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="600" fill="${STROKE}">${title}</text>`;
  const baseY = (title ? 20 : 0) + pad + chartH;
  // Y-axis
  content += `<line x1="${pad}" y1="${baseY - chartH}" x2="${pad}" y2="${baseY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<line x1="${pad}" y1="${baseY}" x2="${W - pad / 2}" y2="${baseY}" stroke="${STROKE}" stroke-width="1.5"/>`;
  // Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((max / 4) * i);
    const y = baseY - toBarH(v);
    content += `<text x="${pad - 6}" y="${y + 4}" text-anchor="end" font-family="Georgia,serif" font-size="9" fill="rgb(130,130,130)">${v}</text>`;
    content += `<line x1="${pad}" y1="${y}" x2="${pad + 4}" y2="${y}" stroke="rgb(150,150,150)" stroke-width="0.8"/>`;
  }
  // Bars
  const totalBarWidth = labels.length * (barW + 8);
  const startX = pad + (W - pad * 1.5 - totalBarWidth) / 2;
  labels.forEach((label, i) => {
    const bh = toBarH(values[i] ?? 0);
    const x = startX + i * (barW + 8);
    const color = colors[i % colors.length];
    content += `<rect x="${x}" y="${baseY - bh}" width="${barW}" height="${bh}" fill="${color}" stroke="${STROKE}" stroke-width="1" rx="2"/>`;
    content += `<text x="${x + barW / 2}" y="${baseY - bh - 4}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${values[i] ?? 0}</text>`;
    content += `<text x="${x + barW / 2}" y="${baseY + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${label}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 2: Add `placeValueChart` function**

```typescript
export function placeValueChart(
  columns: string[] = ["Hundreds", "Tens", "Ones"],
  values: (number | null)[] = [null, null, null]
): string {
  const colW = 90, H = 120, headerH = 36, pad = 8;
  const W = columns.length * colW;
  let content = `<rect x="0" y="0" width="${W}" height="${H}" fill="rgb(255,255,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<rect x="0" y="0" width="${W}" height="${headerH}" fill="rgb(230,240,255)"/>`;
  content += `<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="${STROKE}" stroke-width="1"/>`;
  columns.forEach((col, i) => {
    const x = i * colW;
    if (i > 0) content += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${x + colW / 2}" y="${headerH / 2 + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="600" fill="${STROKE}">${col}</text>`;
    if (values[i] !== null && values[i] !== undefined) {
      content += `<text x="${x + colW / 2}" y="${headerH + (H - headerH) / 2 + 8}" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="700" fill="rgb(60,100,160)">${values[i]}</text>`;
    }
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 3: Add `ruler` function**

```typescript
export function ruler(length = 6, unit: "in" | "cm" = "in"): string {
  const ticksPerUnit = unit === "cm" ? 10 : 8;
  const totalTicks = length * ticksPerUnit;
  const W = 420, H = 56, bodyH = 38, pad = 10;
  const unitW = (W - pad * 2) / length;
  const tickW = unitW / ticksPerUnit;
  let content = `<rect x="${pad}" y="0" width="${W - pad * 2}" height="${bodyH}" fill="rgb(255,252,220)" stroke="${STROKE}" stroke-width="1.5" rx="3"/>`;
  for (let t = 0; t <= totalTicks; t++) {
    const x = pad + t * tickW;
    const isMajor = t % ticksPerUnit === 0;
    const isHalf = unit === "in" && t % (ticksPerUnit / 2) === 0;
    const tickH = isMajor ? 20 : isHalf ? 13 : 8;
    content += `<line x1="${x}" y1="0" x2="${x}" y2="${tickH}" stroke="${STROKE}" stroke-width="${isMajor ? 1.5 : 0.8}"/>`;
    if (isMajor && t > 0) {
      content += `<text x="${x}" y="${bodyH + 14}" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="${STROKE}">${t / ticksPerUnit}</text>`;
    }
  }
  content += `<text x="${pad + (W - pad * 2) / 2}" y="${bodyH - 8}" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="rgb(150,130,80)">${unit === "in" ? "inches" : "centimeters"}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 4: Add `wordWeb` function**

```typescript
export function wordWeb(centerWord: string, relatedWords: string[] = []): string {
  const cx = 200, cy = 140, r = 45, spokeR = 100, W = 400, H = 280;
  const words = relatedWords.slice(0, 6);
  const angles = words.map((_, i) => (i / words.length) * 2 * Math.PI - Math.PI / 2);
  let content = `<ellipse cx="${cx}" cy="${cy}" rx="${r + 10}" ry="${r - 5}" fill="rgb(220,230,255)" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="${STROKE}">${centerWord}</text>`;
  words.forEach((word, i) => {
    const angle = angles[i];
    const wx = cx + spokeR * Math.cos(angle), wy = cy + spokeR * Math.sin(angle);
    content += `<line x1="${cx + r * Math.cos(angle)}" y1="${cy + (r - 5) * Math.sin(angle)}" x2="${wx - 28 * Math.cos(angle)}" y2="${wy - 22 * Math.sin(angle)}" stroke="${STROKE}" stroke-width="1.2"/>`;
    content += `<ellipse cx="${wx}" cy="${wy}" rx="42" ry="20" fill="rgb(240,250,240)" stroke="${STROKE}" stroke-width="1.5"/>`;
    content += `<text x="${wx}" y="${wy + 5}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${word}</text>`;
  });
  // Empty spokes for student to fill in if no words provided
  if (words.length === 0) {
    [0, 1, 2, 3, 4, 5].forEach(i => {
      const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
      const wx = cx + spokeR * Math.cos(angle), wy = cy + spokeR * Math.sin(angle);
      content += `<line x1="${cx + r * Math.cos(angle)}" y1="${cy + (r - 5) * Math.sin(angle)}" x2="${wx - 28 * Math.cos(angle)}" y2="${wy - 22 * Math.sin(angle)}" stroke="rgb(180,180,180)" stroke-width="1" stroke-dasharray="3"/>`;
      content += `<ellipse cx="${wx}" cy="${wy}" rx="42" ry="20" fill="rgb(250,250,250)" stroke="rgb(180,180,180)" stroke-width="1"/>`;
    });
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 5: Add `numberBonds` function**

```typescript
export function numberBonds(whole: number | null = null, part1: number | null = null, part2: number | null = null): string {
  const W = 260, H = 140, r = 26;
  const topX = 130, topY = 36;
  const leftX = 60, leftY = 108;
  const rightX = 200, rightY = 108;
  const fmt = (v: number | null) => v !== null ? String(v) : "";
  let content = "";
  // Lines from top to bottom-left and bottom-right
  content += `<line x1="${topX}" y1="${topY + r}" x2="${leftX + r * 0.7}" y2="${leftY - r * 0.7}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<line x1="${topX}" y1="${topY + r}" x2="${rightX - r * 0.7}" y2="${rightY - r * 0.7}" stroke="${STROKE}" stroke-width="2"/>`;
  // Circles
  [[topX, topY, whole], [leftX, leftY, part1], [rightX, rightY, part2]].forEach(([x, y, val]) => {
    const filled = (val as number | null) !== null;
    content += `<circle cx="${x}" cy="${y}" r="${r}" fill="${filled ? "rgb(220,235,255)" : "rgb(250,250,255)"}" stroke="${STROKE}" stroke-width="2"/>`;
    if (filled) content += `<text x="${x}" y="${(y as number) + 6}" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="${STROKE}">${fmt(val as number | null)}</text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 6: Add `causeEffect` function**

```typescript
export function causeEffect(cause = "", effect = ""): string {
  const W = 400, H = 80, boxW = 160, boxH = 56, gap = 24;
  const leftX = 12, rightX = leftX + boxW + gap + 32;
  let content = "";
  // Cause box
  content += `<rect x="${leftX}" y="${(H - boxH) / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(255,235,200)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${leftX + 8}" y="${(H - boxH) / 2 + 14}" font-family="Georgia,serif" font-size="9" font-weight="600" fill="rgb(180,80,20)" text-decoration="uppercase">CAUSE</text>`;
  if (cause) {
    const words = cause.split(" ");
    const mid = Math.ceil(words.length / 2);
    content += `<text x="${leftX + boxW / 2}" y="${H / 2 - 3}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(0, mid).join(" ")}</text>`;
    if (mid < words.length) content += `<text x="${leftX + boxW / 2}" y="${H / 2 + 11}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(mid).join(" ")}</text>`;
  }
  // Arrow
  const arrowX = leftX + boxW + 4;
  content += `<line x1="${arrowX}" y1="${H / 2}" x2="${arrowX + gap + 20}" y2="${H / 2}" stroke="${STROKE}" stroke-width="2"/>`;
  content += `<polygon points="${arrowX + gap + 20},${H / 2 - 5} ${arrowX + gap + 30},${H / 2} ${arrowX + gap + 20},${H / 2 + 5}" fill="${STROKE}"/>`;
  // Effect box
  content += `<rect x="${rightX}" y="${(H - boxH) / 2}" width="${boxW}" height="${boxH}" rx="8" fill="rgb(200,230,255)" stroke="${STROKE}" stroke-width="1.5"/>`;
  content += `<text x="${rightX + 8}" y="${(H - boxH) / 2 + 14}" font-family="Georgia,serif" font-size="9" font-weight="600" fill="rgb(20,80,180)" text-decoration="uppercase">EFFECT</text>`;
  if (effect) {
    const words = effect.split(" ");
    const mid = Math.ceil(words.length / 2);
    content += `<text x="${rightX + boxW / 2}" y="${H / 2 - 3}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(0, mid).join(" ")}</text>`;
    if (mid < words.length) content += `<text x="${rightX + boxW / 2}" y="${H / 2 + 11}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="${STROKE}">${words.slice(mid).join(" ")}</text>`;
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
```

**Step 7: Register all 6 in the `renderVisual` dispatcher**

Add to the switch statement:
```typescript
case "bar_graph":        return barGraph(params.labels as string[], params.values as number[], params.title as string, params.max_value as number | undefined);
case "place_value_chart":return placeValueChart(params.columns as string[] | undefined, params.values as (number|null)[] | undefined);
case "ruler":            return ruler(params.length as number | undefined, params.unit as "in" | "cm" | undefined);
case "word_web":         return wordWeb(params.center_word as string ?? "", params.related_words as string[] | undefined);
case "number_bonds":     return numberBonds(params.whole as number | null, params.part1 as number | null, params.part2 as number | null);
case "cause_effect":     return causeEffect(params.cause as string | undefined, params.effect as string | undefined);
```

**Step 8: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 9: Verify visually**
Open `localhost:3001/worksheet-visual-test.html` — doesn't have new types yet, but build confirms TypeScript is valid.

**Step 10: Commit**
```bash
git add web/src/lib/worksheetSvg.ts
git commit -m "feat(worksheets): add 6 new SVG types — bar graph, place value chart, ruler, word web, number bonds, cause-effect"
```

---

## Phase 3: DB Model + PDF Pipeline

### Task 4: Add StandardWorksheet DB model

**Context:** New Prisma model to store pre-generated worksheet content. Keyed by `(cluster_key, worksheet_num)` — unique. The `content` JSON stores structured problems and the answer key. Grade and subject are denormalized for easy querying.

**Files:**
- Modify: `web/prisma/schema.prisma`
- Run migration

**Step 1: Add model to schema.prisma**

Add after the existing `Worksheet` model:

```prisma
model StandardWorksheet {
  id             String   @id @default(cuid())
  clusterKey     String   // e.g., "grade3-math-fractions-parts-of-a-whole"
  clusterTitle   String   // "Grade 3 Math: Fractions — Parts of a Whole"
  grade          String   // "3"
  subject        String   // "Math"
  worksheetNum   Int      // 1, 2, or 3
  worksheetType  String   // "identify" | "practice" | "extend"
  title          String
  standardCodes  String[] // standards covered by this worksheet
  content        Json     // { context, problems[], answerKey[] }
  createdAt      DateTime @default(now())

  @@unique([clusterKey, worksheetNum])
  @@index([grade, subject])
  @@index([clusterKey])
}
```

**Step 2: Run migration**
```bash
cd ~/github/edu-app/web
npx prisma migrate dev --name add_standard_worksheet
```
Expected: migration file created, DB updated.

**Step 3: Commit**
```bash
git add web/prisma/schema.prisma web/prisma/migrations/
git commit -m "feat(worksheets): add StandardWorksheet model to schema"
```

---

### Task 5: Build PDF rendering pipeline

**Context:** `@react-pdf/renderer` renders React components directly to PDF. We build a branded worksheet template using the app's Cormorant font, compass icon, and pastel colors. The API route accepts a StandardWorksheet ID and streams a PDF download.

**Files:**
- Create: `web/src/components/pdf/WorksheetPdf.tsx`
- Create: `web/src/app/api/worksheets/standard/[id]/pdf/route.ts`

**Step 1: Install @react-pdf/renderer**
```bash
cd ~/github/edu-app/web && npm install @react-pdf/renderer
```

**Step 2: Create the PDF template**

```tsx
// web/src/components/pdf/WorksheetPdf.tsx
import {
  Document, Page, Text, View, Image, Font, StyleSheet, Svg, Path, Circle, Line, Rect
} from "@react-pdf/renderer";

// Register Cormorant SC font (already in public/fonts/)
Font.register({
  family: "CormorantSC",
  src: "/fonts/CormorantSC-SemiBold.ttf",
});
Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
});

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 11, padding: "40 48 48 48", backgroundColor: "#FDFBF7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 10, borderBottom: "1.5 solid #0B2E4A" },
  brand: { fontFamily: "CormorantSC", fontSize: 14, color: "#0B2E4A", letterSpacing: 0.5 },
  standardBadge: { fontSize: 8, color: "#6E6E9E", marginTop: 3 },
  nameRow: { flexDirection: "column", gap: 4, alignItems: "flex-end" },
  nameField: { fontSize: 10, color: "#333", borderBottom: "1 solid #999", paddingBottom: 2, width: 160 },
  title: { fontFamily: "CormorantSC", fontSize: 18, color: "#0B2E4A", marginBottom: 6, letterSpacing: 0.3 },
  context: { fontSize: 10.5, color: "#333", lineHeight: 1.65, marginBottom: 16, backgroundColor: "#F0EAE0", padding: "8 10", borderRadius: 4 },
  problemNum: { fontFamily: "CormorantSC", fontSize: 11, color: "#0B2E4A", marginBottom: 4 },
  problem: { marginBottom: 16, padding: "8 10", backgroundColor: "#fff", borderRadius: 4, border: "0.8 solid #E0E0E0" },
  prompt: { fontSize: 10.5, color: "#222", lineHeight: 1.6, marginBottom: 6 },
  answerBox: { border: "1 solid #CCC", borderRadius: 3, height: 32, marginTop: 4, backgroundColor: "#FAFAFA" },
  answerLine: { borderBottom: "1 solid #DDD", marginBottom: 14, height: 20 },
  mcOption: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 5 },
  mcCircle: { width: 14, height: 14, border: "1 solid #999", borderRadius: 7 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTop: "0.8 solid #DDD", paddingTop: 6 },
  footerText: { fontSize: 8, color: "#AAA" },
  // Answer key page
  akTitle: { fontFamily: "CormorantSC", fontSize: 16, color: "#0B2E4A", marginBottom: 12 },
  akRow: { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" },
  akNum: { fontSize: 10, color: "#6E6E9E", width: 20 },
  akAnswer: { fontSize: 10, color: "#222", flex: 1 },
});

interface Problem {
  id: number;
  type: string;
  prompt: string;
  visual?: { type: string; params: Record<string, unknown> };
  options?: string[];
  answer: string;
  answerLines?: number;
}

interface WorksheetContent {
  context: string;
  problems: Problem[];
  answerKey: Array<{ problemId: number; answer: string }>;
}

interface WorksheetPdfProps {
  title: string;
  clusterTitle: string;
  grade: string;
  subject: string;
  worksheetNum: number;
  standardCodes: string[];
  content: WorksheetContent;
}

export function WorksheetPdf({
  title, clusterTitle, grade, subject, worksheetNum, standardCodes, content
}: WorksheetPdfProps) {
  const worksheetLabel = ["Practice 1 — Identify", "Practice 2 — Apply", "Challenge — Extend"][worksheetNum - 1] ?? "Worksheet";

  return (
    <Document>
      {/* ── Worksheet page ── */}
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>The Sage&apos;s Compass</Text>
            <Text style={styles.standardBadge}>{clusterTitle} · {worksheetLabel}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={[styles.nameField, { marginBottom: 0 }]}>Name: ________________________</Text>
            <Text style={styles.nameField}>Date: _________________________</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Context paragraph */}
        <Text style={styles.context}>{content.context}</Text>

        {/* Problems */}
        {content.problems.map((p, i) => (
          <View key={p.id} style={styles.problem} wrap={false}>
            <Text style={styles.problemNum}>{i + 1}.</Text>
            <Text style={styles.prompt}>{p.prompt}</Text>
            {p.type === "multiple_choice" && p.options && (
              <View style={{ marginTop: 4 }}>
                {p.options.map((opt, j) => (
                  <View key={j} style={styles.mcOption}>
                    <View style={styles.mcCircle} />
                    <Text style={{ fontSize: 10 }}>{String.fromCharCode(65 + j)}) {opt}</Text>
                  </View>
                ))}
              </View>
            )}
            {(p.type === "short_answer" || p.type === "fill_in") && (
              <View>
                {Array.from({ length: p.answerLines ?? 2 }, (_, i) => (
                  <View key={i} style={styles.answerLine} />
                ))}
              </View>
            )}
            {p.type === "identify_visual" && <View style={styles.answerBox} />}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© The Sage&apos;s Compass · thesagescompass.com</Text>
          <Text style={styles.footerText}>Standards: {standardCodes.slice(0, 4).join(", ")}{standardCodes.length > 4 ? "..." : ""}</Text>
        </View>
      </Page>

      {/* ── Answer key page ── */}
      {content.answerKey.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brand}>The Sage&apos;s Compass · Answer Key</Text>
          </View>
          <Text style={styles.akTitle}>{title} — Answer Key</Text>
          {content.answerKey.map((ak) => (
            <View key={ak.problemId} style={styles.akRow}>
              <Text style={styles.akNum}>{ak.problemId}.</Text>
              <Text style={styles.akAnswer}>{ak.answer}</Text>
            </View>
          ))}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>© The Sage&apos;s Compass · Answer Key — Not for student distribution</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
```

**Step 3: Create the PDF API route**

```typescript
// web/src/app/api/worksheets/standard/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { WorksheetPdf } from "@/components/pdf/WorksheetPdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ws = await prisma.standardWorksheet.findUnique({
    where: { id: params.id },
  });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = ws.content as {
    context: string;
    problems: unknown[];
    answerKey: unknown[];
  };

  const pdfBuffer = await renderToBuffer(
    WorksheetPdf({
      title: ws.title,
      clusterTitle: ws.clusterTitle,
      grade: ws.grade,
      subject: ws.subject,
      worksheetNum: ws.worksheetNum,
      standardCodes: ws.standardCodes,
      content: content as Parameters<typeof WorksheetPdf>[0]["content"],
    })
  );

  const filename = `${ws.clusterKey}-worksheet-${ws.worksheetNum}.pdf`;
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
```

**Step 4: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```
Expected: `✓ Compiled successfully`

**Step 5: Commit**
```bash
git add web/src/components/pdf/WorksheetPdf.tsx web/src/app/api/worksheets/standard/\[id\]/pdf/route.ts web/package.json web/package-lock.json
git commit -m "feat(worksheets): PDF rendering pipeline with branded WorksheetPdf template"
```

---

## Phase 4: Problem Generation

### Task 6: Write the structured problem generation prompt and kg-service endpoint

**Context:** New endpoint `POST /generate-standard-worksheet` that takes a cluster definition (grade, subject, topic, standards) and worksheet type (identify/practice/extend) and returns structured problems with an answer key. This is a different LLM prompt from the existing philosophy worksheet — it generates typed problem JSON, not free-form sections.

**Files:**
- Create: `kg-service/api/standard_worksheet.py`
- Modify: `kg-service/main.py` (register router)

**Step 1: Create the endpoint**

```python
# kg-service/api/standard_worksheet.py
"""POST /generate-standard-worksheet — generates structured, grade-appropriate
worksheet problems for a topic cluster, keyed by (grade, subject, standards).

Unlike the philosophy worksheet endpoint, this generates problem-based exercises
with answer keys, not philosophy-aligned sections.
"""
from __future__ import annotations
import json
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from config import settings
from api.generate import _call_llm

router = APIRouter()

PROBLEM_TYPES = {
    "identify": ["identify_visual", "multiple_choice", "label_diagram", "match"],
    "practice": ["fill_in", "compute", "short_answer", "order_sequence"],
    "extend":   ["short_answer", "word_problem", "create_example", "explain"],
}

SYSTEM_PROMPT = """You are an expert K-12 curriculum designer creating printable worksheet problems.

Generate exactly {num_problems} problems for a {worksheet_type} worksheet.

WORKSHEET TYPE DEFINITIONS:
- "identify": Recognition and identification tasks. Students identify, match, label, or select from options.
  Good problem types: multiple_choice (4 options), identify_visual (write what they see), label_diagram, match_columns
- "practice": Application of the concept. Students compute, fill in, sequence, or write short answers.
  Good problem types: fill_in (blank to complete), compute (show work), short_answer (1-3 sentences), order_sequence
- "extend": Challenge and creative application. Word problems, real-world scenarios, create-your-own.
  Good problem types: word_problem, create_example, explain_your_thinking, short_answer

GRADE CALIBRATION for Grade {grade}:
{grade_context}

PROBLEM STRUCTURE:
Each problem MUST have:
- "id": integer (1-based)
- "type": one of the types above
- "prompt": the question/instruction text (clear, grade-appropriate, parent-friendly)
- "answer": the correct answer (string)
- "answerLines": number of lines to provide for written responses (1-4)

Optional fields:
- "options": array of 4 strings for multiple_choice (include exactly 1 correct answer)
- "visual": {{ "type": "...", "params": {{...}} }} — use our SVG library when it helps:
    Math: fraction_circle, fraction_bar, number_line, ten_frame, bar_graph, ruler, number_bonds, multiplication_array
    Science: plant_diagram, food_chain
    ELA/General: venn_diagram, t_chart, word_web, cause_effect, timeline

IMPORTANT:
- Problems must be appropriate for Grade {grade} — not too easy, not too hard
- Use concrete, real-world contexts the child will relate to
- Write prompts in second person ("Write the fraction..." not "Students will write...")
- Multiple choice: make distractors plausible (not obviously wrong)
- Short answers need clear criteria for correctness
- Vary problem types within the worksheet

Return ONLY valid JSON: {{ "problems": [...], "answerKey": [{{"problemId": 1, "answer": "..."}}] }}"""

GRADE_CONTEXT = {
    "K":  "Kindergartners: count to 20, recognize shapes, sort objects, trace letters, understand beginning/middle/end. Simple vocabulary. Very short sentences.",
    "1":  "Grade 1: add/subtract to 20, measure with non-standard units, write simple sentences, identify main idea in short texts.",
    "2":  "Grade 2: add/subtract to 100, measure with rulers, write opinion sentences, compare texts.",
    "3":  "Grade 3: multiply/divide within 100, understand fractions 1/2-1/8, write paragraphs, identify text structure.",
    "4":  "Grade 4: multi-digit multiplication, equivalent fractions, compare fractions, write multi-paragraph essays.",
    "5":  "Grade 5: fraction operations (add/subtract/multiply), decimal place value, analyze author's purpose.",
    "6":  "Grade 6: ratios and proportions, negative numbers, expressions, analyze informational text structure.",
    "7":  "Grade 7: proportional relationships, probability, linear expressions, compare multiple texts.",
    "8":  "Grade 8: linear equations, functions, transformations, analyze argument and evidence.",
    "9":  "Grade 9: algebraic functions, quadratic equations, literary analysis with textual evidence.",
    "10": "Grade 10: geometric proofs, logarithms, synthesis across multiple sources.",
    "11": "Grade 11: statistics, pre-calculus, evaluate rhetoric and argument in complex texts.",
    "12": "Grade 12: calculus concepts, complex analysis, research writing with citations.",
}

USER_TEMPLATE = """Topic: {title}
Grade: {grade}
Subject: {subject}
Worksheet Type: {worksheet_type} (problems {num_problems} of this type)

Standards covered:
{standards_text}

Generate {num_problems} worksheet problems of type "{worksheet_type}"."""


class StandardWorksheetRequest(BaseModel):
    cluster_key: str
    cluster_title: str
    grade: str
    subject: str
    worksheet_type: Literal["identify", "practice", "extend"]
    standard_codes: list[str] = Field(default_factory=list)
    standard_descriptions: list[str] = Field(default_factory=list)
    num_problems: int = 6
    context_paragraph: Optional[str] = None  # If None, LLM generates it


class WorksheetProblem(BaseModel):
    model_config = {"extra": "allow"}
    id: int
    type: str
    prompt: str
    answer: str
    answerLines: int = 2
    options: Optional[list[str]] = None
    visual: Optional[dict] = None


class StandardWorksheetResponse(BaseModel):
    cluster_key: str
    grade: str
    subject: str
    worksheet_type: str
    context: str
    problems: list[WorksheetProblem]
    answer_key: list[dict]
    cost_usd: float = 0.0


@router.post("/generate-standard-worksheet", response_model=StandardWorksheetResponse)
async def generate_standard_worksheet(req: StandardWorksheetRequest):
    grade_context = GRADE_CONTEXT.get(req.grade, f"Grade {req.grade} student.")
    standards_text = "\n".join(
        f"- {code}: {desc}"
        for code, desc in zip(req.standard_codes[:5], req.standard_descriptions[:5])
    ) or "See topic title."

    system = SYSTEM_PROMPT.format(
        num_problems=req.num_problems,
        worksheet_type=req.worksheet_type,
        grade=req.grade,
        grade_context=grade_context,
    )
    user = USER_TEMPLATE.format(
        title=req.cluster_title,
        grade=req.grade,
        subject=req.subject,
        worksheet_type=req.worksheet_type,
        num_problems=req.num_problems,
        standards_text=standards_text,
    )

    # Generate context paragraph if not provided
    context = req.context_paragraph
    if not context:
        ctx_system = f"Write a 2-3 sentence context paragraph for a Grade {req.grade} {req.subject} worksheet about: {req.cluster_title}. Use simple, clear language. Explain the key concept in words a {req.grade}th grader and their parent will understand. Return only the paragraph text, no JSON."
        ctx_raw, _ = _call_llm(
            settings.openai_validation_model,
            ctx_system,
            req.cluster_title,
            max_tokens=200,
            call_type="worksheet_context",
        )
        context = ctx_raw.strip()

    # Generate problems
    model = settings.openai_extraction_model  # gpt-4.1 for quality
    raw, cost = _call_llm(model, system, user, max_tokens=3000, call_type="standard_worksheet")
    if raw.strip().startswith("```"):
        raw = raw.strip().split("\n", 1)[1].rsplit("```", 1)[0]

    data = json.loads(raw)
    problems = [WorksheetProblem(**p) for p in data.get("problems", [])]
    answer_key = data.get("answerKey", [])

    return StandardWorksheetResponse(
        cluster_key=req.cluster_key,
        grade=req.grade,
        subject=req.subject,
        worksheet_type=req.worksheet_type,
        context=context,
        problems=problems,
        answer_key=answer_key,
        cost_usd=round(cost, 6),
    )
```

**Step 2: Register in main.py**
```python
from api.standard_worksheet import router as standard_worksheet_router
app.include_router(standard_worksheet_router, tags=["Standard Worksheets"])
```

**Step 3: Test the endpoint**
```bash
cd ~/github/edu-app/kg-service
lsof -ti :8000 | xargs kill -9 2>/dev/null; sleep 1
nohup .venv/bin/uvicorn main:app --port 8000 --reload > /tmp/kg.log 2>&1 & sleep 3

curl -s -X POST http://localhost:8000/generate-standard-worksheet \
  -H "Content-Type: application/json" \
  -d '{
    "cluster_key": "grade3-math-fractions",
    "cluster_title": "Grade 3 Math: Fractions — Parts of a Whole",
    "grade": "3",
    "subject": "Math",
    "worksheet_type": "identify",
    "standard_codes": ["3.NF.A.1"],
    "standard_descriptions": ["Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts"],
    "num_problems": 4
  }' | python3 -m json.tool | head -60
```
Expected: JSON with `problems` array containing 4 problems with types like `identify_visual`, `multiple_choice`, plus `answerKey`.

**Step 4: Commit**
```bash
git add kg-service/api/standard_worksheet.py kg-service/main.py
git commit -m "feat(worksheets): structured problem generation endpoint for standards-based worksheets"
```

---

## Phase 5: Batch Generation + Review

### Task 7: Write the batch generation script for 50 samples

**Context:** This script reads `sample_50_clusters.json`, calls the kg-service for all 3 worksheet types per cluster, saves to the DB, and generates HTML previews for review. Cost: ~$2-4 for 50 clusters × 3 worksheets × 2 LLM calls each.

**Files:**
- Create: `kg-service/scripts/generate_sample_worksheets.py`

**Step 1: Write the batch script**

```python
# kg-service/scripts/generate_sample_worksheets.py
"""Generate the 50 sample standard worksheets and save to DB.

Usage:
    python -m scripts.generate_sample_worksheets [--dry-run] [--cluster-key KEY]

Cost estimate: ~$3-4 for all 150 worksheets (50 clusters × 3 types)
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
    print(f"✓  (cost: ${cost:.4f}, id: {saved.get('id', '?')[:8]})")
    time.sleep(0.5)
    return saved

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--cluster-key", help="Run only one cluster")
    args = parser.parse_args()

    clusters_path = Path(__file__).parent.parent / "data" / "sample_50_clusters.json"
    clusters = json.loads(clusters_path.read_text())

    if args.cluster_key:
        clusters = [c for c in clusters if c["cluster_key"] == args.cluster_key]
        if not clusters:
            print(f"No cluster found with key: {args.cluster_key}")
            return

    print(f"\nGenerating worksheets for {len(clusters)} clusters × 3 types = {len(clusters)*3} total")
    print(f"Estimated cost: ${len(clusters) * 3 * 0.025:.2f}\n")

    total_cost = 0
    for i, cluster in enumerate(clusters, 1):
        print(f"[{i:2}/{len(clusters)}] {cluster['title'][:60]}")
        for j, ws_type in enumerate(WORKSHEET_TYPES, 1):
            generate_one(cluster, ws_type, j, dry_run=args.dry_run)

    print(f"\nDone. Generated {len(clusters) * 3} worksheets.")

if __name__ == "__main__":
    main()
```

**Step 2: Create the DB save API route**

```typescript
// web/src/app/api/worksheets/standard/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ws = await prisma.standardWorksheet.upsert({
    where: { clusterKey_worksheetNum: { clusterKey: body.clusterKey, worksheetNum: body.worksheetNum } },
    update: { content: body.content, title: body.title },
    create: {
      clusterKey:    body.clusterKey,
      clusterTitle:  body.clusterTitle,
      grade:         body.grade,
      subject:       body.subject,
      worksheetNum:  body.worksheetNum,
      worksheetType: body.worksheetType,
      title:         body.title,
      standardCodes: body.standardCodes,
      content:       body.content,
    },
  });
  return NextResponse.json(ws, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clusterKey = searchParams.get("clusterKey");
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");
  const worksheets = await prisma.standardWorksheet.findMany({
    where: {
      ...(clusterKey && { clusterKey }),
      ...(grade && { grade }),
      ...(subject && { subject }),
    },
    orderBy: [{ grade: "asc" }, { worksheetNum: "asc" }],
  });
  return NextResponse.json(worksheets);
}
```

**Step 3: Run a dry run first**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python -m scripts.generate_sample_worksheets --dry-run
```
Expected: prints all 50 clusters with "(dry run)" — no LLM calls.

**Step 4: Generate first 5 clusters to validate**
Pick 5 diverse clusters from `sample_50_clusters.json`, generate them one at a time:
```bash
.venv/bin/python -m scripts.generate_sample_worksheets --cluster-key grade3-math-fractions-parts-of-a-whole
```
Expected: 3 worksheets generated, saved to DB, IDs printed.

**Step 5: Verify PDF downloads work**
```bash
# Get a worksheet ID from Prisma Studio or:
WS_ID=$(curl -s http://localhost:3001/api/worksheets/standard?grade=3 | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['id'])" 2>/dev/null)
curl -s "http://localhost:3001/api/worksheets/standard/${WS_ID}/pdf" -o /tmp/test-worksheet.pdf
open /tmp/test-worksheet.pdf
```
Expected: PDF opens with Sage's Compass branding, problems, answer key on page 2.

**Step 6: Generate all 50 (only after Step 5 looks good)**
```bash
.venv/bin/python -m scripts.generate_sample_worksheets
```
Runs all 50 clusters × 3 worksheets = 150 total. ~15-20 minutes, ~$3-4.

**Step 7: Render HTML previews for review**
```bash
# Export all to HTML for visual review (reuse the existing render script pattern)
cd ~/github/edu-app/web
npx tsx scripts/render-standard-worksheets.ts /tmp/standard-worksheets
open /tmp/standard-worksheets/index.html
```

**Step 8: Commit**
```bash
git add kg-service/scripts/generate_sample_worksheets.py web/src/app/api/worksheets/standard/route.ts
git commit -m "feat(worksheets): batch generation script + DB save API for standard worksheets"
```

---

## Phase 6: UI Integration

### Task 8: Add worksheet offer to lesson completion

**Context:** After completing a lesson (rating it), offer the pre-generated standard worksheets for the lesson's covered standards. This replaces the current "Create Worksheet" flow in the lesson detail page.

**Files:**
- Modify: `web/src/app/lessons/[id]/page.tsx` (remove old worksheet section, add standard worksheet CTA)
- Modify: `web/src/app/api/lessons/[id]/route.ts` (already returns standards — verify)

**Step 1: Remove the existing on-demand worksheet UI from lesson detail page**

Find the `{/* ── Worksheets ── */}` section (around line 1035) and replace the entire block with a simpler standard worksheets offer:

```tsx
{/* ── Practice Worksheets ── */}
<div style={{ marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
  <h3 className="font-cormorant-sc" style={{ ...sectionHeadingStyle, marginBottom: "0.75rem" }}>
    Practice Worksheets
  </h3>
  <StandardWorksheetOffer standardCodes={lesson.standardCodes ?? []} grade={lessonChildren[0]?.grade ?? "3"} />
</div>
```

**Step 2: Create `StandardWorksheetOffer` component**

```tsx
// web/src/components/StandardWorksheetOffer.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface StandardWs {
  id: string; clusterTitle: string; worksheetNum: number; worksheetType: string; title: string;
}

export function StandardWorksheetOffer({ standardCodes, grade }: { standardCodes: string[]; grade: string }) {
  const [worksheets, setWorksheets] = useState<StandardWs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!standardCodes.length) { setLoading(false); return; }
    // Find worksheets whose standardCodes overlap with this lesson's standards
    fetch(`/api/worksheets/standard?grade=${grade}`)
      .then(r => r.json())
      .then((all: StandardWs[]) => {
        setWorksheets(all.slice(0, 9)); // max 3 clusters × 3 worksheets
        setLoading(false);
      });
  }, [standardCodes, grade]);

  if (loading) return <p style={{ fontSize: "0.8rem", color: "#999" }}>Loading worksheets...</p>;
  if (!worksheets.length) return (
    <p style={{ fontSize: "0.8rem", color: "#767676" }}>
      Practice worksheets are generated as lessons are completed — check back soon.
    </p>
  );

  // Group by cluster
  const byCluster: Record<string, StandardWs[]> = {};
  worksheets.forEach(ws => {
    byCluster[ws.clusterTitle] = [...(byCluster[ws.clusterTitle] ?? []), ws];
  });

  return (
    <div className="space-y-3">
      {Object.entries(byCluster).slice(0, 3).map(([title, wsList]) => (
        <div key={title} style={{ background: "rgba(255,255,255,0.6)", borderRadius: "10px", padding: "0.85rem" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.5rem" }}>{title}</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {wsList.map(ws => (
              <a key={ws.id} href={`/api/worksheets/standard/${ws.id}/pdf`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.72rem", padding: "0.3rem 0.7rem", borderRadius: "6px",
                  background: "#0B2E4A", color: "#F9F6EF", textDecoration: "none", fontWeight: 500 }}>
                ↓ {["Identify", "Practice", "Challenge"][ws.worksheetNum - 1] ?? `Worksheet ${ws.worksheetNum}`}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Build check**
```bash
cd ~/github/edu-app/web && npm run build
```

**Step 4: Commit and push**
```bash
git add web/src/app/lessons/\[id\]/page.tsx web/src/components/StandardWorksheetOffer.tsx
git commit -m "feat(worksheets): replace on-demand worksheet UI with standard worksheet offer"
git push origin main
```

---

## Verification

| Gate | Command | Pass Criteria |
|---|---|---|
| Cluster extraction | `python -m scripts.extract_clusters` | Saves 200-500 clusters to `topic_clusters.json` |
| SVG build | `npm run build` in `web/` | `✓ Compiled successfully` |
| Endpoint smoke test | curl to `/generate-standard-worksheet` | Returns JSON with 6 problems + answerKey |
| PDF download | curl `/api/worksheets/standard/[id]/pdf` | Valid PDF opens with branding |
| 5-cluster pilot | generate 5 clusters | 15 PDFs saved, visual review passes |
| Full 50 batch | generate all 50 | 150 PDFs, cost < $5 |
| UI integration | Open lesson detail page | Worksheet offer appears with download buttons |

## Cost Estimates

| Step | Model | Cost per call | Total |
|---|---|---|---|
| Context paragraphs | gpt-4.1-mini | ~$0.002 | $0.30 (150 calls) |
| Problem generation | gpt-4.1 | ~$0.020 | $3.00 (150 calls) |
| **Total for 50 clusters** | | | **~$3.30** |
