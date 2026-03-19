"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const zoomRef = useRef<{ zoomIn: () => void; zoomOut: () => void }>({ zoomIn: () => {}, zoomOut: () => {} });

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

  // On Enter in search, auto-focus the first matching node
  const handleSearchSubmit = useCallback(() => {
    if (!searchTerm || !data) return;
    const term = searchTerm.toLowerCase();

    // Check philosophies first
    const matchedPhil = data.philosophies.find((p) => {
      const display = p.name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return display.toLowerCase().includes(term);
    });
    if (matchedPhil) {
      setFocusedNode({ type: "philosophy", id: matchedPhil.name });
      return;
    }

    // Then check curricula
    const matchedCurr = data.curricula.find(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.publisher.toLowerCase().includes(term),
    );
    if (matchedCurr) {
      setFocusedNode({ type: "curriculum", id: matchedCurr.id });
    }
  }, [searchTerm, data]);

  // Empty state: KG service not running or API returned empty data
  if (error) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-white/50 text-sm max-w-md text-center leading-relaxed">
          Start the Knowledge Graph service to explore your constellation
        </p>
        <p className="text-white/25 text-xs max-w-sm text-center font-mono">
          cd kg-service && source .venv/bin/activate && uvicorn main:app --port 8000
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-white/40 text-sm">
          Mapping your constellation...
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        zoomRef={zoomRef}
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onZoomIn={() => zoomRef.current.zoomIn()}
        onZoomOut={() => zoomRef.current.zoomOut()}
      />
    </div>
  );
}
