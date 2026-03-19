"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GraphData } from "@/components/explore/types";
import {
  FocusedNode,
  VisibleLayers,
  DEFAULT_VISIBLE_LAYERS,
} from "@/components/explore/useExploreState";
import InfoPanel from "@/components/explore/InfoPanel";
import ControlBar from "@/components/explore/ControlBar";

// Dynamic import to avoid SSR issues with Three.js
const ExploreCanvas = dynamic(
  () => import("@/components/explore/ExploreCanvas"),
  { ssr: false },
);

export default function ExplorePage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<FocusedNode | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>(
    DEFAULT_VISIBLE_LAYERS,
  );

  useEffect(() => {
    fetch("/api/explore/graph")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const handleToggleLayer = useCallback(
    (layer: keyof VisibleLayers) => {
      setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    },
    [],
  );

  const handleClosePanel = useCallback(() => {
    setFocusedNode(null);
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load graph: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">
          Loading constellation...
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] overflow-hidden">
      {/* 3D Canvas — receives state as props and re-provides context inside R3F reconciler */}
      <ExploreCanvas
        data={data}
        focusedNode={focusedNode}
        setFocusedNode={setFocusedNode}
        visibleLayers={visibleLayers}
        setVisibleLayers={setVisibleLayers}
      />

      {/* DOM overlays */}
      <InfoPanel
        focusedNode={focusedNode}
        data={data}
        onClose={handleClosePanel}
      />
      <ControlBar
        visibleLayers={visibleLayers}
        onToggleLayer={handleToggleLayer}
      />
    </div>
  );
}
