# Explore: Force-Directed Layout & Vector Glyphs

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static star map layout with a force-directed graph that recenters and rearranges nodes on focus, and upgrade all node glyphs to clean vector art inspired by alchemical/astronomical symbols.

**Architecture:** Add `d3-force` to compute layout positions. A new `useForceLayout` hook runs the simulation to convergence on focus changes and exposes target positions via ExploreContext. All existing components (`PhilosophyStar`, `CurriculumMoon`, `DetailNodes`, `ConnectionLines`) read positions from context and lerp toward targets in `useFrame`. Camera auto-animates to fit the focused cluster. Glyphs are redrawn as Three.js vector geometry (Lines + meshes) — no raster assets.

**Tech Stack:** d3-force, React Three Fiber (v8), @react-three/drei, Three.js, TypeScript, Next.js 14, Playwright

---

## Key Files Reference

| File | Role |
|------|------|
| `web/src/components/explore/useExploreState.ts` | Context + state types (`FocusedNode`, `VisibleLayers`, `ExploreState`) |
| `web/src/components/explore/types.ts` | Data types (`GraphData`, `PhilosophyNode`, `CurriculumNode`, etc.) |
| `web/src/components/explore/positions.ts` | Static positions, `getCurriculumPlacement()`, constellation edges |
| `web/src/components/explore/ExploreCanvas.tsx` | R3F Canvas, camera, controls, renders all child components |
| `web/src/components/explore/PhilosophyStar.tsx` | Philosophy node (constellation vectors, planet sign, label) |
| `web/src/components/explore/CurriculumMoon.tsx` | Curriculum node (starburst glyph, label on hover) |
| `web/src/components/explore/DetailNodes.tsx` | Principle/activity/material nodes + arc positioning |
| `web/src/components/explore/ConnectionLines.tsx` | Lines between focused node and connected nodes |
| `web/src/components/explore/InfoPanel.tsx` | Right sidebar detail panel |
| `web/src/components/explore/ControlBar.tsx` | Bottom bar (filters, search, zoom) |
| `web/src/components/explore/glyphs.ts` | Glyph size constants, PNG paths (to be replaced) |
| `web/src/app/explore/page.tsx` | Page component, state management, data fetch |
| `web/tests/explore.spec.ts` | Playwright tests |

---

### Task 1: Install d3-force

**Files:**
- Modify: `web/package.json`

**Step 1: Install dependencies**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm install d3-force && npm install -D @types/d3-force
```

**Step 2: Verify installation**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && node -e "require('d3-force')" && echo "OK"
```
Expected: `OK`

**Step 3: Verify build still passes**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
```
Expected: Build succeeds

**Step 4: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add web/package.json web/package-lock.json && git commit -m "feat(explore): add d3-force for force-directed layout"
```

---

### Task 2: Create useForceLayout hook

This is the core new module. It takes graph data and focus state, runs a d3-force simulation to convergence, and returns a `Map<string, {x: number, y: number}>` of target positions for all nodes.

**Files:**
- Create: `web/src/components/explore/useForceLayout.ts`

**Step 1: Create the hook**

Create `web/src/components/explore/useForceLayout.ts` with this content:

