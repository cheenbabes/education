# Compass Scoring v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship compass scoring v2 — rebalance cos/dim weight from 0.8/0.2 → 0.5/0.5 — and stamp every stored result with the scoring version so we can A/B compare v1 vs v2 distributions going forward.

**Architecture:** Single-file scoring change plus a DB column `scoringVersion String`. All existing rows are backfilled to `"v1"`; new submissions save with `"v2"`. The admin metrics page gains a version segmenter so we can watch the v2 distribution land in real time against the v1 baseline (161 submissions).

**Tech Stack:** TypeScript, Next.js (App Router), Prisma, Postgres, Jest.

**Resimulation validation (161 real users):** cos/dim 0.5/0.5 → Weaver 11.8%, Cultivator 6.2%, all archetypes ≥6%, std 4.7%, balance score 0.807 (highest of all tested configs). `web/resim-compass-v3.ts`

---

### Task 1: Add `scoringVersion` column to `CompassResult`

**Files:**
- Modify: `web/prisma/schema.prisma` — add field to `CompassResult`
- Create: `web/prisma/migrations/20260419_add_compass_scoring_version/migration.sql`

**Step 1: Update schema**

In `web/prisma/schema.prisma`, inside the `CompassResult` model, add after `quizAnswers`:

```prisma
  scoringVersion   String   @default("v1")
```

**Step 2: Create migration SQL**

Create `web/prisma/migrations/20260419_add_compass_scoring_version/migration.sql`:

```sql
ALTER TABLE "CompassResult" ADD COLUMN "scoringVersion" TEXT NOT NULL DEFAULT 'v1';
CREATE INDEX "CompassResult_scoringVersion_idx" ON "CompassResult" ("scoringVersion");
```

Also add the index to the Prisma model:

```prisma
  @@index([scoringVersion])
```

**Step 3: Generate client locally, don't migrate yet**

Run: `cd web && npx prisma generate`
Expected: `✔ Generated Prisma Client`

**Step 4: Commit**

```bash
cd ~/github/edu-app
git add web/prisma/schema.prisma web/prisma/migrations/20260419_add_compass_scoring_version
git commit -m "feat(compass): add scoringVersion column to CompassResult (defaults v1)"
```

---

### Task 2: Export a `SCORING_VERSION` constant + flip cos/dim weights to 0.5/0.5

**Files:**
- Modify: `web/src/lib/compass/scoring.ts` — add constants, change weights

**Step 1: Add constants at top of `scoring.ts`**

Just below the existing `ALL_PHILOSOPHIES` array (around line 60), add:

```ts
/** Bump when scoring logic changes. Stored on every CompassResult row. */
export const SCORING_VERSION = "v2";

/** Weight of philosophy cosine similarity vs dimension proximity in archetype scoring. */
export const COSINE_WEIGHT = 0.5;
export const DIMENSION_WEIGHT = 0.5;
```

**Step 2: Replace the hard-coded weights in `determineArchetype`**

In `scoring.ts` around line 270, change:

```ts
let finalScore = cosineSim * 0.8 + dimSim * 0.2;
```

to:

```ts
let finalScore = cosineSim * COSINE_WEIGHT + dimSim * DIMENSION_WEIGHT;
```

**Step 3: Commit**

```bash
git add web/src/lib/compass/scoring.ts
git commit -m "feat(compass): v2 scoring — rebalance cos/dim weights 0.8/0.2 → 0.5/0.5"
```

---

### Task 3: Regression-lock v1 + v2 behavior in unit tests

**Files:**
- Modify: `web/src/lib/compass/__tests__/archetypes.test.ts` — add v2-specific assertions

**Step 1: Append this test block to the end of `archetypes.test.ts`**

```ts
import { SCORING_VERSION, COSINE_WEIGHT, DIMENSION_WEIGHT } from "../scoring";

describe("scoring v2 calibration", () => {
  it("exports v2 as the current scoring version", () => {
    expect(SCORING_VERSION).toBe("v2");
  });

  it("weights cosine and dimension equally (0.5/0.5)", () => {
    expect(COSINE_WEIGHT).toBeCloseTo(0.5, 5);
    expect(DIMENSION_WEIGHT).toBeCloseTo(0.5, 5);
    expect(COSINE_WEIGHT + DIMENSION_WEIGHT).toBeCloseTo(1.0, 5);
  });
});
```

**Step 2: Run the tests**

Run: `cd web && npm test -- src/lib/compass/__tests__/archetypes.test.ts`
Expected: all existing archetype-reachability tests still pass; new v2 tests pass.

**Step 3: If the existing `findBestChoice`-driven reachability tests now fail** (they may, because Cultivator/Free-Spirit paths pick different answers under 0.5/0.5), fix the seed preferences inside `archetypes.test.ts` rather than reverting scoring. Each archetype's `targetPhilosophies` may need one more entry to survive the new weighting. Do NOT weaken the assertion "every archetype is reachable."

**Step 4: Commit**

```bash
git add web/src/lib/compass/__tests__/archetypes.test.ts
git commit -m "test(compass): lock v2 weights + retune reachability seeds"
```

---

### Task 4: Stamp every new submission with `SCORING_VERSION`

**Files:**
- Modify: `web/src/app/api/compass/submit/route.ts`

