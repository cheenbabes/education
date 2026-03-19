# Curriculum Matching Page Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the compass results page with clearer match labels, plain-English explanations, no-match fallback, and literacy component tags.

**Architecture:** All match-reason logic lives server-side in `matching.ts` (where the data is). The results page consumes new fields from the API. Literacy tags use a static frontend lookup map — no DB migration needed.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, Prisma 5, Playwright tests

---

## Task 1: Reseed the Database

**Files:**
- Run: `docker compose up -d` (from repo root)
- Run: `cd web && npx tsx prisma/seed-curricula.ts`

**Step 1: Start Postgres**
```bash
docker compose up -d
```
Expected: container starts (or is already running)

**Step 2: Reseed curricula**
```bash
cd web && npx tsx prisma/seed-curricula.ts
```
Expected: output showing upserted curricula, including Curiosity Chronicles, Stories in History, BookShark

**Step 3: Verify count**
```bash
cd web && npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.curriculum.count().then(n => { console.log('curricula count:', n); p.\$disconnect(); })"
```
Expected: `curricula count: 57` (or close to it)

---

## Task 2: Add `matchReason` to `MatchResult` in `matching.ts`

**Files:**
- Modify: `web/src/lib/compass/matching.ts`

This adds a generated plain-English explanation to every match result. It runs server-side where all data is available.

**Step 1: Add `matchReason` to the `MatchResult` interface**

In `matching.ts` at line 65, add `matchReason` to the `MatchResult` interface:
```typescript
export interface MatchResult {
  curriculum: CurriculumRecord;
  totalScore: number;
  philosophyFitScore: number;
  fitLabel: "strong" | "good" | "partial";
  matchReason: string;
  breakdown?: ScoreBreakdown;
  excludedReason?: string;
}
```

**Step 2: Add the `PHILOSOPHY_NAMES` map and `generateMatchReason` helper function**