```typescript
import { useMemo, useRef, useEffect, useState } from "react";
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { GraphData } from "./types";
import { FocusedNode, VisibleLayers } from "./useExploreState";
import {
  PHILOSOPHY_POSITIONS,
  getCurriculumPlacement,
  normalizePhilosophyKey,
} from "./positions";

/** Unique key for a layout node to avoid ID collisions across types. */
function nodeKey(type: string, id: string): string {
  return `${type}:${id}`;
}

interface ForceNode extends SimulationNodeDatum {
  id: string; // nodeKey
  nodeType: "philosophy" | "curriculum" | "principle" | "activity" | "material";
  rawId: string; // original ID
}

interface ForceLink extends SimulationLinkDatum<ForceNode> {
  strength?: number;
}

export interface LayoutPositions {
  /** Map from nodeKey("philosophy", name) or nodeKey("curriculum", id) etc. to target {x, y}. */
  positions: Map<string, { x: number; y: number }>;
  /** Center of the focused cluster (for camera targeting). Null when nothing focused. */
  focusCenter: { x: number; y: number } | null;
  /** Suggested zoom level for the focused view. Null when nothing focused. */
  focusZoom: number | null;
}

/**
 * Compute default (unfocused) positions for all nodes.
 * Philosophies use hand-tuned positions. Curricula use spiral placement.
 * Detail nodes are positioned only when their layer is visible and something is focused.
 */
function getDefaultPositions(graphData: GraphData): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();

  for (const p of graphData.philosophies) {
    const pos = PHILOSOPHY_POSITIONS[p.name];
    if (pos) {
      map.set(nodeKey("philosophy", p.name), { x: pos[0], y: pos[1] });
    }
  }

  for (let i = 0; i < graphData.curricula.length; i++) {
    const c = graphData.curricula[i];
    const placement = getCurriculumPlacement(c.philosophyScores, i);
    map.set(nodeKey("curriculum", c.id), {
      x: placement.position[0],
      y: placement.position[1],
    });
  }

  return map;
}

/**
 * Run d3-force simulation to convergence and return final positions.
 * Called synchronously on focus changes — fast enough for <500 nodes.
 */
function runSimulation(
  graphData: GraphData,
  focusedNode: FocusedNode | null,
  visibleLayers: VisibleLayers,
  defaultPositions: Map<string, { x: number; y: number }>,
): LayoutPositions {
  if (!focusedNode) {
    return { positions: defaultPositions, focusCenter: null, focusZoom: null };
  }

  // Build node list
  const nodes: ForceNode[] = [];
  const nodeMap = new Map<string, ForceNode>();

  const addNode = (type: ForceNode["nodeType"], rawId: string, x: number, y: number) => {
    const key = nodeKey(type, rawId);
    const node: ForceNode = { id: key, nodeType: type, rawId, x, y };
    nodes.push(node);
    nodeMap.set(key, node);
  };

  // Add philosophy nodes
  for (const p of graphData.philosophies) {
    const def = defaultPositions.get(nodeKey("philosophy", p.name));
    addNode("philosophy", p.name, def?.x ?? 0, def?.y ?? 0);
  }

  // Add curriculum nodes
  for (let i = 0; i < graphData.curricula.length; i++) {
    const c = graphData.curricula[i];
    const def = defaultPositions.get(nodeKey("curriculum", c.id));
    addNode("curriculum", c.id, def?.x ?? 0, def?.y ?? 0);
  }

  // Add detail nodes if their layer is visible
  const activePhilosophyId = getActivePhilosophy(focusedNode, graphData);

  if (activePhilosophyId) {
    if (visibleLayers.principles) {
      for (const p of graphData.principles.filter((pr) => pr.philosophyId === activePhilosophyId)) {
        const philPos = defaultPositions.get(nodeKey("philosophy", p.philosophyId));
        addNode("principle", p.id, (philPos?.x ?? 0) + (Math.random() - 0.5) * 2, (philPos?.y ?? 0) + (Math.random() - 0.5) * 2);
      }
    }
    if (visibleLayers.activities) {
      for (const a of graphData.activities.filter((ac) => ac.philosophyId === activePhilosophyId)) {
        const philPos = defaultPositions.get(nodeKey("philosophy", a.philosophyId));
        addNode("activity", a.id, (philPos?.x ?? 0) + (Math.random() - 0.5) * 2, (philPos?.y ?? 0) + (Math.random() - 0.5) * 2);
      }
    }
    if (visibleLayers.materials) {
      for (const m of graphData.materials.filter((ma) => ma.philosophyId === activePhilosophyId)) {
        const philPos = defaultPositions.get(nodeKey("philosophy", m.philosophyId));
        addNode("material", m.id, (philPos?.x ?? 0) + (Math.random() - 0.5) * 2, (philPos?.y ?? 0) + (Math.random() - 0.5) * 2);
      }
    }
  }

  // Build links
  const links: ForceLink[] = [];
  for (const c of graphData.curricula) {
    for (const [rawKey, score] of Object.entries(c.philosophyScores)) {
      const philName = normalizePhilosophyKey(rawKey);
      const s = Number(score);
      if (s > 0.08 && nodeMap.has(nodeKey("philosophy", philName))) {
        links.push({
          source: nodeKey("philosophy", philName),
          target: nodeKey("curriculum", c.id),
          strength: s * 0.3,
        });
      }
    }
  }

  // Detail → philosophy links
  const detailTypes: Array<{ items: { id: string; philosophyId: string }[]; type: string }> = [];
  if (visibleLayers.principles && activePhilosophyId) {
    detailTypes.push({ items: graphData.principles.filter((p) => p.philosophyId === activePhilosophyId), type: "principle" });
  }
  if (visibleLayers.activities && activePhilosophyId) {
    detailTypes.push({ items: graphData.activities.filter((a) => a.philosophyId === activePhilosophyId), type: "activity" });
  }
  if (visibleLayers.materials && activePhilosophyId) {
    detailTypes.push({ items: graphData.materials.filter((m) => m.philosophyId === activePhilosophyId), type: "material" });
  }
  for (const { items, type } of detailTypes) {
    for (const item of items) {
      if (nodeMap.has(nodeKey(type, item.id))) {
        links.push({
          source: nodeKey("philosophy", item.philosophyId),
          target: nodeKey(type, item.id),
          strength: 0.15,
        });
      }
    }
  }

  // Determine focused node key and connected keys
  const focusKey = nodeKey(focusedNode.type, focusedNode.id);
  const connectedKeys = new Set<string>();
  for (const link of links) {
    const sKey = typeof link.source === "string" ? link.source : (link.source as ForceNode).id;
    const tKey = typeof link.target === "string" ? link.target : (link.target as ForceNode).id;
    if (sKey === focusKey) connectedKeys.add(tKey);
    if (tKey === focusKey) connectedKeys.add(sKey);
  }

  // Pin focused node to center
  const focusNode = nodeMap.get(focusKey);
  if (focusNode) {
    focusNode.fx = 0;
    focusNode.fy = 0;
  }

  // Configure forces
  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink<ForceNode, ForceLink>(links)
        .id((d) => d.id)
        .distance((link) => {
          const sKey = typeof link.source === "object" ? (link.source as ForceNode).id : String(link.source);
          const tKey = typeof link.target === "object" ? (link.target as ForceNode).id : String(link.target);
          // Connected nodes stay closer
          if (sKey === focusKey || tKey === focusKey) return 3;
          if (connectedKeys.has(sKey) || connectedKeys.has(tKey)) return 5;
          return 10;
        })
        .strength((link) => (link as ForceLink).strength ?? 0.1),
    )
    .force("charge", forceManyBody().strength((d) => {
      const fd = d as ForceNode;
      if (fd.id === focusKey) return -200;
      if (connectedKeys.has(fd.id)) return -80;
      return -40;
    }))
    .force("collide", forceCollide<ForceNode>().radius((d) => {
      if (d.nodeType === "philosophy") return 1.8;
      if (d.nodeType === "curriculum") return 1.0;
      return 0.5;
    }).iterations(2))
    .force("center", forceCenter(0, 0).strength(0.02))
    // Pull unconnected nodes toward periphery
    .force("x", forceX<ForceNode>().x((d) => {
      if (d.id === focusKey) return 0;
      if (connectedKeys.has(d.id)) return 0;
      // Push unconnected to their default positions scaled outward
      const def = defaultPositions.get(d.id);
      return (def?.x ?? 0) * 1.5;
    }).strength((d) => {
      if (d.id === focusKey) return 1;
      if (connectedKeys.has(d.id)) return 0.05;
      return 0.12;
    }))
    .force("y", forceY<ForceNode>().y((d) => {
      if (d.id === focusKey) return 0;
      if (connectedKeys.has(d.id)) return 0;
      const def = defaultPositions.get(d.id);
      return (def?.y ?? 0) * 1.5;
    }).strength((d) => {
      if (d.id === focusKey) return 1;
      if (connectedKeys.has(d.id)) return 0.05;
      return 0.12;
    }))
    .stop();

  // Run to convergence
  const iterations = 300;
  for (let i = 0; i < iterations; i++) {
    sim.tick();
  }

  // Extract final positions
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
  }

  // Compute focus cluster bounding box for camera
  const clusterNodes = [focusKey, ...connectedKeys]
    .map((k) => positions.get(k))
    .filter(Boolean) as { x: number; y: number }[];

  let focusCenter: { x: number; y: number } | null = null;
  let focusZoom: number | null = null;

  if (clusterNodes.length > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of clusterNodes) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    focusCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const spread = Math.max(maxX - minX, maxY - minY, 4);
    // Zoom inversely proportional to spread. Tuned so ~10 unit spread = zoom 60.
    focusZoom = Math.min(120, Math.max(40, 600 / spread));
  }

  return { positions, focusCenter, focusZoom };
}

/** Resolve which philosophy ID is "active" for a given focus target. */
function getActivePhilosophy(focusedNode: FocusedNode, graphData: GraphData): string | null {
  if (focusedNode.type === "philosophy") return focusedNode.id;
  if (focusedNode.type === "curriculum") {
    const c = graphData.curricula.find((c) => c.id === focusedNode.id);
    if (!c) return null;
    let topKey: string | null = null;
    let topScore = -Infinity;
    for (const [key, score] of Object.entries(c.philosophyScores)) {
      const s = Number(score);
      if (s > topScore) {
        topScore = s;
        topKey = normalizePhilosophyKey(key);
      }
    }
    return topKey;
  }
  if (focusedNode.type === "principle") {
    return graphData.principles.find((p) => p.id === focusedNode.id)?.philosophyId ?? null;
  }
  if (focusedNode.type === "activity") {
    return graphData.activities.find((a) => a.id === focusedNode.id)?.philosophyId ?? null;
  }
  if (focusedNode.type === "material") {
    return graphData.materials.find((m) => m.id === focusedNode.id)?.philosophyId ?? null;
  }
  return null;
}

/**
 * Main hook. Returns target positions for all nodes in the explore graph.
 * Re-runs the simulation when focus or visible layers change.
 */
export function useForceLayout(
  graphData: GraphData,
  focusedNode: FocusedNode | null,
  visibleLayers: VisibleLayers,
): LayoutPositions {
  const defaultPositions = useMemo(() => getDefaultPositions(graphData), [graphData]);

  const layout = useMemo(
    () => runSimulation(graphData, focusedNode, visibleLayers, defaultPositions),
    [graphData, focusedNode, visibleLayers, defaultPositions],
  );

  return layout;
}

export { nodeKey };
```

