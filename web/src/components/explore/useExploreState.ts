"use client";

import { createContext, useContext } from "react";
import { GraphData } from "./types";
import { LayoutPositions } from "./useForceLayout";

export interface FocusedNode {
  type: "philosophy" | "curriculum" | "principle" | "activity" | "material";
  id: string;           // placementId for curriculum placements
  curriculumId?: string; // shared ID across sibling placements
  philosophyId?: string;
}

export interface VisibleLayers {
  curricula: boolean;
  principles: boolean;
  activities: boolean;
  materials: boolean;
}

export const DEFAULT_VISIBLE_LAYERS: VisibleLayers = {
  curricula: true,
  principles: false,
  activities: false,
  materials: false,
};

export interface ExploreState {
  focusedNode: FocusedNode | null;
  setFocusedNode: (node: FocusedNode | null) => void;
  graphData: GraphData;
  visibleLayers: VisibleLayers;
  setVisibleLayers: (layers: VisibleLayers) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  layoutPositions: LayoutPositions;
  /** User's top philosophy IDs from their compass result — [primary, secondary] */
  archetypePhilosophyIds: string[];
}

export const ExploreContext = createContext<ExploreState | null>(null);

export function useExploreState(): ExploreState {
  const ctx = useContext(ExploreContext);
  if (!ctx) {
    throw new Error("useExploreState must be used within an ExploreContext provider");
  }
  return ctx;
}