Insert after the `// --- Constants ---` section (after line 86):
```typescript
const PHILOSOPHY_NAMES: Record<string, string> = {
  montessori: "Montessori",
  waldorf: "Waldorf",
  project_based: "project-based learning",
  place_nature: "nature-based learning",
  classical: "classical",
  charlotte_mason: "Charlotte Mason",
  unschooling: "child-led/unschooling",
  eclectic_flexible: "eclectic/flexible",
};

function generateMatchReason(
  philosophyBlend: PhilosophyBlend,
  curriculum: CurriculumRecord,
  label: "strong" | "good" | "partial",
): string {
  // User's top 2 philosophies by weight
  const userTop = Object.entries(philosophyBlend)
    .filter(([, v]) => v !== undefined && (v as number) > 0)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([k]) => k);

  if (label === "partial") {
    // Find the philosophy the curriculum actually excels at
    const currTopEntry = Object.entries(curriculum.philosophyScores)
      .sort(([, a], [, b]) => b - a)[0];
    const currTopName = PHILOSOPHY_NAMES[currTopEntry[0]] ?? currTopEntry[0];
    return `This curriculum leans more ${currTopName} than your blend suggests — it may still work as a supplement.`;
  }

  const matchingPhils = userTop
    .filter((p) => (curriculum.philosophyScores[p] ?? 0) >= 0.4)
    .map((p) => PHILOSOPHY_NAMES[p] ?? p);

  if (label === "strong") {
    if (matchingPhils.length > 0) {
      return `Strong fit — it's highly ${matchingPhils.join(" and ")}-oriented, matching your top philosophies.`;
    }
    return "Strong overall fit with your philosophy blend.";
  }

  // good
  if (matchingPhils.length > 0) {
    return `Good fit — it aligns with your ${matchingPhils.join(" and ")} tendencies, with some trade-offs.`;
  }
  return "Good overall fit with your philosophy blend, though not a perfect alignment.";
}
```

**Step 3: Call `generateMatchReason` when building each `MatchResult`**

Find the result-building block near line 364:
```typescript
const result: MatchResult = {
  curriculum,
  totalScore,
  philosophyFitScore,
  fitLabel: fitLabel(philosophyFitScore),
  breakdown: debug ? breakdown : undefined,
};
```

Replace with:
```typescript
const label = fitLabel(philosophyFitScore);
const result: MatchResult = {
  curriculum,
  totalScore,
  philosophyFitScore,
  fitLabel: label,
  matchReason: generateMatchReason(philosophyBlend, curriculum, label),
  breakdown: debug ? breakdown : undefined,
};
```

**Step 4: Fix TypeScript — the debug-mode push also needs `matchReason`**

Find the debug excluded push (near line 283):
```typescript
allScored.push({ curriculum, totalScore: 0, philosophyFitScore: 0, fitLabel: "partial", breakdown, excludedReason });
```
Replace with:
```typescript
allScored.push({ curriculum, totalScore: 0, philosophyFitScore: 0, fitLabel: "partial", matchReason: "Excluded by filter.", breakdown, excludedReason });
```

**Step 5: Verify TypeScript compiles**
```bash
cd web && npx tsc --noEmit
```
Expected: no errors

---

## Task 3: Update `results/page.tsx` — "Close Fit" label + matchReason display

**Files:**
- Modify: `web/src/app/compass/results/page.tsx`

**Step 1: Add `matchReason` to the `MatchResult` interface in the page**

At line 17, add `matchReason` to the interface:
```typescript
interface MatchResult {
  curriculum: { ... };
  totalScore: number;
  philosophyFitScore: number;
  fitLabel: "strong" | "good" | "partial";
  matchReason: string;
}
```

**Step 2: Change `partial` → "Close Fit" in `FIT_STYLES`**

At line 55, update the `partial` entry in `FIT_STYLES`:
```typescript
const FIT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strong: { bg: "bg-green-50", text: "text-green-700", label: "Strong Match" },
  good: { bg: "bg-blue-50", text: "text-blue-700", label: "Good Match" },
  partial: { bg: "bg-amber-50", text: "text-amber-700", label: "Close Fit" },
};
```

**Step 3: Add "Best Fit" badge to first result per subject**

In the curriculum card rendering (around line 387), update the badge section:
```tsx
<div className="flex items-center gap-2 flex-wrap">
  <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
    {idx + 1}. {c.name}
  </h5>
  {idx === 0 && (
    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
      Best Fit
    </span>
  )}
  <span className={`text-xs px-2 py-0.5 rounded ${fit.bg} ${fit.text}`}>
    {fit.label}
  </span>
</div>
```

**Step 4: Show `matchReason` below the description**

After the `{c.description}` paragraph (around line 399), add:
```tsx
<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
  {match.matchReason}
</p>
```

**Step 5: Run Playwright tests**
```bash
cd web && npx playwright test --reporter=list
```
Expected: all 23 tests pass (these tests don't assert on match reason text, so no changes needed)

**Step 6: Commit**
```bash
git add web/src/lib/compass/matching.ts web/src/app/compass/results/page.tsx
git commit -m "feat: add Close Fit label, Best Fit badge, and match reason explanations"
```

---

## Task 4: No-Match Fallback with Filter Relaxation

**Files:**
- Modify: `web/src/lib/compass/matching.ts`
- Modify: `web/src/app/compass/results/page.tsx`

**Context:** Currently if hard filters exclude all curricula for a subject, the subject is simply absent from `bySubject`. We want to detect this and show the closest options with a banner.

**Step 1: Add `fallbackBanner` to `MatchOutput`**

In `matching.ts`, update the `MatchOutput` interface:
```typescript
export interface MatchOutput {
  bySubject: Record<string, MatchResult[]>;
  warnings: MatchWarning[];
  fallbackBanner?: string;  // set when filters were relaxed
  allScored?: MatchResult[];
}
```

**Step 2: Extract the hard-filter logic into a helper**

After the `// --- Helpers ---` section in `matching.ts`, add:
```typescript
interface FilterSet {
  budgetMax: number;
  grades: string[];
  religiousPreference: string | undefined;
}

function passesHardFilters(
  curriculum: CurriculumRecord,
  filters: FilterSet,
): string | undefined {
  // Returns excludedReason string if excluded, undefined if passes

  if (
    filters.religiousPreference &&
    filters.religiousPreference !== "no-preference"
  ) {
    if (filters.religiousPreference === "secular" && curriculum.religiousType !== "secular") {
      return `Religious filter: wanted secular, got ${curriculum.religiousType}`;
    }
    if (filters.religiousPreference === "christian" && curriculum.religiousType !== "christian") {
      return `Religious filter: wanted christian, got ${curriculum.religiousType}`;
    }
    if (
      filters.religiousPreference === "other" &&
      curriculum.religiousType !== "other" &&
      curriculum.religiousType !== "secular"
    ) {
      return `Religious filter: wanted other/secular, got ${curriculum.religiousType}`;
    }
  }

  if (!gradesOverlap(curriculum.gradeRange, filters.grades)) {
    return `Grade filter: ${curriculum.gradeRange} doesn't overlap`;
  }

  if (filters.budgetMax < Infinity) {
    const currMax = parsePriceMax(curriculum.priceRange);
    if (currMax > filters.budgetMax) {
      return `Budget filter: exceeds max $${filters.budgetMax}`;
    }
  }

  return undefined;
}
```

**Step 3: Update `matchCurricula` to use `passesHardFilters` and add fallback**

Replace the hard-filter inline block in the main loop with a call to `passesHardFilters`. Then after the sort/trim block at the end, add fallback logic:

```typescript
// After: sort and trim to top N per subject
for (const subj of Object.keys(bySubject)) {
  bySubject[subj].sort((a, b) => b.totalScore - a.totalScore);
  bySubject[subj] = bySubject[subj].slice(0, TOP_N);
}

