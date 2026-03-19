# Knowledge Graph Explorer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a constellation-style interactive visualization of the knowledge graph at `/explore`, where philosophy stars are positioned by dimension scores, curricula orbit as moons, and users can zoom into nodes to explore principles, activities, and materials.

**Architecture:** Next.js page at `web/src/app/explore/page.tsx` backed by a single API endpoint `GET /api/explore/graph` that merges data from Kuzu (philosophies, principles, activities, materials) and Postgres (curricula). All rendering is client-side via React Three Fiber (WebGL). Orthographic camera, selective bloom for glow, DOM overlay for info panel.

**Tech Stack:** React Three Fiber, @react-three/drei, @react-three/postprocessing, Three.js, existing Prisma client + KG service.

---

### Task 1: Install dependencies and scaffold

**Files:**
- Modify: `web/package.json`
- Create: `web/src/app/explore/page.tsx` (minimal placeholder)

**Step 1:** Install Three.js ecosystem

```bash
cd web && npm install three @react-three/fiber @react-three/drei @react-three/postprocessing @types/three
```

**Step 2:** Create minimal explore page

Create `web/src/app/explore/page.tsx`:
```tsx
"use client";

export default function ExplorePage() {
  return (
    <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Knowledge Graph Explorer — loading...</p>
    </div>
  );
}
```

**Step 3:** Verify it renders

```bash
cd web && npx next dev -p 3456
```
Visit `http://localhost:3456/explore` — should show dark page with placeholder text.

**Step 4:** Commit

```bash
git add -A && git commit -m "feat: scaffold /explore page with Three.js dependencies"
```

---

### Task 2: Build the graph API endpoint

**Files:**
- Create: `web/src/app/api/explore/graph/route.ts`

**Step 1:** Create the API endpoint

This endpoint fetches from both the KG service (via HTTP to localhost:8000) and Postgres (via Prisma). Philosophy dimension positions are hardcoded since they're aesthetic/semantic, not stored in the graph.

```ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const KG_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

// Philosophy positions on dimension axes (0-100 scale)
// structure: 0=child-led, 100=teacher-directed
// modality: 0=experiential/hands-on, 100=academic/book-based
const PHILOSOPHY_DIMENSIONS: Record<string, { structure: number; modality: number }> = {
  "classical":            { structure: 85, modality: 80 },
  "charlotte-mason":      { structure: 60, modality: 55 },
  "waldorf-adjacent":     { structure: 45, modality: 25 },
  "montessori-inspired":  { structure: 35, modality: 30 },
  "project-based-learning": { structure: 40, modality: 35 },
  "place-nature-based":   { structure: 30, modality: 15 },
  "unschooling":          { structure: 10, modality: 20 },
  "flexible":             { structure: 50, modality: 50 },
};

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired": "#8B5CF6",
  "waldorf-adjacent": "#F59E0B",
  "project-based-learning": "#3B82F6",
  "place-nature-based": "#10B981",
  "classical": "#6366F1",
  "charlotte-mason": "#EC4899",
  "unschooling": "#F97316",
  "flexible": "#6B7280",
};

export async function GET() {
  // Fetch philosophy data from KG service
  let kgData: any = { philosophies: [], principles: [], activities: [], materials: [], edges: [] };

  try {
    // Query KG service for all philosophy graph data
    const kgRes = await fetch(`${KG_URL}/graph-export`, { next: { revalidate: 3600 } });
    if (kgRes.ok) {
      kgData = await kgRes.json();
    }
  } catch {
    // KG service not running — serve what we can from Postgres
  }

  // Fetch curricula from Postgres
  const dbCurricula = await prisma.curriculum.findMany({ where: { active: true } });
  const curricula = dbCurricula.map((c) => ({
    id: c.id,
    name: c.name,
    publisher: c.publisher,
    description: c.description,
    subjects: c.subjects,
    gradeRange: c.gradeRange,
    philosophyScores: c.philosophyScores as Record<string, number>,
    prepLevel: c.prepLevel,
    religiousType: c.religiousType,
    priceRange: c.priceRange,
    qualityScore: c.qualityScore,
    affiliateUrl: c.affiliateUrl,
    notes: c.notes,
  }));

  // Build philosophy nodes with dimensions
  const philosophies = kgData.philosophies.map((p: any) => ({
    ...p,
    dimensions: PHILOSOPHY_DIMENSIONS[p.name] || { structure: 50, modality: 50 },
    color: PHILOSOPHY_COLORS[p.name] || "#6B7280",
  }));

  return NextResponse.json({
    philosophies,
    curricula,
    principles: kgData.principles,
    activities: kgData.activities,
    materials: kgData.materials,
    edges: kgData.edges,
  }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
```

