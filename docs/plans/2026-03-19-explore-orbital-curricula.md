# Explore Page: Orbital Curricula & Color System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the explore star map so each curriculum appears as a node near every philosophy where it scores ≥30%, with distance-from-center inversely proportional to match strength. Apply the new 4-tier color system and coconut cream philosophy styling.

**Architecture:** Instead of 1 node per curriculum anchored to its top-scoring philosophy, the API route emits one "placement" per curriculum×philosophy pair above threshold. The canvas renders these as independent nodes that share a curriculum ID. Clicking any instance slides to center and highlights all sibling instances + score-weighted connection lines. The force layout changes from one global simulation to per-philosophy orbital positioning.

**Tech Stack:** Next.js 14, Three.js (via @react-three/fiber v8), D3-force, Prisma, TypeScript

---

## Reference: Design Tokens

```
Philosophy glyph color:  #F9F6EF  (coconut cream)
Curricula glyph:         #FFB400  (gold, 12-ray sun)
Principles glyph:        #FF7C15  (deep orange, 8-ray compass)
Activities glyph:        #ED4672  (hot pink, 6-ray petals)
Materials glyph:         #B44AFF  (electric lavender, 4-ray diamond)
Dark navy text:          #1B2A4A
Legend pill background:  #F9F6EF
Legend philosophy glyph: #1B2A4A  (navy, since pill bg is already cream)
```

## Reference: Data Distribution (from analysis)

- 57 active curricula, avg 3.6 philosophy placements at 30% threshold
- ~205 total curriculum nodes across 8 philosophy zones (~25 per constellation)
- Range: 1 placement (Saxon Math → Classical only) to 8 (Simply Charlotte Mason History)

---

### Task 1: Extend API Route to Emit Curriculum Placements

**Files:**
- Modify: `web/src/app/api/explore/graph/route.ts`
- Modify: `web/src/components/explore/types.ts`

**Step 1: Add CurriculumPlacement type**

In `types.ts`, add:

```typescript
export interface CurriculumPlacement {
  placementId: string;          // `${curriculum.id}__${philosophyName}`
  curriculumId: string;         // original curriculum ID (for sibling lookup)
  philosophyName: string;       // which philosophy this placement orbits
  score: number;                // philosophy score (0.3–1.0)
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeRange: string;
  philosophyScores: Record<string, number>;  // full scores for info panel
  prepLevel: string;
  religiousType: string;
  priceRange: string;
  qualityScore: number;
  affiliateUrl: string | null;
  notes: string | null;
}
```

**Step 2: Generate placements in the API route**

In `route.ts`, after the existing `curricula` mapping, add placement generation:

```typescript
const PLACEMENT_THRESHOLD = 0.30;

const curriculumPlacements: CurriculumPlacement[] = [];
for (const c of curricula) {
  const scores = c.philosophyScores as Record<string, number>;
  for (const [philName, score] of Object.entries(scores)) {
    if (score >= PLACEMENT_THRESHOLD) {
      curriculumPlacements.push({
        placementId: `${c.id}__${philName}`,
        curriculumId: c.id,
        philosophyName: philName,
        score,
        name: c.name,
        publisher: c.publisher,
        description: c.description,
        subjects: c.subjects,
        gradeRange: c.gradeRange,
        philosophyScores: scores,
        prepLevel: c.prepLevel,
        religiousType: c.religiousType,
        priceRange: c.priceRange,
        qualityScore: c.qualityScore,
        affiliateUrl: c.affiliateUrl,
        notes: c.notes,
      });
    }
  }
}
```

Add `curriculumPlacements` to the JSON response alongside the existing `curricula` field (keep the old field for backward compatibility during migration).

**Step 3: Run build to verify**

```bash
cd web && npx next build
```

Expected: Build succeeds, no type errors.

**Step 4: Commit**

```bash
git add web/src/app/api/explore/graph/route.ts web/src/components/explore/types.ts
git commit -m "feat(explore): add curriculum placement model with 30% threshold"
```

---

### Task 2: Update Positioning to Orbital Model

**Files:**
- Modify: `web/src/components/explore/positions.ts`

**Step 1: Add orbital placement function**

Replace or supplement `getCurriculumPlacement()` with a new function that positions curriculum placements within a philosophy's orbit:

```typescript
export function getOrbitalPosition(
  philosophyName: string,
  score: number,
  index: number,
  totalInOrbit: number,
): [number, number] {
  const philPos = PHILOSOPHY_POSITIONS[philosophyName];
  if (!philPos) return [0, 0];

  // Distance: high score = close (minDist), low score = far (maxDist)
  // Score range is 0.3–1.0, map to distance range
  const minDist = 1.6;   // just outside philosophy glyph radius (~1.1)
  const maxDist = 4.0;   // outer edge of orbit zone
  const t = (score - 0.30) / 0.70;  // normalize 0.3–1.0 → 0–1
  const dist = maxDist - t * (maxDist - minDist);  // high score = low dist

  // Angle: golden angle spiral for even distribution
  const goldenAngle = 2.39996323;
  const angle = index * goldenAngle;

  // Small jitter for organic feel
  const jitterR = (Math.sin(index * 7.13) * 0.15);
  const jitterA = (Math.cos(index * 3.77) * 0.2);

  const x = philPos[0] + (dist + jitterR) * Math.cos(angle + jitterA);
  const y = philPos[1] + (dist + jitterR) * Math.sin(angle + jitterA);

  return [x, y];
}
```

**Step 2: Commit**

```bash
git add web/src/components/explore/positions.ts
git commit -m "feat(explore): add orbital positioning for curriculum placements"
```

---

### Task 3: Update ExploreCanvas to Render Placements

**Files:**
- Modify: `web/src/app/explore/page.tsx` (data fetching, context)
- Modify: `web/src/components/explore/ExploreCanvas.tsx`
- Modify: `web/src/components/explore/CurriculumMoon.tsx`
- Modify: `web/src/components/explore/useExploreState.ts`

**Step 1: Update page data fetch**

In `page.tsx`, after fetching graph data, compute orbital positions for the new `curriculumPlacements` array:

```typescript
// Group placements by philosophy to get per-orbit index
const placementsByPhil: Record<string, CurriculumPlacement[]> = {};
for (const p of data.curriculumPlacements) {
  (placementsByPhil[p.philosophyName] ??= []).push(p);
}
// Sort each group by score descending (highest score = closest)
for (const group of Object.values(placementsByPhil)) {
  group.sort((a, b) => b.score - a.score);
}

// Compute positions
const placementPositions: Record<string, [number, number]> = {};
for (const [philName, group] of Object.entries(placementsByPhil)) {
  group.forEach((p, i) => {
    placementPositions[p.placementId] = getOrbitalPosition(
      philName, p.score, i, group.length
    );
  });
}
```

Pass `curriculumPlacements` and `placementPositions` through context to the canvas.

**Step 2: Update CurriculumMoon to accept placement data**

Modify the CurriculumMoon component props to accept a `CurriculumPlacement` instead of the old curriculum node. The key differences:
- Use `placementId` as the node key (not `curriculum.id`)
- Position from `placementPositions[placementId]`
- On click, set focusedNode with both `placementId` and `curriculumId`

**Step 3: Render placements instead of curricula**

In `ExploreCanvas.tsx`, replace the curriculum mapping:

```typescript
// Old: curricula.map(c => <CurriculumMoon key={c.id} ... />)
// New:
{data.curriculumPlacements.map(p => (
  <CurriculumMoon
    key={p.placementId}
    placement={p}
    position={placementPositions[p.placementId]}
    // ... other props
  />
))}
```

**Step 4: Update FocusedNode type**

In `useExploreState.ts`, extend FocusedNode to include `curriculumId`:

```typescript
FocusedNode {
  type: "philosophy" | "curriculum" | "principle" | "activity" | "material";
  id: string;           // placementId for curriculum placements
  curriculumId?: string; // shared ID for sibling lookup
  philosophyId?: string;
}
```

**Step 5: Run build to verify**

```bash
cd web && npx next build
```

**Step 6: Commit**

```bash
git add web/src/app/explore/page.tsx web/src/components/explore/ExploreCanvas.tsx \
  web/src/components/explore/CurriculumMoon.tsx web/src/components/explore/useExploreState.ts
git commit -m "feat(explore): render curriculum placements in per-philosophy orbits"
```

---

### Task 4: Sibling Highlighting on Focus

**Files:**
- Modify: `web/src/components/explore/CurriculumMoon.tsx`
- Modify: `web/src/components/explore/ConnectionLines.tsx`