**Step 2: Verify build**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
```
Expected: Build succeeds (hook is created but not yet imported anywhere)

**Step 3: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add web/src/components/explore/useForceLayout.ts && git commit -m "feat(explore): add useForceLayout hook with d3-force simulation"
```

---

### Task 3: Wire layout positions into ExploreContext

Add `LayoutPositions` to the context so all child components can read target positions. The page component runs the hook and passes results down.

**Files:**
- Modify: `web/src/components/explore/useExploreState.ts` — add `layoutPositions` to `ExploreState`
- Modify: `web/src/app/explore/page.tsx` — call `useForceLayout`, pass to context
- Modify: `web/src/components/explore/ExploreCanvas.tsx` — accept and provide layout positions

**Step 1: Add layoutPositions to ExploreState**

In `web/src/components/explore/useExploreState.ts`, add the import and field:

```typescript
import { LayoutPositions } from "./useForceLayout";
```

Add to `ExploreState` interface:
```typescript
  layoutPositions: LayoutPositions;
```

**Step 2: Update page.tsx to compute layout and pass it**

In `web/src/app/explore/page.tsx`:

Add import:
```typescript
import { useForceLayout } from "@/components/explore/useForceLayout";
```

After the existing state declarations (around line 30), add:
```typescript
const layoutPositions = useForceLayout(data ?? { philosophies: [], curricula: [], principles: [], activities: [], materials: [] }, focusedNode, visibleLayers);
```