**Step 2:** Add the `/graph-export` endpoint to the KG service

Create `kg-service/api/graph_export.py`:
```python
"""Export full graph data for the constellation visualization."""

from fastapi import APIRouter
import kuzu
from config import settings

router = APIRouter()

@router.get("/graph-export")
async def graph_export():
    db = kuzu.Database(str(settings.kuzu_db_path), read_only=True)
    conn = kuzu.Connection(db)

    # Philosophies
    r = conn.execute("MATCH (p:Philosophy) RETURN p.name, p.description")
    philosophies = []
    while r.has_next():
        row = r.get_next()
        philosophies.append({"name": row[0], "description": row[1]})

    # Count nodes per philosophy
    r = conn.execute("MATCH (pr:Principle) RETURN pr.philosophy_name, count(pr)")
    principle_counts = {}
    while r.has_next():
        row = r.get_next()
        principle_counts[row[0]] = row[1]

    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)
        RETURN ph.name, count(DISTINCT a)
    """)
    activity_counts = {}
    while r.has_next():
        row = r.get_next()
        activity_counts[row[0]] = row[1]

    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)-[:USES]->(m:MaterialType)
        RETURN ph.name, count(DISTINCT m)
    """)
    material_counts = {}
    while r.has_next():
        row = r.get_next()
        material_counts[row[0]] = row[1]

    for p in philosophies:
        p["principleCount"] = principle_counts.get(p["name"], 0)
        p["activityCount"] = activity_counts.get(p["name"], 0)
        p["materialCount"] = material_counts.get(p["name"], 0)

    # Principles
    r = conn.execute("MATCH (pr:Principle) RETURN pr.id, pr.name, pr.description, pr.philosophy_name")
    principles = []
    while r.has_next():
        row = r.get_next()
        principles.append({"id": row[0], "name": row[1], "description": row[2], "philosophyId": row[3]})

    # Activities (via edge traversal to get philosophy)
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)
        RETURN DISTINCT a.id, a.name, a.description, a.indoor_outdoor, ph.name
    """)
    activities = []
    seen_acts = set()
    while r.has_next():
        row = r.get_next()
        if row[0] not in seen_acts:
            seen_acts.add(row[0])
            activities.append({"id": row[0], "name": row[1], "description": row[2], "indoorOutdoor": row[3], "philosophyId": row[4]})

    # Materials (via edge traversal)
    r = conn.execute("""
        MATCH (ph:Philosophy)-[:VALUES]->(pr:Principle)-[:SUGGESTS]->(a:ActivityType)-[:USES]->(m:MaterialType)
        RETURN DISTINCT m.id, m.name, m.category, ph.name
    """)
    materials = []
    seen_mats = set()
    while r.has_next():
        row = r.get_next()
        if row[0] not in seen_mats:
            seen_mats.add(row[0])
            materials.append({"id": row[0], "name": row[1], "category": row[2], "philosophyId": row[3]})

    return {
        "philosophies": philosophies,
        "principles": principles,
        "activities": activities,
        "materials": materials,
    }
```

Register in `kg-service/main.py`:
```python
from api.graph_export import router as graph_export_router
app.include_router(graph_export_router, tags=["Graph Export"])
```

**Step 3:** Verify the API works

Start KG service: `cd kg-service && source .venv/bin/activate && uvicorn main:app --port 8000`
Test: `curl http://localhost:8000/graph-export | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['philosophies']), 'philosophies', len(d['principles']), 'principles')"`
Expected: `8 philosophies 594 principles`

