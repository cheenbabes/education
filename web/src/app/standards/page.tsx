"use client";

import { Shell } from "@/components/shell";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CompassStandards } from "./compass-standards";
import { frostCardStyle } from "@/components/dashboard-cards";
import { subjectTone } from "@/lib/standards-ui";

interface Standard {
  code: string;
  description: string;
  covered: boolean;
  lessonTitle: string | null;
}

interface SearchResult {
  code: string;
  description: string;
  subject: string;
  score: number;
  covered: boolean;
  lessonTitle: string | null;
}

interface SubjectProgress {
  subject: string;
  total: number;
  covered: number;
  standards: Standard[];
}

interface ChildData {
  id: string;
  name: string;
  gradeLevel: string;
  standardsOptIn: boolean;
}

interface StandardsData {
  childId: string;
  childName: string;
  gradeLevel: string;
  state: string;
  subjects: SubjectProgress[];
}

// Use the shared hybrid recipe so /standards matches the rest of the product.
const frostCard = frostCardStyle;

const MAX_SELECTED_STANDARDS = 7;

export default function StandardsPage() {
  const [tier, setTier] = useState<string | null>(null);
  const [tierLoaded, setTierLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/tier")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setTier(data?.tier ?? "compass");
        setTierLoaded(true);
      })
      .catch(() => {
        setTier("compass");
        setTierLoaded(true);
      });
  }, []);

  return (
    <Shell hue="standards">
      {!tierLoaded ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
          <p style={{ color: "#5A5A5A" }}>Loading…</p>
        </div>
      ) : tier === "compass" ? (
        <CompassStandards />
      ) : (
        <StandardsContent />
      )}
    </Shell>
  );
}

