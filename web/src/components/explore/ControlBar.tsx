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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

interface TogglePillProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  activeColor: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

function TogglePill({
  label,
  active,
  disabled,
  activeColor,
  onClick,
  icon,
}: TogglePillProps) {
  const testId = `layer-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${label} layer`}
      data-testid={testId}
      className={`px-3 py-1 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium transition-all
        ${
          active
            ? "text-[#17151b] shadow-sm"
            : "bg-white/5 text-[#d4af37]/45 hover:bg-white/10 hover:text-[#d4af37]/80"
        }
        ${disabled ? "cursor-default" : "cursor-pointer"}`}
      style={active ? { backgroundColor: activeColor } : undefined}
    >
      {icon && <span className="mr-1 inline-flex">{icon}</span>}
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
  onZoomIn,
  onZoomOut,
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
        className="fixed top-4 left-4 z-50 text-[#d4af37]/55 hover:text-[#d4af37] transition-colors"
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
      <Link
        href="/explore/glyph-lab"
        className="fixed top-4 left-14 z-50 px-2 py-1 text-[10px] tracking-[0.14em] uppercase text-[#d4af37]/60 border border-[#d4af37]/30 rounded bg-black/30 hover:bg-[#d4af37]/10 hover:text-[#d4af37] transition-colors"
        aria-label="Open glyph lab"
      >
        Glyph Lab
      </Link>

      {/* Zoom controls — right side, Google Maps style */}
      <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-0.5">
        <button
          onClick={onZoomIn}
          className="w-9 h-9 bg-black/55 backdrop-blur-lg border border-[#d4af37]/25 rounded-t-lg text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all flex items-center justify-center text-lg font-light"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-9 h-9 bg-black/55 backdrop-blur-lg border border-[#d4af37]/25 rounded-b-lg text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-all flex items-center justify-center text-lg font-light"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>

      {/* Bottom control bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[linear-gradient(180deg,rgba(8,8,17,0.6),rgba(8,8,17,0.86))] backdrop-blur-xl border-t border-[#d4af37]/30 flex items-center justify-center gap-2 px-4 shadow-[0_-8px_26px_rgba(0,0,0,0.48)]">
        {/* Search — left side */}
        <div className="absolute left-4 flex items-center gap-1">
          <button
            onClick={handleToggleSearch}
            className="text-[#d4af37]/50 hover:text-[#d4af37] transition-colors p-1"
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
              className="w-[200px] h-7 bg-black/35 border border-[#d4af37]/30 rounded text-xs text-[#e4d2a1] placeholder-[#d4af37]/35 px-2 outline-none focus:border-[#d4af37]/60 transition-colors"
            />
          </div>
        </div>

        {/* Filter pills — center */}
        <TogglePill
          label="Philosophies"
          active={true}
          disabled={true}
          activeColor="#d4af37"
          onClick={() => {}}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="5" r="2"/><circle cx="19" cy="8" r="2"/><circle cx="8" cy="19" r="2"/>
              <line x1="5" y1="5" x2="19" y2="8" stroke="currentColor" strokeWidth="1"/>
              <line x1="19" y1="8" x2="8" y2="19" stroke="currentColor" strokeWidth="1"/>
            </svg>
          }
        />
        <TogglePill
          label="Curricula"
          active={visibleLayers.curricula}
          activeColor="#ead29b"
          onClick={() => onToggleLayer("curricula")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="4.2" y1="4.2" x2="7" y2="7" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="17" y1="17" x2="19.8" y2="19.8" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="4.2" y1="19.8" x2="7" y2="17" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="17" y1="7" x2="19.8" y2="4.2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          }
        />
        <TogglePill
          label="Principles"
          active={visibleLayers.principles}
          activeColor="#efe2c6"
          onClick={() => onToggleLayer("principles")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,1 13.5,9 12,11 10.5,9"/>
              <polygon points="12,23 13.5,15 12,13 10.5,15"/>
              <polygon points="1,12 9,10.5 11,12 9,13.5"/>
              <polygon points="23,12 15,10.5 13,12 15,13.5"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          }
        />
        <TogglePill
          label="Activities"
          active={visibleLayers.activities}
          activeColor="#e2a24f"
          onClick={() => onToggleLayer("activities")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="12" cy="5" rx="2.5" ry="5" transform="rotate(0 12 12)"/>
              <ellipse cx="12" cy="5" rx="2.5" ry="5" transform="rotate(120 12 12)"/>
              <ellipse cx="12" cy="5" rx="2.5" ry="5" transform="rotate(240 12 12)"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          }
        />
        <TogglePill
          label="Materials"
          active={visibleLayers.materials}
          activeColor="#7cb5f0"
          onClick={() => onToggleLayer("materials")}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1 C12,8 13,10 21,12 C13,14 12,16 12,23 C12,16 11,14 3,12 C11,10 12,8 12,1Z"/>
            </svg>
          }
        />
      </div>
    </>
  );
}