Update the `contextValue` memo to include `layoutPositions`:
```typescript
const contextValue = useMemo<ExploreState | null>(
  () =>
    data
      ? {
          focusedNode,
          setFocusedNode,
          graphData: data,
          visibleLayers,
          setVisibleLayers,
          searchTerm,
          setSearchTerm,
          layoutPositions,
        }
      : null,
  [focusedNode, data, visibleLayers, searchTerm, layoutPositions],
);
```

**Step 3: Update ExploreCanvas to pass layoutPositions through its internal context**

In `web/src/components/explore/ExploreCanvas.tsx`, the `contextValue` memo (around line 307) already constructs an `ExploreState`. Add `layoutPositions` from props.

Add to `ExploreCanvasProps`:
```typescript
import { LayoutPositions } from "./useForceLayout";
// ...
layoutPositions: LayoutPositions;
```

Add to the props destructure and include in the internal context:
```typescript
layoutPositions,
```

In the `contextValue` memo:
```typescript
layoutPositions,
```

**Step 4: Pass layoutPositions from page.tsx to ExploreCanvas**

In `page.tsx`, add `layoutPositions={layoutPositions}` to the `<ExploreCanvas>` JSX.

Note: the page provides context for DOM overlays (InfoPanel, ControlBar), while ExploreCanvas re-provides it inside the R3F reconciler. Both need the field.

**Step 5: Verify build**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
```
Expected: Build succeeds

**Step 6: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): wire useForceLayout into ExploreContext"
```

---

### Task 4: Update PhilosophyStar to use layout positions

