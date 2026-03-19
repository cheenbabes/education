# Current Explore State

Last updated after commit `82e0f42` (`feat: refine explore atlas visuals and vector glyph rendering`).

## What was completed

- Shifted `/explore` toward an antique star-atlas direction (watercolor sky, gold-first accents, engraved typography).
- Stabilized map interaction and focus behavior (pan/zoom/focus clarity).
- Reworked the glyph system and added a visual review surface (`/explore/glyph-lab`).
- Improved KG/API handling for data consistency and missing/deduped philosophy visibility.

## Rendering and visual system

- **Background and atmosphere**
  - Watercolor background integrated and retained behind transparent canvas.
  - Atlas guide/ring ornamentation tuned to stay subtle.

- **Typography**
  - Added and wired atlas-appropriate fonts in `web/public/fonts/` and `web/src/app/globals.css`.
  - Philosophy/curriculum/panel text styling tuned for readability and period feel.

- **Color and focus language**
  - Highlight lines and focus accents moved to atlas-safe gold/amber tones.
  - Dimming reduced from overly aggressive levels to preserve context during focus.

## Glyph architecture

- Added semantic glyph infrastructure in `web/src/components/explore/glyphs.ts`.
- Added real-constellation philosophy asset set in `web/public/explore/constellation-philosophy/`.
- Added curated pack and semantic pack assets for experimentation.
- Added `web/src/app/explore/glyph-lab/page.tsx` for side-by-side visual review.

## Sharpness work (anti-grain at zoom)

The prior graininess issue was caused by raster sprites upscaling during zoom. This has now been addressed with vector rendering for core node types:

- `web/src/components/explore/PhilosophyStar.tsx`
  - Philosophy glyphs converted from sprite textures to vector constellations (lines + star points).
  - Uses data in `web/src/components/explore/constellationVectors.ts`.

- `web/src/components/explore/CurriculumMoon.tsx`
  - Curriculum nodes converted from sprite glyphs to vector radial star geometry.
  - Maintains existing interaction behavior (hover, focus, dimming, drift).

- `web/src/components/explore/DetailNodes.tsx`
  - Principles/activities/materials converted to vector glyphs by type.
  - Kept labels, selection pulse, and interaction affordances.

Result: significantly smoother edges when zooming in.

## Interaction and behavior refinements

- `OrbitControls`-based pan/zoom behavior tuned for map-like exploration.
- Curriculum focus now pulses only connected philosophies (not all).
- Focus lines and connected-node emphasis updated for better visual disambiguation.
- Global detail previews are interactive and can open detail context directly.

## Data model and graph notes

- KG detail nodes (`principles`, `activities`, `materials`) are currently keyed by a single `philosophyId` in this UI model.
- In practice, this means detail nodes are philosophy-anchored rather than cross-philosophy shared entities unless the upstream KG model changes.
- Dedupe and missing-philosophy handling was improved between:
  - `kg-service/api/graph_export.py`
  - `web/src/app/api/explore/graph/route.ts`

## Validation status

- `npm run build` passes after the refactors.
- Playwright coverage file exists at `web/tests/explore.spec.ts` and includes watercolor/test-id stability assertions from this iteration.

## Committed vs uncommitted state

- All intended explore changes were committed in `82e0f42`.
- Local machine artifacts were intentionally excluded from commit:
  - `kg-service/.venv311/`
  - `tmp_*`
  - `tmp_data/`

## Suggested next agent tasks

- Visual design pass: replace current vector motifs with curated alternatives from external atlas/engraving sources.
- Build a switchable style preset system (e.g., "engraved minimal", "ornamental atlas", "astronomical manuscript").
- If needed, revisit detail-node semantics only after confirming whether KG should support shared detail entities across philosophies.