// Fallback: if any requested subject has no results, relax filters
const strictFilters: FilterSet = {
  budgetMax: BUDGET_MAX[preferences.budget ?? "not-a-factor"] ?? Infinity,
  grades: preferences.grades ?? [],
  religiousPreference: preferences.religiousPreference,
};

const emptySubjects = requestedSubjects.filter(
  (s) => !bySubject[s] || bySubject[s].length === 0,
);

let fallbackBanner: string | undefined;

if (emptySubjects.length > 0) {
  // Relaxation order: budget → grade → religious
  const relaxations: Array<{ filters: FilterSet; banner: string }> = [
    {
      filters: { ...strictFilters, budgetMax: Infinity },
      banner: "No exact matches for your budget — here are the closest options. Note: these may exceed your stated budget.",
    },
    {
      filters: { ...strictFilters, budgetMax: Infinity, grades: [] },
      banner: "No exact matches for your filters — here are the closest options (grade range and budget relaxed).",
    },
    {
      filters: { budgetMax: Infinity, grades: [], religiousPreference: undefined },
      banner: "No exact matches for your filters — here are the closest options (all filters relaxed).",
    },
  ];

  for (const { filters, banner } of relaxations) {
    const fallbackBySubject: Record<string, MatchResult[]> = {};

    for (const subj of emptySubjects) {
      for (const curriculum of curricula) {
        const excluded = passesHardFilters(curriculum, filters);
        if (excluded) continue;

        // Score (reuse same logic inline)
        let philosophyFitScore = 0;
        for (const [philosophy, userWeight] of Object.entries(philosophyBlend)) {
          if (userWeight === undefined) continue;
          const currScore = curriculum.philosophyScores[philosophy] ?? 0;
          philosophyFitScore += (userWeight as number) * currScore;
        }
        const totalScore = philosophyFitScore + curriculum.qualityScore * 0.05;
        const label = fitLabel(philosophyFitScore);

        const currSubjects = curriculum.subjects.includes("all-in-one")
          ? requestedSubjects
          : curriculum.subjects.map((s) => s.toLowerCase());

        if (!currSubjects.includes(subj)) continue;

        if (!fallbackBySubject[subj]) fallbackBySubject[subj] = [];
        fallbackBySubject[subj].push({
          curriculum,
          totalScore,
          philosophyFitScore,
          fitLabel: label,
          matchReason: generateMatchReason(philosophyBlend, curriculum, label),
        });
      }

      if (fallbackBySubject[subj]?.length > 0) {
        fallbackBySubject[subj].sort((a, b) => b.totalScore - a.totalScore);
        bySubject[subj] = fallbackBySubject[subj].slice(0, TOP_N);
        fallbackBanner = banner;
      }
    }

    // Stop relaxing once all empty subjects are filled
    if (emptySubjects.every((s) => bySubject[s]?.length > 0)) break;
  }
}

