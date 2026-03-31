"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { GraphData, CurriculumPlacement } from "@/components/explore/types";
import {
  ExploreContext,
  ExploreState,
  FocusedNode,
  VisibleLayers,
  DEFAULT_VISIBLE_LAYERS,
} from "@/components/explore/useExploreState";
import InfoPanel from "@/components/explore/InfoPanel";
import ControlBar from "@/components/explore/ControlBar";
import { useForceLayout } from "@/components/explore/useForceLayout";
import { getOrbitalPosition } from "@/components/explore/positions";

// Dynamic import to avoid SSR issues with Three.js
const ExploreCanvas = dynamic(
  () => import("@/components/explore/ExploreCanvas"),
  { ssr: false },
);

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "#0B2E4A" }} />}>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const searchParams = useSearchParams();
  const embedMode = searchParams.get("embed") === "true";
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<FocusedNode | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>(
    DEFAULT_VISIBLE_LAYERS,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const zoomRef = useRef<{ zoomIn: () => void; zoomOut: () => void }>({ zoomIn: () => {}, zoomOut: () => {} });
  const layoutPositions = useForceLayout(
    data ?? { philosophies: [], curricula: [], principles: [], activities: [], materials: [] },
    focusedNode,
    visibleLayers,
  );

  // Compute orbital positions for curriculum placements
  const placementPositions = useMemo(() => {
    const placements = data?.curriculumPlacements;
    if (!placements || placements.length === 0) return {} as Record<string, [number, number]>;

    // Group placements by philosophy to get per-orbit index
    const placementsByPhil: Record<string, CurriculumPlacement[]> = {};
    for (const p of placements) {
      (placementsByPhil[p.philosophyName] ??= []).push(p);
    }
    // Sort each group by score descending (highest score = closest)
    for (const group of Object.values(placementsByPhil)) {
      group.sort((a, b) => b.score - a.score);
    }
    // Compute positions
    const positions: Record<string, [number, number]> = {};
    for (const [philName, group] of Object.entries(placementsByPhil)) {
      group.forEach((p, i) => {
        positions[p.placementId] = getOrbitalPosition(philName, p.score, i, group.length);
      });
    }
    return positions;
  }, [data?.curriculumPlacements]);

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

  useEffect(() => {
    fetch("/api/explore/graph")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

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
      // Try to focus on a placement for this curriculum; fall back to raw id
      const matchedPlacement = (data.curriculumPlacements || []).find(
        (p) => p.curriculumId === matchedCurr.id,
      );
      if (matchedPlacement) {
        setFocusedNode({
          type: "curriculum",
          id: matchedPlacement.placementId,
          curriculumId: matchedPlacement.curriculumId,
        });
      } else {
        setFocusedNode({ type: "curriculum", id: matchedCurr.id });
      }
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
    <ExploreContext.Provider value={contextValue}>
      <div className="w-screen h-screen bg-[#060610] overflow-hidden relative">
        {/* Watercolor night wash overlays */}
        <div
          data-testid="watercolor-bg"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.92] bg-cover bg-center"
          style={{ backgroundImage: "url('/explore/watercolor-bg-teal.png')" }}
        />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-45 bg-[url('/explore/watercolor-grain.svg')] bg-cover bg-center mix-blend-soft-light" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-38 mix-blend-screen bg-[radial-gradient(ellipse_at_18%_22%,rgba(62,126,177,0.48),transparent_52%),radial-gradient(ellipse_at_76%_72%,rgba(42,95,145,0.38),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-50 bg-[radial-gradient(circle_at_50%_50%,transparent_42%,rgba(2,3,12,0.62)_100%)]" />
        <svg
          className="pointer-events-none absolute inset-0 z-0 opacity-35"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <g fill="none" stroke="#d4af37" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="800" cy="500" rx="730" ry="440" strokeWidth="0.9" opacity="0.2" />
            <ellipse cx="800" cy="500" rx="645" ry="380" strokeWidth="0.6" opacity="0.14" />
            <ellipse cx="800" cy="500" rx="545" ry="320" strokeWidth="0.45" opacity="0.12" />
            <path d="M110,500 C360,420 520,330 800,330 C1080,330 1240,420 1490,500" strokeWidth="0.55" opacity="0.16" />
            <path d="M110,500 C360,580 520,670 800,670 C1080,670 1240,580 1490,500" strokeWidth="0.55" opacity="0.16" />
            <path d="M800,70 C750,260 740,380 740,500 C740,620 750,740 800,930" strokeWidth="0.45" opacity="0.12" />
            <path d="M800,70 C850,260 860,380 860,500 C860,620 850,740 800,930" strokeWidth="0.45" opacity="0.12" />
            <path d="M250,140 C560,250 1040,250 1350,140" strokeWidth="0.45" opacity="0.11" strokeDasharray="2 8" />
            <path d="M250,860 C560,750 1040,750 1350,860" strokeWidth="0.45" opacity="0.11" strokeDasharray="2 8" />
          </g>
        </svg>

        {/* 3D Canvas — receives state as props and re-provides context inside R3F reconciler */}
        <ExploreCanvas
          data={data}
          focusedNode={focusedNode}
          setFocusedNode={setFocusedNode}
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          layoutPositions={layoutPositions}
          placementPositions={placementPositions}
          zoomRef={zoomRef}
          embedMode={embedMode}
        />

        {data.dataIntegrity?.missingPhilosophies?.length ? (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase text-[#d4af37]/80 bg-black/40 border border-[#d4af37]/30 rounded-full backdrop-blur-md">
            Data gap: missing {data.dataIntegrity.missingPhilosophies.length} philosophy
            {data.dataIntegrity.missingPhilosophies.length > 1 ? " entries" : " entry"} in KG
          </div>
        ) : null}

        <div className="fixed left-3 bottom-14 z-40 text-[10px] text-[#d4af37]/55 tracking-[0.06em] uppercase pointer-events-auto">
          Constellation lines data:
          {" "}
          <a
            href="https://zenodo.org/doi/10.5281/zenodo.10397192"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#d4af37]/35 hover:text-[#d4af37]/85"
          >
            ConstellationLines (CC BY 4.0)
          </a>
        </div>

        <div className="fixed right-3 bottom-14 z-40 pointer-events-auto">
          <a
            href="/contact?subject=curriculum-suggestion"
            className="hover:underline"
            style={{
              fontSize: "11px",
              color: "rgba(249,246,239,0.5)",
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            Don&apos;t see your curriculum? Suggest one &rarr;
          </a>
        </div>

        {/* DOM overlays */}
        <InfoPanel
          focusedNode={focusedNode}
          data={data}
          onClose={handleClosePanel}
        />
        <ControlBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
          onZoomIn={() => zoomRef.current.zoomIn()}
          onZoomOut={() => zoomRef.current.zoomOut()}
        />
      </div>
    </ExploreContext.Provider>
  );
}