Replace the static `PHILOSOPHY_POSITIONS` lookup with animated positions from the layout. Use `useFrame` lerp so transitions are smooth.

**Files:**
- Modify: `web/src/components/explore/PhilosophyStar.tsx`

**Step 1: Import nodeKey and read layout positions**

Add import:
```typescript
import { nodeKey } from "./useForceLayout";
```

**Step 2: Replace the static position computation**

Currently (around line 74-87), the `position` is computed from `PHILOSOPHY_POSITIONS`. Replace with:

```typescript
const { position: staticPosition, phaseOffset, baseScale } = useMemo(() => {
  const pos = PHILOSOPHY_POSITIONS[philosophy.name] || [0, 0];
  const totalNodes =
    philosophy.principleCount +
    philosophy.activityCount +
    philosophy.materialCount;
  const phase = index * 1.37;
  return {
    position: [pos[0], pos[1], 0] as [number, number, number],
    phaseOffset: phase,
    baseScale: GLYPH_SIZES.philosophyBase + Math.log(totalNodes + 1) * 0.09,
  };
}, [philosophy, index]);

// Read target from force layout
const layoutTarget = layoutPositions.positions.get(nodeKey("philosophy", philosophy.name));
const targetX = layoutTarget?.x ?? staticPosition[0];
const targetY = layoutTarget?.y ?? staticPosition[1];
```

Where `layoutPositions` comes from `useExploreState()`:
```typescript
const { focusedNode, setFocusedNode, searchTerm, graphData, layoutPositions } = useExploreState();
```

**Step 3: Animate position in useFrame**

In the existing `useFrame` callback, add position lerp at the top:

```typescript
if (groupRef.current) {
  groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
  groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.08;
}
```

Change the JSX `position` prop on the root `<group>` from `position={position}` to just an initial value. Actually, since we're animating in useFrame, set the initial position but let useFrame take over:

```tsx
<group ref={groupRef} position={[targetX, targetY, 0]}>
```

**Step 4: Verify build**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
```

**Step 5: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): animate PhilosophyStar positions via force layout"
```

---

### Task 5: Update CurriculumMoon to use layout positions

Same pattern as PhilosophyStar — read from layout, lerp in useFrame.

**Files:**
- Modify: `web/src/components/explore/CurriculumMoon.tsx`

**Step 1: Import and read layout positions**

```typescript
import { nodeKey } from "./useForceLayout";
// in component:
const { focusedNode, setFocusedNode, searchTerm, graphData, layoutPositions } = useExploreState();
```

**Step 2: Replace position source**

The current `position` comes from `getCurriculumPlacement()` (line 37-39). Keep it as fallback, but read target from layout:

```typescript
const layoutTarget = layoutPositions.positions.get(nodeKey("curriculum", curriculum.id));
const targetPos: [number, number, number] = layoutTarget
  ? [layoutTarget.x, layoutTarget.y, 0]
  : placement.position;
```

**Step 3: Animate in useFrame**

Update the existing `useFrame` to lerp position:

```typescript
if (nodeRef.current) {
  const tx = targetPos[0] + Math.sin(t * 0.3 + phaseOffset) * 0.035;
  const ty = targetPos[1] + Math.cos(t * 0.25 + phaseOffset * 1.3) * 0.035;
  nodeRef.current.position.x += (tx - nodeRef.current.position.x) * 0.08;
  nodeRef.current.position.y += (ty - nodeRef.current.position.y) * 0.08;
}
```

**Step 4: Show labels when in focused cluster**

Add logic: if this curriculum is connected to the focused node, always show label:

```typescript
const isInFocusedCluster = focusedNode !== null && (isCurriculumFocused || isConnectedToFocused);
const showLabel = hovered || shouldHighlight || (!!searchTerm && matchesSearch) || isInFocusedCluster;
```

**Step 5: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): animate CurriculumMoon via force layout, show labels in cluster"
```

---

### Task 6: Update DetailNodes to use layout positions

Detail nodes currently compute arc positions in a `useMemo`. Replace with layout-provided positions.

**Files:**
- Modify: `web/src/components/explore/DetailNodes.tsx`

**Step 1: Import and read layout**

```typescript
import { nodeKey } from "./useForceLayout";
```

In the component, get `layoutPositions` from `useExploreState()`.

**Step 2: Replace arcPositions with layout positions**

In the `details` useMemo (line 298-350), instead of computing arc positions, look up each detail node's position from the layout:

```typescript
const principlePositions = principles.map((p) => {
  const lt = layoutPositions.positions.get(nodeKey("principle", p.id));
  return lt ? [lt.x, lt.y, 0] as [number, number, number] : arcFallback(/* ... */);
});
```

Keep `arcPositions` as a fallback for when layout doesn't have the node (e.g. layer was just toggled on and layout hasn't recomputed yet).

**Step 3: Always show labels for detail nodes in focused state**

Since force layout spaces them out, set `showLabel={true}` for all detail nodes when a philosophy is focused (remove the `i < 7` / `i < 6` limits).

**Step 4: Animate DetailDot positions**

In the `DetailDot` component, the position is currently static (set on the `<group>`). Add a ref and lerp in useFrame like the other components.

**Step 5: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): detail nodes use force layout positions"
```