function StandardsContent() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [data, setData] = useState<StandardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [selectedStandards, setSelectedStandards] = useState<Set<string>>(new Set());
  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"ai" | "fallback">("ai");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const toggleStandard = (code: string) => {
    setSelectedStandards((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
        setShowMaxWarning(false);
      } else {
        if (next.size >= MAX_SELECTED_STANDARDS) {
          setShowMaxWarning(true);
          return prev;
        }
        next.add(code);
        setShowMaxWarning(false);
      }
      return next;
    });
  };

  // Debounced semantic search
  const performSearch = useCallback(
    (query: string) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim()) {
        setSearchResults(null);
        setSearching(false);
        return;
      }

      setSearching(true);

      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const res = await fetch("/api/standards/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query.trim(), childId: selectedChild }),
            signal: controller.signal,
          });

          if (!res.ok) throw new Error("search failed");
          const data = await res.json();
          setSearchResults(data.results);
          setSearchMode("ai");
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          // Fallback: client-side filtering
          setSearchResults(null);
          setSearchMode("fallback");
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [selectedChild]
  );

  // Trigger search when query changes
  useEffect(() => {
    performSearch(searchQuery);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  const toggleSection = (subject: string) => {
    setCollapsedSections((prev) => ({ ...prev, [subject]: !prev[subject] }));
  };

  // Load children
  useEffect(() => {
    fetch("/api/children")
      .then((r) => r.json())
      .then((kids) => {
        setChildren(kids);
        const optedIn = kids.find((c: ChildData) => c.standardsOptIn);
        if (optedIn) setSelectedChild(optedIn.id);
        setLoading(false);
      });
  }, []);

  // Load standards when child changes
  useEffect(() => {
    if (!selectedChild) return;
    setLoadingStandards(true);
    fetch(`/api/standards?childId=${selectedChild}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load standards");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoadingStandards(false);
      })
      .catch(() => {
        setData(null);
        setLoadingStandards(false);
      });
  }, [selectedChild]);

  const child = children.find((c) => c.id === selectedChild);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: "#5A5A5A" }}>Loading...</p>
      </div>
    );
  }

  if (children.filter((c) => c.standardsOptIn).length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "#5A5A5A" }}>
        <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>No children have standards tracking enabled</p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Enable it in the{" "}
          <Link href="/children" style={{ color: "#6E6E9E" }} className="hover:underline">
            Children settings
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  if (child && !child.standardsOptIn) {
    return (
      <div className="text-center py-12" style={{ color: "#5A5A5A" }}>
        <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>Standards tracking is off for {child.name}</p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          You can enable it in the{" "}
          <Link href="/children" style={{ color: "#6E6E9E" }} className="hover:underline">
            Children settings
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  const progress = data?.subjects || [];
  const totalStandards = progress.reduce((sum, sp) => sum + sp.total, 0);
  const totalCovered = progress.reduce((sum, sp) => sum + sp.covered, 0);

  return (
    <>
      <div className="space-y-6" style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.5rem 4rem" }}>
        {/* Hero */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h1
              className="font-cormorant-sc"
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#1f2328",
                letterSpacing: "0.02em",
                margin: 0,
              }}
            >
              Track progress &amp; seed lessons
            </h1>
            {data && (
              <p style={{ fontSize: "0.88rem", color: "#5A5A5A", margin: "0.3rem 0 0", lineHeight: 1.5 }}>
                {data.state} · Grade {data.gradeLevel} · <strong style={{ color: "#1f2328" }}>{totalCovered}</strong> of {totalStandards} objectives covered for <strong style={{ color: "#1f2328" }}>{data.childName}</strong>
              </p>
            )}
          </div>

          {/* Child selector as frost-pill select */}
          <div style={{
            position: "relative",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "10px",
            padding: "0.5rem 0.75rem",
            display: "inline-flex",
            alignItems: "center",
          }}>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              style={{
                fontSize: "0.8rem",
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
                color: "#0B2E4A",
                background: "transparent",
                border: "none",
                outline: "none",
                paddingRight: "2rem",
                fontWeight: 500,
              }}
            >
              {children
                .filter((c) => c.standardsOptIn)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Grade {c.gradeLevel}
                  </option>
                ))}
            </select>
            <svg style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Search bar — clean, matches compass /standards */}
        {!loadingStandards && progress.length > 0 && (
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
                    border: "2px solid rgba(11,46,74,0.2)",
                    borderTopColor: "#0B2E4A",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
              </span>
            )}
            {searchQuery.trim() && searchMode === "fallback" && !searching && (
              <span
                style={{
                  display: "block",
                  fontSize: "0.68rem",
                  color: "#767676",
                  marginTop: "0.35rem",
                  paddingLeft: "0.2rem",
                }}
              >
                Showing basic keyword matches while semantic search recovers.
              </span>
            )}
          </div>
        )}

        {loadingStandards ? (
          <div className="flex items-center justify-center py-12">
            <p style={{ color: "#5A5A5A" }}>Loading standards...</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {progress.map((sp) => {
                const pct = sp.total > 0 ? Math.round((sp.covered / sp.total) * 100) : 0;
                const tone = subjectTone(sp.subject);
                return (
                  <div key={sp.subject} style={frostCard}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: tone.color, letterSpacing: "0.01em" }}>{sp.subject}</p>
                    <p className="font-cormorant-sc" style={{ fontSize: "1.65rem", fontWeight: 700, color: "#1f2328", marginTop: "0.15rem", letterSpacing: "0.02em" }}>{pct}%</p>
                    <p style={{ fontSize: "0.72rem", color: "#767676", marginTop: "0.1rem" }}>
                      {sp.covered} of {sp.total} objectives
                    </p>
                    <div style={{ marginTop: "0.55rem", background: tone.bg, borderRadius: "9999px", height: "0.4rem", overflow: "hidden" }}>
                      <div
                        style={{
                          background: tone.color,
                          borderRadius: "9999px",
                          height: "100%",
                          width: `${pct}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed checklists — search results or normal view */}
            {(() => {
              const query = searchQuery.trim();
              const isSearchActive = query.length > 0;
              const useApiResults = isSearchActive && searchResults !== null && searchMode === "ai";

              // Build the display data: either API search results grouped by subject,
              // or the original progress list (with optional client-side fallback filter).
              type DisplayStandard = { code: string; description: string; covered: boolean; lessonTitle: string | null; score?: number };
              type DisplaySubject = { subject: string; standards: DisplayStandard[]; coveredCount: number; totalCount: number; isSearchResult: boolean };

              let displaySubjects: DisplaySubject[];

              if (useApiResults) {
                // Group API search results by subject
                const grouped: Record<string, DisplayStandard[]> = {};
                for (const r of searchResults!) {
                  if (!grouped[r.subject]) grouped[r.subject] = [];
                  grouped[r.subject].push({
                    code: r.code,
                    description: r.description,
                    covered: r.covered,
                    lessonTitle: r.lessonTitle,
                    score: r.score,
                  });
                }
                displaySubjects = Object.entries(grouped).map(([subject, stds]) => ({
                  subject,
                  standards: stds,
                  coveredCount: stds.filter((s) => s.covered).length,
                  totalCount: stds.length,
                  isSearchResult: true,
                }));
              } else {
                // Normal or fallback client-side filtering
                const queryLower = query.toLowerCase();
                displaySubjects = progress.map((sp) => {
                  const filtered = isSearchActive
                    ? sp.standards.filter(
                        (std) =>
                          std.description.toLowerCase().includes(queryLower) ||
                          std.code.toLowerCase().includes(queryLower) ||
                          (std.lessonTitle && std.lessonTitle.toLowerCase().includes(queryLower))
                      )
                    : sp.standards;
                  return {
                    subject: sp.subject,
                    standards: filtered,
                    coveredCount: isSearchActive ? filtered.filter((s) => s.covered).length : sp.covered,
                    totalCount: isSearchActive ? filtered.length : sp.total,
                    isSearchResult: false,
                  };
                }).filter((ds) => !isSearchActive || ds.standards.length > 0);
              }

              return (
                <>
                  {/* Search result count */}
                  {isSearchActive && !searching && (
                    <p style={{ fontSize: "0.75rem", color: "#767676", paddingLeft: "0.2rem" }}>
                      {useApiResults
                        ? `${searchResults!.length} relevant standard${searchResults!.length !== 1 ? "s" : ""} found`
                        : `${displaySubjects.reduce((sum, ds) => sum + ds.standards.length, 0)} matching standard${displaySubjects.reduce((sum, ds) => sum + ds.standards.length, 0) !== 1 ? "s" : ""}`}
                    </p>
                  )}

                  {displaySubjects.map((ds) => {
                    const isCollapsed = collapsedSections[ds.subject] ?? false;

                    return (
                      <div key={ds.subject} style={{ ...frostCard, padding: 0, overflow: "hidden" }}>
                        <button
                          type="button"
                          onClick={() => toggleSection(ds.subject)}
                          style={{
                            padding: "1rem 1.25rem",
                            borderBottom: isCollapsed ? "none" : "1px solid rgba(0,0,0,0.06)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            borderBottomStyle: isCollapsed ? "none" : "solid",
                            borderBottomWidth: isCollapsed ? 0 : "1px",
                            borderBottomColor: "rgba(0,0,0,0.06)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#767676"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0,
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          <h2 className="font-cormorant-sc" style={{ fontSize: "1rem", color: "#0B2E4A", flex: 1 }}>
                            {ds.subject} — {isSearchActive ? `${ds.coveredCount}/${ds.totalCount} shown` : `${ds.coveredCount}/${ds.totalCount} covered`}
                          </h2>
                        </button>
                        {!isCollapsed && (
                          <div>
                            {ds.standards.map((std) => (
                              <div
                                key={std.code}
                                style={{
                                  padding: "0.7rem 1rem",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "0.7rem",
                                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                                  background: selectedStandards.has(std.code)
                                    ? "rgba(130,40,75,0.06)"
                                    : std.covered
                                      ? "rgba(122,158,138,0.08)"
                                      : "transparent",
                                  transition: "background 0.12s",
                                }}
                              >
                                {/* Selection checkbox — burgundy matches compass */}
                                <button
                                  type="button"
                                  onClick={() => toggleStandard(std.code)}
                                  aria-label={selectedStandards.has(std.code) ? `Deselect ${std.code}` : `Select ${std.code}`}
                                  style={{
                                    marginTop: "0.2rem",
                                    width: "1.1rem",
                                    height: "1.1rem",
                                    borderRadius: "4px",
                                    border: selectedStandards.has(std.code)
                                      ? "1.5px solid #82284b"
                                      : "1.5px solid rgba(0,0,0,0.22)",
                                    background: selectedStandards.has(std.code) ? "#82284b" : "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    color: "#fff",
                                    fontSize: "0.65rem",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  {selectedStandards.has(std.code) && <span>&#10003;</span>}
                                </button>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="flex items-center gap-2 flex-wrap" style={{ gap: "0.4rem" }}>
                                    {(() => {
                                      const tone = subjectTone(ds.subject);
                                      return (
                                        <span
                                          style={{
                                            fontFamily: "Menlo, 'SF Mono', monospace",
                                            fontSize: "0.66rem",
                                            fontWeight: 600,
                                            padding: "0.15rem 0.45rem",
                                            borderRadius: "4px",
                                            whiteSpace: "nowrap",
                                            background: tone.bg,
                                            color: tone.color,
                                          }}
                                        >
                                          {std.code}
                                        </span>
                                      );
                                    })()}
                                    {std.covered && (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.25rem",
                                          fontSize: "0.62rem",
                                          fontWeight: 600,
                                          padding: "0.15rem 0.45rem",
                                          borderRadius: "4px",
                                          background: "rgba(122,158,138,0.18)",
                                          color: "#5A947A",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        ✓ Covered
                                      </span>
                                    )}
                                    {std.score !== undefined && (
                                      <span
                                        style={{
                                          fontSize: "0.6rem",
                                          fontWeight: 600,
                                          padding: "0.15rem 0.45rem",
                                          borderRadius: "4px",
                                          background: "rgba(212,175,55,0.14)",
                                          color: "#B08A2E",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {Math.round(std.score * 100)}% match
                                      </span>
                                    )}
                                    {std.covered && std.lessonTitle && (
                                      <span style={{ fontSize: "0.66rem", color: "#767676", fontStyle: "italic" }}>
                                        via {std.lessonTitle}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "0.85rem", color: "#1f2328", marginTop: "0.2rem", lineHeight: 1.45 }}>{std.description}</p>
                                </div>
                              </div>
                            ))}
                            {ds.standards.length === 0 && !isSearchActive && (
                              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#767676" }}>
                                No standards found for this subject and grade.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isSearchActive && !searching && displaySubjects.length === 0 && (
                    <div style={{ textAlign: "center", padding: "2rem 0", color: "#5A5A5A" }}>
                      <p style={{ fontSize: "0.875rem" }}>No standards match your search.</p>
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: "#767676" }}>Try different keywords or a broader description.</p>
                    </div>
                  )}
                </>
              );
            })()}

            {progress.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#5A5A5A" }}>
                <p>No standards data available.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.25rem", color: "#767676" }}>Make sure the KG service is running.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating action bar — gradient tray matching /compass standards */}
      {selectedStandards.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "min(calc(100% - 2rem), 960px)",
            width: "calc(100% - 2rem)",
            background: "linear-gradient(135deg, rgba(11,46,74,0.96), rgba(110,110,158,0.96))",
            color: "#F9F6EF",
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.8rem",
            flexWrap: "wrap",
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(11,46,74,0.25)",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 500, flex: 1, minWidth: "200px" }}>
            <span className="font-cormorant-sc" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              {selectedStandards.size} standard{selectedStandards.size === 1 ? "" : "s"} selected
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.78)",
                display: "block",
                marginTop: "0.1rem",
              }}
            >
              {showMaxWarning
                ? `Max ${MAX_SELECTED_STANDARDS} — clear some to add more.`
                : `One lesson will cover all ${selectedStandards.size}${data?.childName ? ` for ${data.childName}` : ""}.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedStandards(new Set());
              setShowMaxWarning(false);
            }}
            style={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.75)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              padding: "0.4rem 0.75rem",
              borderRadius: "7px",
              fontFamily: "inherit",
            }}
          >
            Clear
          </button>
          <Link
            href={`/create?standards=${encodeURIComponent(
              Array.from(selectedStandards).join(",")
            )}`}
            onClick={() => {
              // Save descriptions to sessionStorage so create page can show tooltips
              const descMap: Record<string, string> = {};
              for (const sp of progress) {
                for (const std of sp.standards) {
                  if (selectedStandards.has(std.code)) {
                    descMap[std.code] = std.description;
                  }
                }
              }
              sessionStorage.setItem("standardDescriptions", JSON.stringify(descMap));
            }}
            style={{
              background: "#F9F6EF",
              color: "#0B2E4A",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
            }}
          >
            Create lesson covering {selectedStandards.size} standard{selectedStandards.size !== 1 ? "s" : ""} &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
