"use client";

import { useMemo } from "react";
import { GraphData, PhilosophyNode, CurriculumNode } from "./types";
import { FocusedNode } from "./useExploreState";

const PHILOSOPHY_COLORS: Record<string, string> = {
  "montessori-inspired": "#8B5CF6",
  "waldorf-adjacent": "#F59E0B",
  "project-based-learning": "#3B82F6",
  "place-nature-based": "#10B981",
  classical: "#6366F1",
  "charlotte-mason": "#EC4899",
  unschooling: "#F97316",
  flexible: "#6B7280",
};

/** Normalize underscore-based philosophy keys to hyphenated canonical form */
function normalizePhilKey(key: string): string {
  const map: Record<string, string> = {
    charlotte_mason: "charlotte-mason",
    waldorf: "waldorf-adjacent",
    montessori: "montessori-inspired",
    project_based: "project-based-learning",
    place_nature: "place-nature-based",
    eclectic_flexible: "flexible",
  };
  return map[key] || key;
}

/** Format philosophy name for display: "place-nature-based" -> "Place Nature Based" */
function displayName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface InfoPanelProps {
  focusedNode: FocusedNode | null;
  data: GraphData;
  onClose: () => void;
}

function PhilosophyPanel({
  philosophy,
  data,
  onClose,
}: {
  philosophy: PhilosophyNode;
  data: GraphData;
  onClose: () => void;
}) {
  const color = PHILOSOPHY_COLORS[philosophy.name] || "#6B7280";

  // Find top curricula scored for this philosophy
  const topCurricula = useMemo(() => {
    const scored: { curriculum: CurriculumNode; score: number }[] = [];
    for (const c of data.curricula) {
      // Check all philosophy score keys for matches
      for (const [key, score] of Object.entries(c.philosophyScores)) {
        const normalized = normalizePhilKey(key);
        if (normalized === philosophy.name && score > 0.05) {
          scored.push({ curriculum: c, score });
          break;
        }
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  }, [data.curricula, philosophy.name]);

  const maxScore = topCurricula.length > 0 ? topCurricula[0].score : 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color }}>
          {displayName(philosophy.name)}
        </h2>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors ml-2 mt-1 shrink-0"
          aria-label="Close panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed mb-4">
        {philosophy.description}
      </p>

      {/* Stats */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {philosophy.principleCount} principles
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {philosophy.activityCount} activities
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {philosophy.materialCount} materials
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-4" />

      {/* Top Curricula */}
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
        Top Curricula
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {topCurricula.length === 0 && (
          <p className="text-xs text-white/30">No matching curricula found.</p>
        )}
        {topCurricula.map(({ curriculum: c, score }) => (
          <div key={c.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              {c.affiliateUrl ? (
                <a
                  href={c.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white hover:underline"
                >
                  {c.name}
                </a>
              ) : (
                <span className="text-sm font-semibold text-white">
                  {c.name}
                </span>
              )}
              <span className="text-xs text-white/40 shrink-0">
                {(score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-white/40">{c.publisher}</p>
            {/* Score bar */}
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(score / maxScore) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                {c.gradeRange}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                {c.prepLevel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurriculumPanel({
  curriculum,
  onClose,
}: {
  curriculum: CurriculumNode;
  onClose: () => void;
}) {
  // Build sorted philosophy scores
  const sortedScores = useMemo(() => {
    const entries: { name: string; score: number; color: string }[] = [];
    for (const [key, score] of Object.entries(curriculum.philosophyScores)) {
      if (score <= 0.1) continue;
      const normalized = normalizePhilKey(key);
      const color = PHILOSOPHY_COLORS[normalized] || "#6B7280";
      entries.push({ name: normalized, score, color });
    }
    entries.sort((a, b) => b.score - a.score);
    return entries;
  }, [curriculum.philosophyScores]);

  const maxScore = sortedScores.length > 0 ? sortedScores[0].score : 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-xl font-bold text-white">{curriculum.name}</h2>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors ml-2 mt-1 shrink-0"
          aria-label="Close panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-white/50 mb-3">{curriculum.publisher}</p>

      <p className="text-sm text-gray-400 leading-relaxed mb-4">
        {curriculum.description}
      </p>

      {/* Tags */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
          {curriculum.gradeRange}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
          {curriculum.prepLevel}
        </span>
        {curriculum.religiousType !== "secular" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            {curriculum.religiousType}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
          {curriculum.priceRange}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-4" />

      {/* Philosophy score breakdown */}
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
        Philosophy Alignment
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
        {sortedScores.map(({ name, score, color }) => (
          <div key={name} className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-white/80">
                {displayName(name)}
              </span>
              <span className="text-xs text-white/40">
                {(score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(score / maxScore) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        ))}

        {/* Notes */}
        {curriculum.notes && (
          <>
            <div className="border-t border-white/10 mt-3 pt-3" />
            <p className="text-xs text-white/30 leading-relaxed">
              {curriculum.notes}
            </p>
          </>
        )}
      </div>

      {/* Affiliate link */}
      {curriculum.affiliateUrl && (
        <a
          href={curriculum.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg py-2 transition-all"
        >
          Learn More &rarr;
        </a>
      )}
    </div>
  );
}

export default function InfoPanel({
  focusedNode,
  data,
  onClose,
}: InfoPanelProps) {
  const isOpen = focusedNode !== null;

  // Resolve the focused entity
  const philosophy = useMemo(
    () =>
      focusedNode?.type === "philosophy"
        ? data.philosophies.find((p) => p.name === focusedNode.id) || null
        : null,
    [focusedNode, data.philosophies],
  );

  const curriculum = useMemo(
    () =>
      focusedNode?.type === "curriculum"
        ? data.curricula.find((c) => c.id === focusedNode.id) || null
        : null,
    [focusedNode, data.curricula],
  );

  return (
    <div
      className={`fixed top-20 bottom-20 right-4 w-[340px] z-50
        bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl
        p-5 overflow-hidden flex flex-col
        transition-all duration-300 ease-out
        ${isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-8 opacity-0 pointer-events-none"}`}
    >
      {philosophy && (
        <PhilosophyPanel
          philosophy={philosophy}
          data={data}
          onClose={onClose}
        />
      )}
      {curriculum && (
        <CurriculumPanel
          curriculum={curriculum}
          onClose={onClose}
        />
      )}
    </div>
  );
}