---

### Task 7: Update ConnectionLines to use layout positions

ConnectionLines currently recomputes philosophy/curriculum positions internally. It should read from layout.

**Files:**
- Modify: `web/src/components/explore/ConnectionLines.tsx`

**Step 1: Read layout positions**

```typescript
const { focusedNode, graphData, layoutPositions } = useExploreState();
```

**Step 2: Replace position lookups**

Everywhere the file calls `PHILOSOPHY_POSITIONS[philosophyId]` or `getCurriculumPlacement(...)`, replace with:

```typescript
const philPos = layoutPositions.positions.get(nodeKey("philosophy", philosophyId));
const philXY: [number, number, number] = philPos ? [philPos.x, philPos.y, 0] : [center[0], center[1], 0];
```

Similarly for curricula:
```typescript
const cLayout = layoutPositions.positions.get(nodeKey("curriculum", curriculum.id));
const cPos: [number, number, number] = cLayout ? [cLayout.x, cLayout.y, 0] : getCurriculumPlacement(curriculum.philosophyScores, i).position;
```

**Step 3: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): ConnectionLines read from force layout"
```

---

### Task 8: Add camera animation to focus cluster

When a node is focused, smoothly animate the camera to center on the focused cluster and adjust zoom.

**Files:**
- Modify: `web/src/components/explore/ExploreCanvas.tsx`

**Step 1: Add a CameraAnimator component**

Replace the removed `CameraController` with a new one that reads from layout:

```typescript
function CameraAnimator({
  layoutPositions,
  controlsRef,
}: {
  layoutPositions: LayoutPositions;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 10));
  const targetZoom = useRef(45);

  useEffect(() => {
    if (layoutPositions.focusCenter) {
      targetPos.current.set(layoutPositions.focusCenter.x, layoutPositions.focusCenter.y, 10);
      targetZoom.current = layoutPositions.focusZoom ?? 70;
    } else {
      targetPos.current.set(0, 0, 10);
      targetZoom.current = 45;
    }
  }, [layoutPositions.focusCenter, layoutPositions.focusZoom]);

  useFrame(() => {
    const ortho = camera as THREE.OrthographicCamera;
    // Lerp position
    camera.position.x += (targetPos.current.x - camera.position.x) * 0.06;
    camera.position.y += (targetPos.current.y - camera.position.y) * 0.06;
    // Lerp zoom
    ortho.zoom += (targetZoom.current - ortho.zoom) * 0.06;
    ortho.updateProjectionMatrix();
    controlsRef.current?.target.set(camera.position.x, camera.position.y, 0);
    controlsRef.current?.update?.();
  });

  return null;
}
```

**Step 2: Add CameraAnimator to the Canvas tree**

Inside the `<ExploreContext.Provider>`, add:
```tsx
<CameraAnimator layoutPositions={layoutPositions} controlsRef={controlsRef} />
```

Import `LayoutPositions` from `./useForceLayout` and read it from props.

**Step 3: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): camera animates to focused cluster center"
```

---

### Task 9: Upgrade curriculum glyph to ringed planet

Replace the starburst (circle + radiating lines) with a Saturn-inspired ringed planet drawn in vector geometry.

**Files:**
- Modify: `web/src/components/explore/CurriculumMoon.tsx`

**Step 1: Replace the glyph rendering**

Replace the current glyph group (the `<group ref={glyphRef}>` containing the halo circle, ray lines, and center dot — roughly lines 124-171) with:

```tsx
<group ref={glyphRef} scale={[GLYPH_SIZES.curriculumBase, GLYPH_SIZES.curriculumBase, 1]}>
  {/* Planet body — filled circle */}
  <mesh position={[0, 0, 0.02]}>
    <circleGeometry args={[0.16, 32]} />
    <meshBasicMaterial
      color={color}
      transparent
      opacity={targetOpacity}
      depthWrite={false}
      toneMapped={false}
    />
  </mesh>
  {/* Orbital ring — tilted ellipse */}
  <Line
    points={Array.from({ length: 49 }, (_, i) => {
      const t = (i / 48) * Math.PI * 2;
      return [Math.cos(t) * 0.32, Math.sin(t) * 0.09, 0.03] as [number, number, number];
    })}
    color={color}
    lineWidth={1.1}
    transparent
    opacity={lineOpacity}
    depthWrite={false}
    toneMapped={false}
  />
  {/* Outer glow halo */}
  <mesh position={[0, 0, 0.01]}>
    <circleGeometry args={[0.36, 40]} />
    <meshBasicMaterial
      color={color}
      transparent
      opacity={haloOpacity}
      depthWrite={false}
      toneMapped={false}
    />
  </mesh>
</group>
```

**Step 2: Verify build and visually check at localhost:3456/explore**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): curriculum glyph upgraded to ringed planet vector"
```

---

### Task 10: Upgrade detail node glyphs

Replace the current glyphs (ring+dot, diamond, square+cross) with cleaner alchemical-inspired symbols.

**Files:**
- Modify: `web/src/components/explore/DetailNodes.tsx`

**Step 1: Replace principle glyph (radiant sun)**

Replace the existing principle rendering (lines 121-143) with:

```tsx
{nodeType === "principle" && (
  <>
    {/* Sun circle */}
    <mesh position={[0, 0, 0.02]}>
      <circleGeometry args={[0.1, 24]} />
      <meshBasicMaterial color={color} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
    </mesh>
    {/* 8 rays radiating outward */}
    {Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const inner: [number, number, number] = [Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0.03];
      const outer: [number, number, number] = [Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0.03];
      return (
        <Line key={`ray-${i}`} points={[inner, outer]} color={color} lineWidth={0.8}
          transparent opacity={targetOpacity * 0.85} depthWrite={false} toneMapped={false} />
      );
    })}
  </>
)}
```

**Step 2: Replace activity glyph (crossed arrows)**

Replace lines 145-166 with:

```tsx
{nodeType === "activity" && (
  <>
    {/* Vertical arrow */}
    <Line points={[[0, -0.2, 0.03], [0, 0.2, 0.03]]} color={color} lineWidth={0.9}
      transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
    {/* Horizontal arrow */}
    <Line points={[[-0.2, 0, 0.03], [0.2, 0, 0.03]]} color={color} lineWidth={0.9}
      transparent opacity={targetOpacity} depthWrite={false} toneMapped={false} />
    {/* Arrow tips (4 small chevrons) */}
    <Line points={[[-0.06, 0.16, 0.03], [0, 0.22, 0.03], [0.06, 0.16, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
    <Line points={[[-0.06, -0.16, 0.03], [0, -0.22, 0.03], [0.06, -0.16, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
    <Line points={[[0.16, -0.06, 0.03], [0.22, 0, 0.03], [0.16, 0.06, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
    <Line points={[[-0.16, -0.06, 0.03], [-0.22, 0, 0.03], [-0.16, 0.06, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
  </>
)}
```

**Step 3: Replace material glyph (circled cross / earth symbol)**

Replace lines 168-199 with:

```tsx
{nodeType === "material" && (
  <>
    {/* Outer circle */}
    <Line
      points={Array.from({ length: 33 }, (_, i) => {
        const t = (i / 32) * Math.PI * 2;
        return [Math.cos(t) * 0.18, Math.sin(t) * 0.18, 0.03] as [number, number, number];
      })}
      color={color} lineWidth={0.9} transparent opacity={targetOpacity} depthWrite={false} toneMapped={false}
    />
    {/* Vertical line through circle */}
    <Line points={[[0, -0.18, 0.03], [0, 0.18, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
    {/* Horizontal line through circle */}
    <Line points={[[-0.18, 0, 0.03], [0.18, 0, 0.03]]} color={color} lineWidth={0.7}
      transparent opacity={targetOpacity * 0.8} depthWrite={false} toneMapped={false} />
  </>
)}
```

**Step 4: Remove the old dark background circle**

Remove the `<mesh>` with `circleGeometry args={[0.28, 18]}` and `color="#0f0b08"` (lines 111-120). The new glyphs don't need an opaque backing.

**Step 5: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): upgrade detail glyphs to alchemical vector symbols"
```

---

### Task 11: Update ConstellationLines for layout positions

The `ConstellationLines` component (inside ExploreCanvas.tsx) draws bezier curves between philosophy positions. It needs to read positions from the layout.

**Files:**
- Modify: `web/src/components/explore/ExploreCanvas.tsx`

**Step 1: Update ConstellationLines to accept layout positions**

Change the `ConstellationLines` function to read positions from the layout instead of `PHILOSOPHY_POSITIONS`:

```typescript
function ConstellationLines({
  philosophyNames,
  focusActive,
  layoutPositions,
}: {
  philosophyNames: Set<string>;
  focusActive: boolean;
  layoutPositions: LayoutPositions;
}) {
  const lines = useMemo(() => {
    return CONSTELLATION_EDGES.map(([a, b]) => {
      if (!philosophyNames.has(a) || !philosophyNames.has(b)) return null;
      const posALayout = layoutPositions.positions.get(nodeKey("philosophy", a));
      const posBLayout = layoutPositions.positions.get(nodeKey("philosophy", b));
      const posA = posALayout ? [posALayout.x, posALayout.y] : PHILOSOPHY_POSITIONS[a];
      const posB = posBLayout ? [posBLayout.x, posBLayout.y] : PHILOSOPHY_POSITIONS[b];
      if (!posA || !posB) return null;
      // ... rest of bezier logic unchanged, using posA/posB ...
    }).filter(Boolean);
  }, [philosophyNames, layoutPositions.positions]);
  // ...
}
```

Note: The constellation lines will now move with the philosophies during focus transitions. This creates a nice "living graph" effect.

**Step 2: Pass layoutPositions prop in JSX**

```tsx
<ConstellationLines
  philosophyNames={presentPhilosophyNames}
  focusActive={focusedNode !== null}
  layoutPositions={layoutPositions}
/>
```

**Step 3: Verify build, commit**

```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -5
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): constellation lines follow force layout positions"
```

---

### Task 12: Update Playwright tests

The existing tests mock the graph API and check for controls/canvas visibility. They should still pass. We may need to update assertions if layout changes affect timing.

**Files:**
- Modify: `web/tests/explore.spec.ts`

**Step 1: Run existing tests**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npx playwright test tests/explore.spec.ts --reporter=list 2>&1
```

**Step 2: Fix any failures**

The most likely issue is timing — the force layout computation adds a small delay. If tests fail, increase timeout or add a `waitForTimeout`. The mock data is small (2 philosophies, 1 curriculum) so the simulation should be near-instant.

**Step 3: Add a test for focus re-centering**

```typescript
test("focus on philosophy re-centers layout", async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await mockGraph(page);
  await page.goto(EXPLORE_URL);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });

  // Search and focus on montessori
  await page.getByLabel("Toggle search").click();
  const searchInput = page.locator('input[placeholder="Search nodes..."]');
  await searchInput.fill("montessori");
  await searchInput.press("Enter");

  // Info panel should appear
  await expect(page.getByText("Montessori Inspired")).toBeVisible({ timeout: 7000 });

  // Press Escape to unfocus
  await page.keyboard.press("Escape");
  // Panel should hide
  await expect(page.getByText("Montessori Inspired")).not.toBeVisible({ timeout: 3000 });

  await browser.close();
});
```

**Step 4: Commit**

```bash
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "test(explore): update and add tests for force layout"
```

---

### Task 13: Final verification

**Step 1: Full build**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npm run build 2>&1 | tail -10
```
Expected: Build succeeds with no errors.

**Step 2: Run all Playwright tests**

Run:
```bash
cd /Users/ebaibourine/github/edu-app/web && npx playwright test --reporter=list 2>&1
```
Expected: All tests pass.

**Step 3: Manual smoke test**

Start dev server and visually verify at `http://localhost:3456/explore`:
1. Default view: philosophies at their atlas positions, curricula scattered around
2. Click a philosophy: it moves to center, connected curricula arrange around it, others fade to periphery
3. Camera smoothly animates to the cluster
4. Labels visible on clustered nodes
5. Curriculum nodes render as ringed planets (not starbursts)
6. Detail nodes (toggle Principles/Activities/Materials) render as sun/arrows/cross glyphs
7. Escape returns to overview with smooth animation
8. Zoom in — everything stays sharp (no graininess)
9. Click a curriculum — it centers with its connected philosophies

**Step 4: Commit final state**

```bash
cd /Users/ebaibourine/github/edu-app && git add -u && git commit -m "feat(explore): force-directed layout and vector glyphs complete"
```
