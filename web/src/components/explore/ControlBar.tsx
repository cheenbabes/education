"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

interface ControlBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export default function ControlBar({
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

      {/* Bottom control bar — centered search */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-12 bg-[linear-gradient(180deg,rgba(8,8,17,0.6),rgba(8,8,17,0.86))] backdrop-blur-xl border-t border-[#d4af37]/30 flex items-center justify-center px-4 shadow-[0_-8px_26px_rgba(0,0,0,0.48)]">
        <div className="flex items-center gap-1">
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
            style={{ width: searchOpen ? 220 : 0 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search curricula..."
              className="w-[220px] h-7 bg-black/35 border border-[#d4af37]/30 rounded text-xs text-[#e4d2a1] placeholder-[#d4af37]/35 px-2 outline-none focus:border-[#d4af37]/60 transition-colors"
            />
          </div>
        </div>
      </div>
    </>
  );
}
