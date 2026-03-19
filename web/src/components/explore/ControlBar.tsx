"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";
import { VisibleLayers } from "./useExploreState";

interface ControlBarProps {
  visibleLayers: VisibleLayers;
  onToggleLayer: (layer: keyof VisibleLayers) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
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
  searchTerm,
  onSearchChange,
  onSearchSubmit,
}: ControlBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    onSearchChange("");
  }, [onSearchChange]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, closeSearch]);

  const handleToggleSearch = () => {
    if (searchOpen) {
      closeSearch();
    } else {
      setSearchOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchSubmit();
    }
  };

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
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-black/40 backdrop-blur-lg border-t border-white/10 flex items-center justify-center gap-2 px-4">
        {/* Search — left side */}
        <div className="absolute left-4 flex items-center gap-1">
          <button
            onClick={handleToggleSearch}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
            aria-label="Toggle search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ width: searchOpen ? 200 : 0 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search nodes..."
              className="w-[200px] h-7 bg-white/10 border border-white/20 rounded text-xs text-white placeholder-white/30 px-2 outline-none focus:border-white/40 transition-colors"
            />
          </div>
        </div>

        {/* Filter pills — center */}
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
