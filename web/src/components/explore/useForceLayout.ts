"use client";

import { useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { GraphData } from "./types";
import { FocusedNode, VisibleLayers } from "./useExploreState";
import {
  PHILOSOPHY_POSITIONS,
  normalizePhilosophyKey,
  getCurriculumPlacement,
} from "./positions";

// ---------------------------------------------------------------------------
// Public helpers & types
// ---------------------------------------------------------------------------

/** Composite key to avoid id collisions across node types. */
export function nodeKey(
  type: "philosophy" | "curriculum" | "principle" | "activity" | "material",
  id: string,
): string {
  return `${type}:${id}`;
}

export interface LayoutPositions {
  positions: Map<string, { x: number; y: number }>;
  focusCenter: { x: number; y: number } | null;
  focusZoom: number | null;
}

// ---------------------------------------------------------------------------
// Internal simulation node type
// ---------------------------------------------------------------------------

interface SimNode extends SimulationNodeDatum {
  id: string; // composite nodeKey
  nodeType: "philosophy" | "curriculum" | "principle" | "activity" | "material";
  defaultX: number;
  defaultY: number;
  role: "focused" | "connected" | "other";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve which philosophy is "active" for any focused node type.
 * - philosophy  -> its own key
 * - curriculum  -> top-scoring philosophy
 * - principle / activity / material -> their philosophyId
 */
export function getActivePhilosophy(
  focusedNode: FocusedNode,
  graphData: GraphData,
): string | null {
  switch (focusedNode.type) {
    case "philosophy":
      return focusedNode.id;

    case "curriculum": {
      const curr =
        graphData.curricula.find((c) => c.id === focusedNode.id) ||
        (focusedNode.curriculumId
          ? graphData.curricula.find((c) => c.id === focusedNode.curriculumId)
          : null);
      if (!curr) return null;
      let topKey: string | null = null;
      let topScore = -Infinity;
      for (const [rawKey, rawVal] of Object.entries(
        curr.philosophyScores || {},
      )) {
        const score = Number(rawVal);
        if (Number.isFinite(score) && score > topScore) {
          topScore = score;
          topKey = normalizePhilosophyKey(rawKey);
        }
      }
      return topKey;
    }

    case "principle": {
      const p = graphData.principles.find((n) => n.id === focusedNode.id);
      return p ? p.philosophyId : focusedNode.philosophyId ?? null;
    }

    case "activity": {
      const a = graphData.activities.find((n) => n.id === focusedNode.id);
      return a ? a.philosophyId : focusedNode.philosophyId ?? null;
    }

    case "material": {
      const m = graphData.materials.find((n) => n.id === focusedNode.id);
      return m ? m.philosophyId : focusedNode.philosophyId ?? null;
    }

    default:
      return null;
  }
}

/** Compute default (unfocused) positions for every renderable node. */
function computeDefaultPositions(graphData: GraphData): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Philosophies — hand-tuned positions
  for (const p of graphData.philosophies) {
    const key = normalizePhilosophyKey(p.name);
    const pos = PHILOSOPHY_POSITIONS[key];
    if (pos) {
      positions.set(nodeKey("philosophy", key), { x: pos[0], y: pos[1] });
    }
  }

  // Curricula — weighted placement via getCurriculumPlacement
  graphData.curricula.forEach((c, i) => {
    const { position } = getCurriculumPlacement(c.philosophyScores, i);
    positions.set(nodeKey("curriculum", c.id), { x: position[0], y: position[1] });
  });

  // Detail nodes — ring around their parent philosophy
  const detailGroups: Array<{
    type: "principle" | "activity" | "material";
    items: Array<{ id: string; philosophyId: string }>;
    ringRadius: number;
  }> = [
    { type: "principle", items: graphData.principles, ringRadius: 2.5 },
    { type: "activity", items: graphData.activities, ringRadius: 3.5 },
    { type: "material", items: graphData.materials, ringRadius: 4.5 },
  ];

  for (const group of detailGroups) {
    // Group by philosophy for angular distribution
    const byPhil: Record<string, Array<{ id: string }>> = {};
    for (const item of group.items) {
      const philKey = normalizePhilosophyKey(item.philosophyId);
      if (!byPhil[philKey]) byPhil[philKey] = [];
      byPhil[philKey].push(item);
    }

    for (const philKey of Object.keys(byPhil)) {
      const items = byPhil[philKey];
      const philPos = PHILOSOPHY_POSITIONS[philKey];
      if (!philPos) continue;
      items.forEach((item, idx) => {
        const angle = (2 * Math.PI * idx) / Math.max(items.length, 1);
        positions.set(nodeKey(group.type, item.id), {
          x: philPos[0] + Math.cos(angle) * group.ringRadius,
          y: philPos[1] + Math.sin(angle) * group.ringRadius,
        });
      });
    }
  }

  return positions;
}

/** Determine which nodes are "connected" to the focused node. */
function getConnectedKeys(
  focusedNode: FocusedNode,
  graphData: GraphData,
): Set<string> {
  const connected = new Set<string>();

  switch (focusedNode.type) {
    case "philosophy": {
      // Connected: curriculum placements that orbit this philosophy (score >= 0.30)
      if (graphData.curriculumPlacements) {
        for (const p of graphData.curriculumPlacements) {
          if (p.philosophyName === focusedNode.id) {
            connected.add(nodeKey("curriculum", p.placementId));
          }
        }
      } else {
        // Fallback to old model
        for (const c of graphData.curricula) {
          for (const [rawKey, rawVal] of Object.entries(c.philosophyScores || {})) {
            const score = Number(rawVal);
            if (
              Number.isFinite(score) &&
              score >= 0.30 &&
              normalizePhilosophyKey(rawKey) === focusedNode.id
            ) {
              connected.add(nodeKey("curriculum", c.id));
            }
          }
        }
      }
      // Detail nodes for this philosophy
      for (const p of graphData.principles) {
        if (normalizePhilosophyKey(p.philosophyId) === focusedNode.id) {
          connected.add(nodeKey("principle", p.id));
        }
      }
      for (const a of graphData.activities) {
        if (normalizePhilosophyKey(a.philosophyId) === focusedNode.id) {
          connected.add(nodeKey("activity", a.id));
        }
      }
      for (const m of graphData.materials) {
        if (normalizePhilosophyKey(m.philosophyId) === focusedNode.id) {
          connected.add(nodeKey("material", m.id));
        }
      }
      break;
    }

    case "curriculum": {
      // Connected: philosophies this curriculum scores on
      const curr =
        graphData.curricula.find((c) => c.id === focusedNode.id) ||
        (focusedNode.curriculumId
          ? graphData.curricula.find((c) => c.id === focusedNode.curriculumId)
          : null);
      if (curr) {
        for (const [rawKey, rawVal] of Object.entries(curr.philosophyScores || {})) {
          const score = Number(rawVal);
          if (Number.isFinite(score) && score > 0) {
            connected.add(nodeKey("philosophy", normalizePhilosophyKey(rawKey)));
          }
        }
      }
      break;
    }

    case "principle":
    case "activity":
    case "material": {
      // Connected: the parent philosophy + sibling detail nodes
      const activePhil = getActivePhilosophy(focusedNode, graphData);
      if (activePhil) {
        connected.add(nodeKey("philosophy", activePhil));
        // Sibling details
        for (const p of graphData.principles) {
          if (normalizePhilosophyKey(p.philosophyId) === activePhil) {
            connected.add(nodeKey("principle", p.id));
          }
        }
        for (const a of graphData.activities) {
          if (normalizePhilosophyKey(a.philosophyId) === activePhil) {
            connected.add(nodeKey("activity", a.id));
          }
        }
        for (const m of graphData.materials) {
          if (normalizePhilosophyKey(m.philosophyId) === activePhil) {
            connected.add(nodeKey("material", m.id));
          }
        }
      }
      break;
    }
  }

  return connected;
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useForceLayout(
  graphData: GraphData,
  focusedNode: FocusedNode | null,
  visibleLayers: VisibleLayers,
): LayoutPositions {
  return useMemo(() => {
    const defaultPositions = computeDefaultPositions(graphData);

    // --- No focus: return static defaults ---
    if (!focusedNode) {
      return {
        positions: defaultPositions,
        focusCenter: null,
        focusZoom: null,
      };
    }

    // --- Focused: build simulation nodes & links ---
    const focusedKey = nodeKey(focusedNode.type, focusedNode.id);
    const connectedKeys = getConnectedKeys(focusedNode, graphData);
    const activePhilosophy = getActivePhilosophy(focusedNode, graphData);

    // Decide which detail layers to include
    const includeDetails = activePhilosophy != null;

    // Build node list
    const simNodes: SimNode[] = [];
    const nodeIndex = new Map<string, number>(); // key -> array index

    const addNode = (
      key: string,
      nodeType: SimNode["nodeType"],
      defaultX: number,
      defaultY: number,
    ) => {
      const role: SimNode["role"] =
        key === focusedKey
          ? "focused"
          : connectedKeys.has(key)
            ? "connected"
            : "other";
      const idx = simNodes.length;
      nodeIndex.set(key, idx);
      simNodes.push({
        id: key,
        nodeType,
        defaultX,
        defaultY,
        role,
        // d3 initial position
        x: key === focusedKey ? 0 : defaultX,
        y: key === focusedKey ? 0 : defaultY,
      });
    };

    // Always include philosophies
    for (const p of graphData.philosophies) {
      const key = normalizePhilosophyKey(p.name);
      const nk = nodeKey("philosophy", key);
      const def = defaultPositions.get(nk);
      if (def) addNode(nk, "philosophy", def.x, def.y);
    }

    // Always include curricula
    for (const c of graphData.curricula) {
      const nk = nodeKey("curriculum", c.id);
      const def = defaultPositions.get(nk);
      if (def) addNode(nk, "curriculum", def.x, def.y);
    }

    // Include detail nodes only if their layer is visible AND a philosophy is active
    if (includeDetails) {
      if (visibleLayers.principles) {
        for (const p of graphData.principles) {
          const nk = nodeKey("principle", p.id);
          const def = defaultPositions.get(nk);
          if (def) addNode(nk, "principle", def.x, def.y);
        }
      }
      if (visibleLayers.activities) {
        for (const a of graphData.activities) {
          const nk = nodeKey("activity", a.id);
          const def = defaultPositions.get(nk);
          if (def) addNode(nk, "activity", def.x, def.y);
        }
      }
      if (visibleLayers.materials) {
        for (const m of graphData.materials) {
          const nk = nodeKey("material", m.id);
          const def = defaultPositions.get(nk);
          if (def) addNode(nk, "material", def.x, def.y);
        }
      }
    }

    // If the focused node wasn't found in the graph, fall back to defaults
    if (!nodeIndex.has(focusedKey)) {
      return {
        positions: defaultPositions,
        focusCenter: null,
        focusZoom: null,
      };
    }

    // Build links: focused <-> connected
    const simLinks: SimulationLinkDatum<SimNode>[] = [];
    const focusIdx = nodeIndex.get(focusedKey)!;

    Array.from(connectedKeys).forEach((connKey) => {
      const connIdx = nodeIndex.get(connKey);
      if (connIdx != null) {
        simLinks.push({
          source: focusIdx,
          target: connIdx,
        });
      }
    });

    // --- Configure and run simulation ---
    const collideRadius = (d: SimNode) => {
      switch (d.nodeType) {
        case "philosophy":
          return 1.2;
        case "curriculum":
          return 0.6;
        default:
          return 0.3;
      }
    };

    const chargeStrength = (d: SimNode) => {
      switch (d.role) {
        case "focused":
          return -15;
        case "connected":
          return -6;
        default:
          return -1;
      }
    };

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((_d, i) => i)
          .distance((link) => {
            const s =
              typeof link.source === "object"
                ? (link.source as SimNode)
                : simNodes[link.source as number];
            const t =
              typeof link.target === "object"
                ? (link.target as SimNode)
                : simNodes[link.target as number];
            if (!s || !t) return 3;
            if (s.role === "focused" || t.role === "focused") return 1.2;
            return 3;
          })
          .strength(0.8),
      )
      .force("charge", forceManyBody<SimNode>().strength(chargeStrength))
      .force("collide", forceCollide<SimNode>().radius(collideRadius).iterations(3))
      .force(
        "x",
        forceX<SimNode>()
          .x((d) => {
            if (d.role === "focused") return 0;
            if (d.role === "connected") return 0;
            // Scale "other" nodes toward center too — don't leave them far out
            return d.defaultX * 0.7;
          })
          .strength((d) => (d.role === "other" ? 0.6 : 0.1)),
      )
      .force(
        "y",
        forceY<SimNode>()
          .y((d) => {
            if (d.role === "focused") return 0;
            if (d.role === "connected") return 0;
            return d.defaultY * 0.7;
          })
          .strength((d) => (d.role === "other" ? 0.6 : 0.1)),
      )
      .stop();

    // Pin the focused node at origin
    const focusNode = simNodes[focusIdx];
    focusNode.fx = 0;
    focusNode.fy = 0;

    // Run synchronously to convergence
    for (let i = 0; i < 300; i++) {
      sim.tick();
    }

    // --- Collect results ---
    const resultPositions = new Map<string, { x: number; y: number }>();

    // Copy simulation results
    for (const sn of simNodes) {
      resultPositions.set(sn.id, { x: sn.x ?? 0, y: sn.y ?? 0 });
    }

    // For nodes not in the simulation, keep their default positions
    Array.from(defaultPositions.entries()).forEach(([key, pos]) => {
      if (!resultPositions.has(key)) {
        resultPositions.set(key, pos);
      }
    });

    // --- Compute focus center and zoom from connected cluster bounding box ---
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Include focused node + connected nodes in bounding box
    const clusterKeys = [focusedKey, ...Array.from(connectedKeys)];
    for (const ck of clusterKeys) {
      const pos = resultPositions.get(ck);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      }
    }

    // Fallback if bounding box is degenerate
    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
      return {
        positions: resultPositions,
        focusCenter: { x: 0, y: 0 },
        focusZoom: 60,
      };
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const maxSpan = Math.max(spanX, spanY, 1); // at least 1 to avoid divide-by-zero

    // Zoom so cluster fills most of the viewport. Higher zoom = more readable labels.
    const focusZoom = Math.min(160, Math.max(50, 45 * (16 / (maxSpan + 2))));

    return {
      positions: resultPositions,
      focusCenter: { x: centerX, y: centerY },
      focusZoom,
    };
  }, [graphData, focusedNode, visibleLayers]);
}
