"use client";

import { createContext, useContext } from "react";
import { GraphData } from "./types";

export interface FocusedNode {
  type: "philosophy" | "curriculum";
  id: string;
}

export interface ExploreState {
  focusedNode: FocusedNode | null;
  setFocusedNode: (node: FocusedNode | null) => void;
  graphData: GraphData;
}

export const ExploreContext = createContext<ExploreState | null>(null);

export function useExploreState(): ExploreState {
  const ctx = useContext(ExploreContext);
  if (!ctx) {
    throw new Error("useExploreState must be used within an ExploreContext provider");
  }
  return ctx;
}