**Step 1: Highlight sibling placements**

When a curriculum placement is focused, all other placements sharing the same `curriculumId` should glow/pulse as "connected". In `CurriculumMoon.tsx`:

```typescript
const isSibling = focusedNode?.type === 'curriculum'
  && focusedNode.curriculumId === placement.curriculumId
  && focusedNode.id !== placement.placementId;
```

Apply the `isSibling` state similarly to `isConnected` — scale up slightly (1.25), boost opacity, show label.

**Step 2: Draw connection lines to siblings**

In `ConnectionLines.tsx`, when a curriculum is focused, draw lines:
1. From the focused placement to each philosophy where it has a sibling placement (line opacity = score)
2. Faint shimmer lines to the sibling placement nodes themselves

```typescript
if (focusedNode?.type === 'curriculum' && focusedNode.curriculumId) {
  // Find all placements with same curriculumId
  const siblings = curriculumPlacements.filter(
    p => p.curriculumId === focusedNode.curriculumId
  );
  for (const sib of siblings) {
    // Line from focused position to sibling position
    // Opacity = sib.score * 0.6
    // Color = philosophy color of sib.philosophyName
  }
}
```

**Step 3: Test interaction manually**

Run dev server, click a multi-philosophy curriculum (e.g., Oak Meadow Science — appears in 7 constellations at 30%). Verify:
- All 7 instances glow when any one is clicked
- Connection lines appear to each instance
- Info panel shows the full philosophy score breakdown

**Step 4: Commit**

```bash
git add web/src/components/explore/CurriculumMoon.tsx \
  web/src/components/explore/ConnectionLines.tsx
git commit -m "feat(explore): highlight sibling placements on curriculum focus"
```

---

### Task 5: Update Force Layout for Orbital Model

**Files:**
- Modify: `web/src/components/explore/useForceLayout.ts`

**Step 1: Adjust force simulation for placements**

The force layout needs to work with placement nodes, not curriculum nodes. Key changes:

- When a **philosophy** is focused: pull in all placements in its orbit (no change to distant placements from other philosophies)
- When a **curriculum placement** is focused: the focused placement slides to center, sibling placements stay in their orbits but get highlighted (don't force-pull them in — that would be confusing)
- Anchor forces for unfocused placements should target their orbital position (not a global default)

```typescript
// For each placement node, its "home" position is its orbital position
const homePosition = placementPositions[node.placementId];
```

**Step 2: Commit**

```bash
git add web/src/components/explore/useForceLayout.ts
git commit -m "feat(explore): adapt force layout for orbital placement model"
```

---

### Task 6: Apply Color System — Philosophy Glyphs

**Files:**
- Modify: `web/src/components/explore/PhilosophyStar.tsx`

**Step 1: Change philosophy glyph color to coconut cream**

Replace the gold color (`#D4A853` or `#FFB400`) used for philosophy constellation glyphs, focus rings, and halos with `#F9F6EF`:

- Constellation line segments: `#F9F6EF`
- Constellation points: `#F9F6EF`
- Halo/focus ring: `#F9F6EF` at reduced opacity
- Label text: keep golden or switch to cream (test both — cream may read better on dark bg)

Do NOT change the per-philosophy `color` field from the API — that's used for data grouping. This is purely the rendered glyph fill.

**Step 2: Commit**

```bash
git add web/src/components/explore/PhilosophyStar.tsx
git commit -m "style(explore): philosophy glyphs to coconut cream #F9F6EF"
```

---

### Task 7: Apply Color System — Node Type Glyphs

**Files:**
- Modify: `web/src/components/explore/CurriculumMoon.tsx`
- Modify: `web/src/components/explore/DetailNodes.tsx`

**Step 1: Update curriculum glyph color**

In `CurriculumMoon.tsx`, change the glyph fill from gold to `#FFB400` (may already be this — verify and ensure consistency).

**Step 2: Verify detail node colors**

In `DetailNodes.tsx`, confirm:
- Principles: `#FF7C15`
- Activities: `#ED4672`
- Materials: `#B44AFF`

These may already be set from a previous session — verify and fix if needed.

**Step 3: Commit**

```bash
git add web/src/components/explore/CurriculumMoon.tsx \
  web/src/components/explore/DetailNodes.tsx
git commit -m "style(explore): apply tier color system to node glyphs"
```

---

### Task 8: Redesign Legend Pills

**Files:**
- Modify: `web/src/components/explore/ControlBar.tsx`

**Step 1: Restyle layer toggle buttons**

Current: dark toggle buttons with text labels.
New design:

```
┌─────────────────────────────────────┐
│ [◆navy] Philosophies  [☀gold] Curricula  [✦orange] Principles  [✿pink] Activities  [◇purple] Materials │
│  cream bg / navy text   cream bg / navy text   cream bg / navy text    cream bg / navy text    cream bg / navy text  │
└─────────────────────────────────────┘
```

Each pill:
- Background: `#F9F6EF` (coconut cream) when active, `transparent` / dim when inactive
- Text: `#1B2A4A` (dark navy)
- Small SVG glyph icon to the left of the label, colored per node type:
  - Philosophies: `#1B2A4A` (navy — exception because pill bg is already cream)
  - Curricula: `#FFB400`
  - Principles: `#FF7C15`
  - Activities: `#ED4672`
  - Materials: `#B44AFF`

**Step 2: Add inline SVG mini-glyphs**

Create small (12×12) inline SVGs for each node type using the shapes from the glyph POC:
- 12-ray sun (curricula)
- 8-ray compass (principles)
- 6-ray petals (activities)
- 4-ray diamond (materials)
- Small circle or star (philosophies)

These can be simple `<svg>` elements inline in the JSX — no separate files needed.

**Step 3: Test toggle behavior**

Verify active/inactive states work correctly, and that the Philosophies button remains always-on (disabled but visually active).

**Step 4: Commit**

```bash
git add web/src/components/explore/ControlBar.tsx
git commit -m "style(explore): redesign legend pills with cream bg and colored glyphs"
```

---

### Task 9: Update Info Panel for Placement Model

**Files:**
- Modify: `web/src/components/explore/InfoPanel.tsx`

**Step 1: Curriculum panel shows placement context**

When a curriculum placement is focused, the info panel should:
- Show the curriculum name, publisher, description (same as before)
- Highlight which philosophy this instance orbits ("Viewing near Waldorf")
- Show the full philosophy score bars with the current philosophy's bar emphasized
- Add a note like "Also appears near: Charlotte Mason (40%), Nature-Based (35%)" for siblings above threshold
- Keep existing tags (grade, prep, price, religious type)

**Step 2: Commit**

```bash
git add web/src/components/explore/InfoPanel.tsx
git commit -m "feat(explore): info panel shows placement context and siblings"
```

---

### Task 10: Tune & Polish

**Files:**
- Various explore components

**Step 1: Tune the placement threshold**

Run the app, look at the map. If constellations feel overcrowded at 30%, try 35% or 40%. The threshold is a single constant in `route.ts` — easy to adjust.

Check:
- Do constellations feel balanced? (Not too sparse, not too crowded)
- Are cross-philosophy curricula clearly visible in multiple orbits?
- Does clicking a multi-orbit curriculum feel clear?

**Step 2: Tune orbital distances**

Adjust `minDist` and `maxDist` in `getOrbitalPosition()` so that:
- 90%+ curricula are snug against the philosophy (but not overlapping)
- 30% curricula are at the outer edge (but not drifting into neighboring constellations)
- No curriculum node overlaps a philosophy glyph

**Step 3: Camera animation for sibling discovery**

When a curriculum is clicked, after the slide-to-center animation, consider a subtle camera zoom-out so the user can see sibling highlights across the map. Test whether this feels natural or jarring.

**Step 4: Commit**

```bash
git commit -am "chore(explore): tune orbital distances and placement threshold"
```

---

## Execution Dependencies

```
Task 1 (API) ─────────────┐
Task 2 (Positioning) ─────┤
                           ├─→ Task 3 (Canvas rendering) ──→ Task 4 (Sibling highlight)
Task 6 (Philosophy color) ─┘                                       │
Task 7 (Node colors) ──────────────────────────────────────────────┤
                                                                    ├─→ Task 10 (Tune)
Task 5 (Force layout) ─────────────────────────────────────────────┤
Task 8 (Legend pills) ─────────────────────────────────────────────┤
Task 9 (Info panel) ───────────────────────────────────────────────┘
```

Tasks 1, 2, 6, 7 can run in parallel. Task 3 depends on 1+2. Tasks 4, 5, 8, 9 depend on 3. Task 10 is final polish.
