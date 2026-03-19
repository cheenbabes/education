# Knowledge Graph Explorer — Design

## Overview

A full-viewport constellation visualization of the education knowledge graph at `/explore`. Parents can visually explore philosophies, curricula, principles, activities, and materials — discovering how they connect. The spatial layout is data-driven (philosophy dimension scores determine position) but the aesthetic is organic and artistic, like a star map.

## Canvas

- Full-bleed dark canvas (`#0a0a0f`), no shell nav bar
- Small floating home icon top-left, translucent control bar along bottom edge
- Philosophy nodes rendered as softly glowing orbs — radial gradients fading from bright core to transparent, each using its existing `PHILOSOPHY_COLORS`
- Subtle breathing pulse animation; size reflects node richness (principle + activity + material count)
- Spatial positioning uses two dimension axes: `structure` (x-axis: structured left, child-led right) and `modality` (y-axis: academic top, experiential bottom) — no visible axes, grid lines, or labels; pattern emerges naturally
- Ambient particles drift between nodes (principles, activities, materials as dim texture); when a filter layer is toggled on, relevant particles brighten and cluster toward their connected philosophy

## Node Types & Visual Language

**Philosophy stars** — 8 glowing orbs as primary anchors. Thin modern sans-serif labels beneath. Hover expands to one-line description and brightens the orb. Faint ripple rings pulse outward, radius representing total node count.

**Curriculum moons** — Smaller, cooler-toned nodes. Orbit near the philosophy they score highest on. Curricula scoring well on multiple philosophies sit between those stars, pulled by "gravity" from each (position = weighted average of philosophy scores mapped to dimension space). Creates natural neighborhoods.

**Connection lines** — Hidden at rest. On hover/click, thin luminous bezier threads appear connecting node to its relations. Opacity reflects connection strength (0.7 = bright, 0.1 = barely visible). Gentle curves, not straight lines.

**Color language:**
- Each philosophy: its existing color
- Curricula: blended color from top 2 philosophies
- Principles: white
- Activities: warm amber
- Materials: cool blue

## Interaction — Focus Zoom

**Click a philosophy star:**
1. Camera flies toward selected star (~800ms ease-out cubic)
2. Other stars fade to 20% opacity, drift to periphery as distant reference
3. Selected star expands to ~20% of screen, centered slightly left

**The bloom:**
1. Principles emerge as white nodes in a loose arc above
2. Activities appear in amber arc below
3. Materials form blue arc to the right
4. Organic spacing with slight randomness, like petals opening
5. Soft force simulation settles in ~500ms

**Curriculum moons expand** — grow larger, drift into visible orbit ring. Each shows name and tiny sparkline philosophy-score bar. Shared curricula show faint threads toward distant dimmed stars.

**Info card** — translucent glass-morphism panel fades in on right third. Shows philosophy name, full description, stats (principle/activity/material counts), scrollable top-matched curricula with scores. Clicking a curriculum zooms into that node next.

**Back out** — click background or Escape to reverse-animate back to full constellation.

## Filter Controls & Layers

**Control bar** — translucent frosted strip along bottom edge, ~48px tall.

Five toggle pills: **Philosophies** (always on), **Curricula**, **Principles**, **Activities**, **Materials**. Each uses color language (silver, white, amber, blue). Active toggles glow softly. Toggling triggers ~400ms animation of particles brightening/dimming.

**Search** — icon on left of control bar expands to text input. Real-time filtering: matching nodes brighten and pulse, non-matches fade. Works across all node types. Enter focus-zooms into top match.

**Philosophy comparison mode** — shift-click (or long-press) two philosophy stars. Both expand side by side. Shared nodes cluster in center, unique ones stay on their side. Floating stat: "7 shared principles, 4 shared curricula, 12 unique to Charlotte Mason, 8 unique to Classical."

No other controls. The interaction IS the interface.

## Data Pipeline & API

**New endpoint: `GET /api/explore/graph`** returns full graph payload:

```json
{
  "philosophies": [{ "id", "name", "description", "color", "dimensions",
                     "principleCount", "activityCount", "materialCount" }],
  "curricula": [{ "id", "name", "publisher", "philosophyScores", "gradeRange",
                  "prepLevel", "religiousType", "priceRange", "affiliateUrl" }],
  "principles": [{ "id", "name", "description", "philosophyId" }],
  "activities": [{ "id", "name", "description", "indoorOutdoor", "philosophyId" }],
  "materials": [{ "id", "name", "category", "philosophyId" }],
  "edges": [{ "from", "to", "type", "weight" }]
}
```

- Queries both Kuzu (philosophies, principles, activities, materials) and Postgres (curricula)
- Entire graph fetched on page load — pure client-side interaction after
- ~200-300KB payload total (~1,900 nodes + 57 curricula + 8 philosophies)
- Cached with `Cache-Control: max-age=3600`
- Philosophy positions computed client-side from dimension scores
- Curriculum positions = weighted average of connected philosophy positions
- Principle/activity/material positions use lightweight force simulation anchored to parent philosophy

## Technology & Rendering

**React Three Fiber (WebGL)** — the node count (~1,900+), glow effects, smooth zoom, and bezier curves rule out SVG/D3. R3F gives WebGL performance with React's component model.

**Libraries:**
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — helpers (camera controls, text, effects)
- `@react-three/postprocessing` — selective bloom for philosophy star glow
- No D3 dependency — position math is custom

**Scene structure:**
- Single `<Canvas>` filling viewport
- `<PhilosophyStar>` — instanced meshes with custom glow shader
- `<CurriculumMoon>` — smaller instanced meshes, blended color
- `<ParticleField>` — single instanced mesh with ~1,800 points, GPU-driven positions
- `<ConnectionLines>` — rendered on interaction, quadratic bezier via drei `<Line>`
- `<InfoPanel>` — React DOM overlay using drei `<Html>` for glass-morphism card

**Camera:** Orthographic (map feel, not 3D). Zoom is camera position + uniform scale. Text stays crisp at all zoom levels.

**Mobile:** Pinch zoom, tap select, two-finger drag. Control bar pills become scrollable. Info panel slides up from bottom instead of side.