**Step 4:** Commit

```bash
git add -A && git commit -m "feat: add /graph-export KG endpoint and /api/explore/graph Next.js route"
```

---

### Task 3: Build the constellation canvas with philosophy stars

**Files:**
- Rewrite: `web/src/app/explore/page.tsx`
- Create: `web/src/components/explore/ExploreCanvas.tsx`
- Create: `web/src/components/explore/PhilosophyStar.tsx`
- Create: `web/src/components/explore/types.ts`

This task gets the dark canvas rendering with 8 glowing philosophy orbs positioned by dimension scores. No interaction yet — just the visual foundation.

**Key details:**
- Canvas fills viewport, dark background `#0a0a0f`
- Orthographic camera (2D map feel)
- Philosophy positions: map `structure` (0-100) → x (-6 to 6) and `modality` (0-100) → y (-4 to 4)
- Each philosophy is a sphere with custom glow using selective bloom
- Size proportional to `log(principleCount + activityCount + materialCount)`
- Subtle breathing pulse animation (scale oscillation via useFrame)
- Labels below each star using drei `<Text>`

**Step 1:** Create types file `web/src/components/explore/types.ts` with the graph data interfaces.

**Step 2:** Create `ExploreCanvas.tsx` — the root Canvas component with orthographic camera, bloom postprocessing, and dark background.

**Step 3:** Create `PhilosophyStar.tsx` — a component for each philosophy orb with glow material, breathing animation, and label.

**Step 4:** Update `explore/page.tsx` to fetch `/api/explore/graph` and render `<ExploreCanvas>`.

**Step 5:** Verify — 8 glowing orbs should appear on dark background, positioned meaningfully (Classical top-left, Unschooling bottom-right, etc.)

**Step 6:** Commit

```bash
git add -A && git commit -m "feat: constellation canvas with positioned philosophy star nodes"
```

---

### Task 4: Add curriculum moon nodes

**Files:**
- Create: `web/src/components/explore/CurriculumMoon.tsx`
- Modify: `web/src/components/explore/ExploreCanvas.tsx`

**Key details:**
- Each curriculum positioned at weighted average of its philosophy scores mapped to dimension space
- Smaller than philosophy stars, cooler tone (silver-white with hint of top philosophy color)
- Labels hidden at default zoom, visible on hover or when zoomed in
- ~57 nodes — render as instanced mesh for performance

**Step 1:** Create `CurriculumMoon.tsx` — computes position from philosophy scores, renders as smaller sphere.

**Step 2:** Add to ExploreCanvas, verify curricula appear between/near their best-match philosophies.

**Step 3:** Commit

```bash
git add -A && git commit -m "feat: add curriculum moon nodes positioned by philosophy scores"
```

---

### Task 5: Build focus-zoom interaction

**Files:**
- Create: `web/src/components/explore/useExploreStore.ts` (zustand-like state with useState)
- Modify: `web/src/components/explore/ExploreCanvas.tsx`
- Modify: `web/src/components/explore/PhilosophyStar.tsx`
- Modify: `web/src/components/explore/CurriculumMoon.tsx`

**Key details:**
- Click a philosophy star → camera animates to zoom in (800ms ease-out)
- Other stars fade to 20% opacity
- Principles/activities/materials for that philosophy appear in arcs (bloom effect)
- Click background or press Escape → reverse animation back to full view
- State: `focusedNode: { type: 'philosophy' | 'curriculum', id: string } | null`

**Step 1:** Create explore state hook managing `focusedNode`, `zoom level`, and transition state.

**Step 2:** Add click handler to PhilosophyStar that triggers zoom. Animate camera position using useFrame lerp.

**Step 3:** When zoomed in, render principle/activity/material nodes in arcs around the focused philosophy. Use lightweight force settling.

**Step 4:** Add Escape key handler and background click to zoom out.

**Step 5:** Commit

