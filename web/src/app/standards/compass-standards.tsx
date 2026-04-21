"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

interface CatalogSubject {
  subject: string;
  standards: Array<{ code: string; description: string }>;
}

interface SearchResult {
  code: string;
  description: string;
  subject: string;
  score: number;
  domain?: string;
}

interface ArchetypeData {
  topPhilosophyIds: string[];
}

const NIGHT = "#0B2E4A";
const PARCHMENT = "#F9F6EF";
const ACCENT_SECONDARY = "#82284b";
const ACCENT_GOLD = "#D4AF37";
const TEXT_SECONDARY = "#5A5A5A";
const TEXT_TERTIARY = "#767676";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const SUBJECT_CODE_COLORS: Record<string, { bg: string; color: string }> = {
  math: { bg: "rgba(37,99,235,0.1)", color: "#2563EB" },
  ela: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  english: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  science: { bg: "rgba(5,150,105,0.1)", color: "#059669" },
  social: { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
  "social studies": { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
  history: { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
};

function subjectTone(subject?: string): { bg: string; color: string } {
  if (!subject) return { bg: "rgba(110,110,158,0.1)", color: "#6E6E9E" };
  const key = subject.toLowerCase();
  for (const [match, tone] of Object.entries(SUBJECT_CODE_COLORS)) {
    if (key.includes(match)) return tone;
  }
  return { bg: "rgba(110,110,158,0.1)", color: "#6E6E9E" };
}

function prettyPhilosophy(id: string): string {
  return id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MAX_SELECTED = 7;

export function CompassStandards() {
  const searchParams = useSearchParams();
  const urlState = (searchParams.get("state") || "").toUpperCase();
  const urlGrade = searchParams.get("grade") || "";

  const [userState, setUserState] = useState<string>(urlState || "MI");
  const [grade, setGrade] = useState<string>(urlGrade || "3");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [archetype, setArchetype] = useState<ArchetypeData | null>(null);
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [descriptionMap, setDescriptionMap] = useState<Record<string, string>>({});

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [viewedTracked, setViewedTracked] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load user state + archetype on mount
  useEffect(() => {
    const jsonOrNull = (r: Response) => (r.ok ? r.json() : null);
    Promise.all([
      fetch("/api/user").then(jsonOrNull).catch(() => null),
      fetch("/api/user/archetype").then(jsonOrNull).catch(() => null),
    ]).then(([userData, archetypeData]) => {
      if (!urlState && userData?.state) setUserState(userData.state);
      if (archetypeData?.topPhilosophyIds?.length) setArchetype(archetypeData);
    });
  }, [urlState]);

  // Load catalog whenever state+grade change. Clear stale search results
  // so the old-grade matches don't flash while the new search fires.
  useEffect(() => {
    setLoading(true);
    setSearchResults(null);
    if (abortRef.current) abortRef.current.abort();
    fetch(`/api/standards/catalog?state=${encodeURIComponent(userState)}&grade=${encodeURIComponent(grade)}`)
      .then((r) => (r.ok ? r.json() : { subjects: [] }))
      .then((data) => {
        setCatalog(data.subjects || []);
        setLoading(false);
      })
      .catch(() => {
        setCatalog([]);
        setLoading(false);
      });
  }, [userState, grade]);

  // Build description lookup from catalog for sessionStorage write on combined CTA
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of catalog) {
      for (const std of s.standards) {
        map[std.code] = std.description;
      }
    }
    setDescriptionMap(map);
  }, [catalog]);

  // Debounced semantic search
  const performSearch = useCallback(
    (query: string) => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setSearchResults(null);
        setSearching(false);
        return;
      }
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        // (debounce kept short — semantic search is fast and essentially free)
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const res = await fetch("/api/standards/catalog/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query.trim(), state: userState, grade }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error("search failed");
          const data = await res.json();
          setSearchResults(data.results || []);
          track("standards_search_performed", {
            tier: "compass",
            state: userState,
            grade,
            query_length: query.trim().length,
            results_count: (data.results || []).length,
          });
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 150);
    },
    [userState, grade]
  );

  useEffect(() => {
    performSearch(searchQuery);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  // Fire viewed event once catalog is loaded
  useEffect(() => {
    if (loading || viewedTracked) return;
    track("standards_viewed", {
      tier: "compass",
      state: userState,
      grade,
      has_archetype: !!archetype,
    });
    setViewedTracked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const toggleStandard = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else if (next.size < MAX_SELECTED) {
        next.add(code);
      }
      return next;
    });
  };

  // Derive rows to show: search results when active, else catalog flattened by subject filter
  const displayRows = useMemo(() => {
    type Row = { code: string; description: string; subject: string; score?: number };
    const rows: Row[] = [];
    const query = searchQuery.trim();
    if (query && searchResults) {
      for (const r of searchResults) {
        if (subjectFilter && !r.subject.toLowerCase().includes(subjectFilter.toLowerCase())) continue;
        rows.push({ code: r.code, description: r.description, subject: r.subject, score: r.score });
      }
      return rows.slice(0, 25);
    }
    for (const s of catalog) {
      if (subjectFilter && !s.subject.toLowerCase().includes(subjectFilter.toLowerCase())) continue;
      for (const std of s.standards) {
        rows.push({ code: std.code, description: std.description, subject: s.subject });
      }
    }
    return rows.slice(0, 25);
  }, [searchQuery, searchResults, catalog, subjectFilter]);

  const availableSubjects = useMemo(
    () => catalog.map((s) => s.subject).filter(Boolean),
    [catalog]
  );

  const philosophyLabel = archetype?.topPhilosophyIds?.[0]
    ? prettyPhilosophy(archetype.topPhilosophyIds[0])
    : null;

  const buildCombinedHref = () => {
    const codes = Array.from(selected).join(",");
    return `/create?standards=${encodeURIComponent(codes)}`;
  };

  const handleCombinedClick = () => {
    // Save descriptions to sessionStorage so /create can render tooltips without re-lookup
    try {
      const picked: Record<string, string> = {};
      Array.from(selected).forEach((code) => {
        if (descriptionMap[code]) picked[code] = descriptionMap[code];
      });
      sessionStorage.setItem("standardDescriptions", JSON.stringify(picked));
    } catch { /* ignore */ }
    track("standards_combined_lesson_clicked", {
      tier: "compass",
      count: selected.size,
      codes_length: Array.from(selected).join(",").length,
    });
  };

  const handleSeedClick = (code: string, subject: string) => {
    try {
      if (descriptionMap[code]) {
        sessionStorage.setItem(
          "standardDescriptions",
          JSON.stringify({ [code]: descriptionMap[code] })
        );
      }
    } catch { /* ignore */ }
    track("standards_seed_clicked", {
      tier: "compass",
      code,
      subject,
      selection_size: selected.size,
    });
  };

  return (
    <div
      className="space-y-4"
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}
    >
      {/* ── HERO ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", paddingBottom: "0.25rem" }}>
        <h1
          className="font-cormorant-sc"
          style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1f2328", letterSpacing: "0.02em", margin: 0 }}
        >
          Turn any standard into a lesson
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: TEXT_SECONDARY, lineHeight: 1.55, maxWidth: "720px" }}>
          Search K–12 standards by state or framework. Pick one or stack several — we&apos;ll write a single lesson that covers
          them all, matched to your teaching style.
        </p>
        {philosophyLabel && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: ACCENT_SECONDARY,
              background: "rgba(130,40,75,0.08)",
              border: "1px solid rgba(130,40,75,0.2)",
              padding: "0.25rem 0.65rem",
              borderRadius: "20px",
              marginTop: "0.4rem",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ color: ACCENT_GOLD, fontSize: "0.9rem", lineHeight: 0.7 }}>✦</span>
            Your style: {philosophyLabel}
          </span>
        )}
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search standards — try &ldquo;fractions&rdquo;, &ldquo;animal habitats&rdquo;, or &ldquo;civil war&rdquo;…"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "10px",
            padding: "0.65rem 0.8rem",
            paddingRight: searching ? "2.5rem" : "0.8rem",
            fontSize: "0.85rem",
            color: "#1f2328",
            width: "100%",
            outline: "none",
          }}
        />
        {searching && (
          <span
            style={{
              position: "absolute",
              right: "0.8rem",
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "0.9rem",
              height: "0.9rem",
            }}
          >
            <span
              style={{
                width: "100%",
                height: "100%",
                border: `2px solid rgba(11,46,74,0.2)`,
                borderTopColor: NIGHT,
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block",
              }}
            />
          </span>
        )}
      </div>

      {/* ── FILTER ROW ── */}
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center", position: "relative" }}>
        {/* Grade */}
        <FilterPill
          label={`Grade ${grade}`}
          active={true}
          onClick={() => {
            setShowGradePicker((v) => !v);
            setShowStatePicker(false);
            setShowSubjectPicker(false);
          }}
        />
        {showGradePicker && (
          <PickerMenu
            options={GRADES.map((g) => ({ label: `Grade ${g}`, value: g }))}
            onPick={(v) => {
              setGrade(v);
              setShowGradePicker(false);
            }}
            onClose={() => setShowGradePicker(false)}
          />
        )}

        {/* Subject */}
        <FilterPill
          label={subjectFilter || "All subjects"}
          active={!!subjectFilter}
          onClick={() => {
            setShowSubjectPicker((v) => !v);
            setShowStatePicker(false);
            setShowGradePicker(false);
          }}
        />
        {showSubjectPicker && (
          <PickerMenu
            options={[{ label: "All subjects", value: "" }, ...availableSubjects.map((s) => ({ label: s, value: s }))]}
            onPick={(v) => {
              setSubjectFilter(v);
              setShowSubjectPicker(false);
            }}
            onClose={() => setShowSubjectPicker(false)}
          />
        )}

        {/* State */}
        <FilterPill
          label={userState}
          active={true}
          onClick={() => {
            setShowStatePicker((v) => !v);
            setShowGradePicker(false);
            setShowSubjectPicker(false);
          }}
        />
        {showStatePicker && (
          <PickerMenu
            options={["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map((s) => ({ label: s, value: s }))}
            onPick={(v) => {
              setUserState(v);
              setShowStatePicker(false);
            }}
            onClose={() => setShowStatePicker(false)}
          />
        )}
      </div>

      {/* ── ROWS ── */}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: TEXT_SECONDARY, fontSize: "0.85rem" }}>
          Loading standards…
        </div>
      ) : displayRows.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: TEXT_SECONDARY, fontSize: "0.85rem" }}>
          No standards found. Try a different search or state.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {displayRows.map((row) => {
            const tone = subjectTone(row.subject);
            const isSelected = selected.has(row.code);
            return (
              <div
                key={row.code}
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  padding: "0.65rem 0.8rem",
                  borderRadius: "9px",
                  background: isSelected ? "rgba(130,40,75,0.05)" : "rgba(255,255,255,0.72)",
                  border: isSelected ? "1px solid rgba(130,40,75,0.25)" : "1px solid rgba(0,0,0,0.05)",
                  fontSize: "0.78rem",
                  alignItems: "flex-start",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleStandard(row.code)}
                  aria-label={isSelected ? `Deselect ${row.code}` : `Select ${row.code}`}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: isSelected ? `1.5px solid ${ACCENT_SECONDARY}` : "1.5px solid rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                    flexShrink: 0,
                    marginTop: "2px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: isSelected ? "#fff" : "transparent",
                    background: isSelected ? ACCENT_SECONDARY : "#fff",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✓
                </button>
                <span
                  style={{
                    fontFamily: "Menlo, 'SF Mono', monospace",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    background: tone.bg,
                    color: tone.color,
                  }}
                >
                  {row.code}
                </span>
                <div style={{ flex: 1, color: "#1f2328", lineHeight: 1.45, fontSize: "0.8rem" }}>
                  {row.description}
                  <div style={{ fontSize: "0.68rem", color: TEXT_TERTIARY, marginTop: "0.15rem" }}>
                    {row.subject} · Grade {grade}
                  </div>
                </div>
                <Link
                  href={`/create?standards=${encodeURIComponent(row.code)}`}
                  onClick={() => handleSeedClick(row.code, row.subject)}
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "6px",
                    background: NIGHT,
                    color: PARCHMENT,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Create →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STICKY SELECTION TRAY ── */}
      {selected.size > 0 && (
        <div
          style={{
            position: "sticky",
            bottom: "1rem",
            background: "linear-gradient(135deg, rgba(11,46,74,0.95), rgba(110,110,158,0.95))",
            color: PARCHMENT,
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.6rem",
            boxShadow: "0 6px 18px rgba(11,46,74,0.25)",
            zIndex: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>
            <span className="font-cormorant-sc" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              {selected.size} standard{selected.size === 1 ? "" : "s"} selected
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.75)",
                display: "block",
                marginTop: "0.1rem",
              }}
            >
              One lesson will cover all {selected.size}
              {philosophyLabel ? ` — ${philosophyLabel} style` : ""}.
            </span>
          </div>
          <Link
            href={buildCombinedHref()}
            onClick={handleCombinedClick}
            style={{
              background: PARCHMENT,
              color: NIGHT,
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Create combined lesson →
          </Link>
        </div>
      )}

      {/* ── COVERAGE TEASER (paid) ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px dashed rgba(11,46,74,0.2)",
          borderRadius: "10px",
          padding: "0.85rem 0.95rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "0.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <div
            className="font-cormorant-sc"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#1f2328",
              marginBottom: "0.15rem",
              flexWrap: "wrap",
            }}
          >
            Track per-child coverage
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.2rem 0.5rem",
                borderRadius: "5px",
                background: "rgba(196,152,61,0.12)",
                color: "#B08A2E",
                border: "1px solid rgba(196,152,61,0.35)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Homestead
            </span>
          </div>
          <div style={{ fontSize: "0.76rem", color: TEXT_SECONDARY, lineHeight: 1.45 }}>
            On Homestead, every lesson you create auto-marks the standards it covers — see gaps and progress at a glance.
          </div>
        </div>
        <Link
          href="/pricing"
          onClick={() => track("standards_upgrade_clicked", { tier: "compass", source: "coverage_teaser" })}
          style={{
            fontSize: "0.78rem",
            color: NIGHT,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          See plans →
        </Link>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: "0.72rem",
        padding: "0.3rem 0.6rem",
        borderRadius: "6px",
        border: active ? `1px solid ${NIGHT}` : "1px solid rgba(0,0,0,0.08)",
        background: active ? NIGHT : "rgba(255,255,255,0.68)",
        color: active ? PARCHMENT : TEXT_SECONDARY,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function PickerMenu({
  options,
  onPick,
  onClose,
}: {
  options: Array<{ label: string; value: string }>;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          background: "transparent",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: "0.35rem",
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "8px",
          boxShadow: "0 4px 14px rgba(11,46,74,0.15)",
          padding: "0.25rem",
          zIndex: 20,
          maxHeight: "260px",
          overflowY: "auto",
          minWidth: "140px",
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.35rem 0.6rem",
              fontSize: "0.78rem",
              color: "#1f2328",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,46,74,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