return { bySubject, warnings, fallbackBanner, allScored: debug ? allScored : undefined };
```

**Step 4: Update `results/page.tsx` — add fallbackBanner to `MatchOutput` and render it**

In the `MatchOutput` interface in `results/page.tsx`:
```typescript
interface MatchOutput {
  bySubject: Record<string, MatchResult[]>;
  warnings: MatchWarning[];
  fallbackBanner?: string;
}
```

Above the curriculum recommendations section (after warnings, around line 338), add the fallback banner:
```tsx
{matchOutput?.fallbackBanner && (
  <div className="rounded p-4 text-sm bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
    {matchOutput.fallbackBanner}
  </div>
)}
```

**Step 5: Run TypeScript check**
```bash
cd web && npx tsc --noEmit
```
Expected: no errors

**Step 6: Run Playwright tests**
```bash
cd web && npx playwright test --reporter=list
```
Expected: all 23 tests pass

**Step 7: Commit**
```bash
git add web/src/lib/compass/matching.ts web/src/app/compass/results/page.tsx
git commit -m "feat: add no-match fallback with filter relaxation and banner"
```

---

## Task 5: Literacy Subcategory Tags (Static Map)

**Files:**
- Modify: `web/src/app/compass/results/page.tsx`

**Context:** Literacy curricula cover different combos: Reading (R), Writing (W), Spelling (S), Grammar (G), Complete (all). We show small badges on literacy cards so parents can instantly see "R + W + S" vs "Complete LA". No DB change — static map keyed by curriculum name.

**Step 1: Add the static literacy components map near the top of the file**

After the `PREP_STYLES` constant (around line 61), add:
```typescript
type LiteracyComponent = "reading" | "writing" | "spelling" | "grammar" | "complete";

const LITERACY_COMPONENTS: Record<string, LiteracyComponent[]> = {
  "All About Reading": ["reading"],
  "Logic of English Foundations": ["reading", "spelling", "grammar"],
  "The Good and the Beautiful Language Arts": ["complete"],
  "Sonlight Language Arts": ["writing", "grammar"],
  "Well-Trained Mind Writing & Rhetoric": ["writing"],
  "Institute for Excellence in Writing": ["writing"],
  "All About Spelling": ["spelling"],
  "Explode the Code": ["reading", "spelling"],
  "Brave Writer": ["writing"],
  "Simply Charlotte Mason Language Arts": ["complete"],
  "Memoria Press Grammar": ["grammar"],
  "Rod and Staff English": ["grammar", "writing"],
  "Easy Grammar": ["grammar"],
  "First Language Lessons": ["grammar"],
  "Growing With Grammar": ["grammar"],
  "Writing With Ease": ["writing"],
  "Learning Language Arts Through Literature": ["complete"],
  "Handwriting Without Tears": ["writing"],
  "Cursive Logic": ["writing"],
  "BookShark Language Arts": ["complete"],
  "Curiosity Chronicles Language Arts": ["complete"],
};

const LITERACY_COMPONENT_LABELS: Record<LiteracyComponent, string> = {
  reading: "R",
  writing: "W",
  spelling: "S",
  grammar: "G",
  complete: "Complete LA",
};