**Step 1: Import the version constant**

Add near the top of `route.ts`:

```ts
import { SCORING_VERSION } from "@/lib/compass/scoring";
```

**Step 2: Write it on create**

Inside the `prisma.compassResult.create({ data: {...} })` call, add to the `data` object:

```ts
      scoringVersion: SCORING_VERSION,
```

**Step 3: Run the typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: no errors.

**Step 4: Commit**

```bash
git add web/src/app/api/compass/submit/route.ts
git commit -m "feat(compass): stamp SCORING_VERSION on every new submission"
```

---

### Task 5: Add version segmentation to admin metrics

**Files:**
- Modify: `web/src/app/admin/metrics/_queries/compass.ts`
- Modify: `web/src/app/admin/metrics/_tabs/compass-tab.tsx`

**Step 1: Update the query to group archetypes by version**

In `compass.ts`, add a fourth promise in the `Promise.all`:

```ts
prisma.$queryRawUnsafe<{ scoringVersion: string; archetype: string; count: bigint }[]>(
  `SELECT "scoringVersion", archetype, COUNT(*)::bigint AS count
     FROM "CompassResult" ${where}
     GROUP BY "scoringVersion", archetype
     ORDER BY "scoringVersion", count DESC`,
  ...args,
),
```

Destructure the new result as `byVersion`, and add this to the returned object:

```ts
    archetypesByVersion: byVersion.reduce((acc, r) => {
      const v = r.scoringVersion || "v1";
      (acc[v] ||= []).push({ label: r.archetype, value: Number(r.count) });
      return acc;
    }, {} as Record<string, { label: string; value: number }[]>),
```

**Step 2: Render it in the admin tab**

In `compass-tab.tsx`, below the existing archetype bar chart, add a version comparison block. Use the existing `SimpleBarChart` component side-by-side:

```tsx
{Object.keys(data.archetypesByVersion).length > 1 && (
  <Section title="Archetype distribution by scoring version">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Object.entries(data.archetypesByVersion).map(([version, rows]) => (
        <div key={version}>
          <div className="mb-2 text-xs uppercase text-neutral-500">{version} — {rows.reduce((s, r) => s + r.value, 0)} submissions</div>
          <SimpleBarChart data={rows} />
        </div>
      ))}
    </div>
  </Section>
)}
```

**Step 3: Visual smoke test locally**

Run: `cd web && npm run dev`
Navigate to `/admin/metrics` → Compass tab.
Expected: pre-existing v1 bar chart renders (all 161 legacy rows); as soon as the first v2 submission arrives, a second "v2" chart appears alongside.

**Step 4: Commit**

```bash
git add web/src/app/admin/metrics/_queries/compass.ts web/src/app/admin/metrics/_tabs/compass-tab.tsx
git commit -m "feat(admin): segment compass archetype distribution by scoringVersion"
```

---

### Task 6: Deploy + smoke

**Step 1: Push**

```bash
git push origin <branch>
```

**Step 2: Verify Railway deploy ran `prisma migrate deploy`**

The `start` script already runs `prisma migrate deploy && next start`, so the migration runs automatically on boot. Confirm the deploy succeeded on the Railway dashboard.

**Step 3: Submit one quiz end-to-end against prod**

Go through `/compass/quiz` on production. Verify one new `CompassResult` row lands with `scoringVersion = 'v2'`.

**Step 4: Confirm the admin metrics page**

Open `/admin/metrics` → Compass tab. Expected: the "Archetype distribution by scoring version" block now shows both v1 (161) and v2 (1+) panels.

---

### Task 7: Clean up transient analysis scripts

The three scripts used to produce these insights should NOT be committed to the repo long-term — they read a private DB URL and were one-off tools.

**Files:**
- Delete: `web/analyze-compass.js`
- Delete: `web/inspect-answers.js`
- Delete: `web/resim-compass.ts`
- Delete: `web/resim-compass-v2.ts`
- Delete: `web/resim-compass-v3.ts`

**Step 1: Remove them**

```bash
cd ~/github/edu-app/web
rm analyze-compass.js inspect-answers.js resim-compass.ts resim-compass-v2.ts resim-compass-v3.ts
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore(compass): remove ad-hoc launch-day analysis scripts"
```

(Optional: save the resim-compass-v3.ts concept under `web/scripts/` if you want to re-run calibration later — but don't check in the one currently sitting at repo root.)

---

## Rollback

If v2 causes problems:

1. In `web/src/lib/compass/scoring.ts`, revert `COSINE_WEIGHT = 0.8` and `DIMENSION_WEIGHT = 0.2`, bump `SCORING_VERSION = "v1.1"` (so you can still distinguish the rollback).
2. Ship.
3. `scoringVersion` on every new row now reads `v1.1`; you can still compare old-v1, new-v1.1, and the short-lived v2 window.

## What this plan does NOT do

- No backfill or re-scoring of the existing 161 v1 rows. They stay as `"v1"`, treated as the baseline cohort.
- No changes to `questions.ts` weights. If we want to also strip `adaptive:1` secondaries later, that's a separate v3.
- No changes to dimension calibration (`maxAbsolute = 45`), philosophy blend normalization, or Part 2 logic.
