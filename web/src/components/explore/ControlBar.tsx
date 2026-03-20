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
  onClick: () => void;
  icon?: React.ReactNode;
}

function TogglePill({
  label,
  active,
  disabled,
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium transition-all
        ${
          active
            ? "shadow-sm"
            : "bg-white/5 text-[#F9F6EF]/35 hover:bg-white/10 hover:text-[#F9F6EF]/70"
        }
        ${disabled ? "cursor-default" : "cursor-pointer"}`}
      style={active ? { backgroundColor: "#F9F6EF", color: "#1B2A4A" } : undefined}
    >
      {icon}
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
          onClick={() => {}}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="4" stroke="#1B2A4A" strokeWidth="1.5" fill="none"/>
            </svg>
          }
        />
        <TogglePill
          label="Curricula"
          active={visibleLayers.curricula}
          onClick={() => onToggleLayer("curricula")}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12">
              <g transform="translate(6,6)" fill="#FFB400">
                {[0,30,60,90,120,150,180,210,240,270,300,330].map(r => <polygon key={r} points="0,-6 0.5,-2.2 -0.5,-2.2" transform={`rotate(${r})`}/>)}
                <circle r="2.2"/>
              </g>
            </svg>
          }
        />
        <TogglePill
          label="Principles"
          active={visibleLayers.principles}
          onClick={() => onToggleLayer("principles")}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12">
              <g transform="translate(6,6)" fill="#FF7C15">
                {[0,90,180,270].map(r => <polygon key={r} points="0,-6 0.8,-1.5 -0.8,-1.5" transform={`rotate(${r})`}/>)}
                {[45,135,225,315].map(r => <polygon key={r} points="0,-4 0.5,-1.5 -0.5,-1.5" transform={`rotate(${r})`}/>)}
                <circle r="1.5"/>
              </g>
            </svg>
          }
        />
        <TogglePill
          label="Activities"
          active={visibleLayers.activities}
          onClick={() => onToggleLayer("activities")}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12">
              <g transform="translate(6,6)" fill="#ED4672">
                {[0,60,120,180,240,300].map(r => <path key={r} d="M0,-6 C0.8,-2.5 1.5,-1 0,0 C-1.5,-1 -0.8,-2.5 0,-6Z" transform={`rotate(${r})`}/>)}
                <circle r="1"/>
              </g>
            </svg>
          }
        />
        <TogglePill
          label="Materials"
          active={visibleLayers.materials}
          onClick={() => onToggleLayer("materials")}
          icon={
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M6,0 C6,3.5 6.5,5 10,6 C6.5,7 6,8.5 6,12 C6,8.5 5.5,7 2,6 C5.5,5 6,3.5 6,0Z" fill="#B44AFF"/>
            </svg>
          }
        />
      </div>
    </>
  );
}