const LITERACY_COMPONENT_COLORS: Record<LiteracyComponent, string> = {
  reading: "bg-sky-100 text-sky-700",
  writing: "bg-violet-100 text-violet-700",
  spelling: "bg-rose-100 text-rose-700",
  grammar: "bg-orange-100 text-orange-700",
  complete: "bg-teal-100 text-teal-700",
};
```

**Step 2: Render literacy badges on curriculum cards for literacy subjects**

In the curriculum card rendering, after the existing tags row (after `{c.notes && ...}`), add:
```tsx
{subject === "literacy" && LITERACY_COMPONENTS[c.name] && (
  <div className="flex flex-wrap gap-1 mt-2">
    {LITERACY_COMPONENTS[c.name].map((component) => (
      <span
        key={component}
        className={`text-xs px-1.5 py-0.5 rounded font-medium ${LITERACY_COMPONENT_COLORS[component]}`}
        title={component.charAt(0).toUpperCase() + component.slice(1)}
      >
        {LITERACY_COMPONENT_LABELS[component]}
      </span>
    ))}
  </div>
)}
```

Note: the `subject` variable is available from the `Object.entries(matchOutput.bySubject).map(([subject, results]) => ...)` outer loop. Make sure the inner `results.map((match, idx) => ...)` closure has access — it does because both are in the same scope.

**Step 3: Run Playwright tests**
```bash
cd web && npx playwright test --reporter=list
```
Expected: all 23 pass

**Step 4: Commit**
```bash
git add web/src/app/compass/results/page.tsx
git commit -m "feat: add literacy subcategory badges (R/W/S/G) to curriculum cards"
```

---

## Task 6: Prep Level Tooltip

**Files:**
- Modify: `web/src/app/compass/results/page.tsx`

**Step 1: Add `title` attribute to the prep level badge for a tooltip**

In the curriculum card, find the prep level `<span>`:
```tsx
<span
  className="text-xs px-2 py-0.5 rounded"
  style={{ ... }}
>
  {c.prepLevel}
</span>
```

Add a `title` attribute:
```tsx
<span
  className="text-xs px-2 py-0.5 rounded"
  style={{ ... }}
  title="Prep level is based on community reviews and publisher descriptions."
>
  {c.prepLevel}
</span>
```

**Step 2: Commit**
```bash
git add web/src/app/compass/results/page.tsx
git commit -m "feat: add prep level sourcing tooltip"
```

---

## Task 7: All-in-One Bundle Badge + Note

**Files:**
- Modify: `web/src/app/compass/results/page.tsx`

**Context:** Curricula with multiple subjects in their `subjects` array (Sonlight, Oak Meadow, etc.) are complete packages. When they appear in a subject column (e.g. math), parents need to know they'd be buying a full bundle, not just the math component. Detection: `curriculum.subjects.length > 1`.

**Step 1: Add a helper to format the subjects list for the note**

Near the `SUBJECT_LABELS` constant, add:
```typescript
function formatSubjectList(subjects: string[]): string {
  const labels = subjects.map((s) => SUBJECT_LABELS[s] ?? s);
  if (labels.length <= 2) return labels.join(" & ");
  return labels.slice(0, -1).join(", ") + " & " + labels[labels.length - 1];
}
```

**Step 2: Add the "All-in-One Bundle" badge to the tag row**

In the curriculum card, find the `<div className="flex flex-wrap gap-2 mt-3">` tags row. Add the badge as the first item, conditionally:
```tsx
<div className="flex flex-wrap gap-2 mt-3">
  {c.subjects.length > 1 && (
    <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
      All-in-One Bundle
    </span>
  )}
  {/* existing prep, religious, grade, price tags */}
  ...
</div>
```

**Step 3: Add the explanatory note below the tag row**

Directly after the closing `</div>` of the tags row, add:
```tsx
{c.subjects.length > 1 && (
  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">
    Covers {formatSubjectList(c.subjects)} — may need to be purchased as a complete package. Check the publisher&apos;s site.
  </p>
)}
```

**Step 4: Run Playwright tests**
```bash
cd web && npx playwright test --reporter=list
```
Expected: all 23 tests pass

**Step 5: Commit**
```bash
git add web/src/app/compass/results/page.tsx
git commit -m "feat: add All-in-One Bundle badge and note to multi-subject curriculum cards"
```

---

## Final Verification

**Step 1: Run all tests**
```bash
cd web && npx playwright test --reporter=list
```
Expected: all 23 tests pass

**Step 2: Manual smoke test**
- Start the app: `cd web && npx next dev -p 3456`
- Navigate to `/compass/results` (or take the quiz)
- Verify:
  - First result in each subject has "Best Fit" green badge
  - All cards show italic match reason text
  - Partial match cards say "Close Fit" in amber
  - Literacy cards show R/W/S/G badges
  - Prep level badge has tooltip on hover
  - No TypeScript errors in console