```bash
git add -A && git commit -m "feat: focus-zoom interaction with principle/activity/material bloom"
```

---

### Task 6: Build info panel overlay

**Files:**
- Create: `web/src/components/explore/InfoPanel.tsx`
- Modify: `web/src/app/explore/page.tsx`

**Key details:**
- Glass-morphism panel (frosted dark with `backdrop-blur`) on right third of screen
- Appears when a node is focused (philosophy or curriculum)
- For philosophies: name, description, stats, top-matched curricula with scores
- For curricula: name, publisher, description, philosophy score breakdown, prep level, price, affiliate link
- Scrollable content area
- Close button or clicking away dismisses

**Step 1:** Create `InfoPanel.tsx` as a React DOM overlay (not in 3D scene). Uses the explore state to show relevant data.

**Step 2:** Integrate into the explore page layout, positioned absolutely over the canvas.

**Step 3:** Commit

```bash
git add -A && git commit -m "feat: glass-morphism info panel for focused nodes"
```

---

### Task 7: Build filter controls and connection lines

**Files:**
- Create: `web/src/components/explore/ControlBar.tsx`
- Create: `web/src/components/explore/ConnectionLines.tsx`
- Modify: `web/src/components/explore/ExploreCanvas.tsx`

**Key details:**
- Bottom control bar: frosted translucent strip, 48px tall
- Five toggle pills: Philosophies (always on), Curricula, Principles, Activities, Materials
- Each uses its color (silver, white, amber, blue)
- Toggle animates particles in/out (~400ms)
- Connection lines: thin luminous bezier curves, appear on hover/focus, opacity = connection strength
- Home icon (top-left) links back to `/`

**Step 1:** Create `ControlBar.tsx` — DOM overlay at bottom with toggle state.

**Step 2:** Wire filter state to ExploreCanvas — hidden layers fade out, visible ones fade in.

**Step 3:** Create `ConnectionLines.tsx` — renders bezier curves between focused node and its connections using drei `<QuadraticBezierLine>`.

**Step 4:** Add home icon link.

**Step 5:** Commit

```bash
git add -A && git commit -m "feat: filter controls, connection lines, and home navigation"
```

---

### Task 8: Add search functionality

**Files:**
- Modify: `web/src/components/explore/ControlBar.tsx`
- Modify: `web/src/components/explore/ExploreCanvas.tsx`

**Key details:**
- Search icon expands to text input on click
- Real-time filtering: matching nodes brighten and pulse, non-matches fade
- Enter focus-zooms into top match
- Searches across all node types by name

**Step 1:** Add search input to ControlBar with expanding animation.

**Step 2:** Wire search term to canvas — filter nodes, highlight matches.

**Step 3:** Commit

```bash
git add -A && git commit -m "feat: search across all node types with highlight and focus"
```

---

### Task 9: Polish — particles, animations, mobile

**Files:**
- Create: `web/src/components/explore/ParticleField.tsx`
- Modify: various explore components for mobile responsiveness

**Key details:**
- Ambient particle field: ~1800 dim points drifting slowly
- When filter layers are on, particles brighten and drift toward connected philosophy
- Mobile: touch gestures (pinch zoom, tap select), control bar scrollable, info panel slides up from bottom
- Performance: ensure 60fps on mobile by reducing particle count and disabling bloom on low-end devices

**Step 1:** Create `ParticleField.tsx` — instanced points with GPU-driven position drift.

**Step 2:** Wire particle visibility to filter state.

**Step 3:** Add mobile touch handlers and responsive info panel positioning.

**Step 4:** Commit

```bash
git add -A && git commit -m "feat: ambient particles, animations polish, and mobile support"
```

---

### Task 10: Final integration and nav link

**Files:**
- Modify: `web/src/components/nav.tsx` — add "Explore" link
- Run: `cd web && npx playwright test --reporter=list`

**Step 1:** Add "Explore" to the nav bar.

**Step 2:** Run existing tests to make sure nothing is broken.

**Step 3:** Final commit

```bash
git add -A && git commit -m "feat: add Explore link to nav, finalize KG explorer"
```
