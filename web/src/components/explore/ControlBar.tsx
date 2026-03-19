"use client";

import Link from "next/link";
import { VisibleLayers } from "./useExploreState";

interface ControlBarProps {
  visibleLayers: VisibleLayers;
  onToggleLayer: (layer: keyof VisibleLayers) => void;
}

interface TogglePillProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  activeColor: string;
  onClick: () => void;
}

function TogglePill({
  label,
  active,
  disabled,
  activeColor,
  onClick,
}: TogglePillProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all
        ${
          active
            ? "text-white shadow-sm"
            : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
        }
        ${disabled ? "cursor-default" : "cursor-pointer"}`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      {label}
    </button>
  );
}

export default function ControlBar({
  visibleLayers,
  onToggleLayer,
}: ControlBarProps) {
  return (
    <>
      {/* Home icon — top left */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 text-white/40 hover:text-white/80 transition-colors"
        aria-label="Go home"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </Link>

      {/* Bottom control bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-black/40 backdrop-blur-lg border-t border-white/10 flex items-center justify-center gap-2">
        <TogglePill
          label="Philosophies"
          active={true}
          disabled={true}
          activeColor="#4B5563"
          onClick={() => {}}
        />
        <TogglePill
          label="Curricula"
          active={visibleLayers.curricula}
          activeColor="#9CA3AF"
          onClick={() => onToggleLayer("curricula")}
        />
        <TogglePill
          label="Principles"
          active={visibleLayers.principles}
          activeColor="#ffffff"
          onClick={() => onToggleLayer("principles")}
        />
        <TogglePill
          label="Activities"
          active={visibleLayers.activities}
          activeColor="#F59E42"
          onClick={() => onToggleLayer("activities")}
        />
        <TogglePill
          label="Materials"
          active={visibleLayers.materials}
          activeColor="#60A5FA"
          onClick={() => onToggleLayer("materials")}
        />
      </div>
    </>
  );
}
