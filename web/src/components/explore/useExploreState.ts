"use client";

import { createContext, useContext } from "react";
import { GraphData } from "./types";
import { LayoutPositions } from "./useForceLayout";

export interface FocusedNode {
  type: "philosophy" | "curriculum" | "principle" | "activity" | "material";
  id: string;
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
  principles: true,
  activities: true,
  materials: true,
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
}

export const ExploreContext = createContext<ExploreState | null>(null);

export function useExploreState(): ExploreState {
  const ctx = useContext(ExploreContext);
  if (!ctx) {
    throw new Error("useExploreState must be used within an ExploreContext provider");
  }
  return ctx;
}
