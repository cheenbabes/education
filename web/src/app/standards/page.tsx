"use client";

import { Shell } from "@/components/shell";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CompassStandards } from "./compass-standards";

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

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const frostPillBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "0.25rem 0.6rem",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
};

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>Standards Progress</h1>
            {data && (
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.25rem" }}>
                {data.state} — Grade {data.gradeLevel} — {totalCovered} of {totalStandards} objectives covered
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

        {/* Search bar */}
        {!loadingStandards && progress.length > 0 && (
          <div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standards — try natural language like &quot;fractions&quot; or &quot;reading comprehension&quot;..."
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: "8px",
                  padding: "0.45rem 0.75rem",
                  paddingRight: searching ? "2.5rem" : "0.75rem",
                  fontSize: "0.8rem",
                  color: "#0B2E4A",
                  width: "100%",
                  outline: "none",
                }}
              />
              {searching && (
                <span
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "0.9rem",
                    height: "0.9rem",
                    border: "2px solid rgba(11,46,74,0.2)",
                    borderTopColor: "#0B2E4A",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "0.35rem",
                paddingLeft: "0.2rem",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4983D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <line x1="9" y1="21" x2="15" y2="21" />
                <line x1="10" y1="24" x2="14" y2="24" />
              </svg>
              <span style={{ fontSize: "0.65rem", color: "#C4983D", fontWeight: 500, letterSpacing: "0.02em" }}>
                Search understands synonyms and related concepts
              </span>
              {searchQuery.trim() && searchMode === "fallback" && !searching && (
                <span style={{ fontSize: "0.6rem", color: "#767676", marginLeft: "0.25rem" }}>
                  (using basic matching)
                </span>
              )}
            </div>
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
                return (
                  <div key={sp.subject} style={frostCard}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0B2E4A" }}>{sp.subject}</p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6E6E9E", marginTop: "0.25rem" }}>{pct}%</p>
                    <p style={{ fontSize: "0.75rem", color: "#767676" }}>
                      {sp.covered} of {sp.total} objectives
                    </p>
                    <div style={{ marginTop: "0.5rem", background: "rgba(0,0,0,0.08)", borderRadius: "9999px", height: "0.5rem" }}>
                      <div
                        style={{
                          background: "#6E6E9E",
                          borderRadius: "9999px",
                          height: "0.5rem",
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
                                  padding: "0.75rem 1.25rem",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "0.75rem",
                                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                                  background: selectedStandards.has(std.code)
                                    ? "rgba(196,152,61,0.08)"
                                    : std.covered
                                      ? "rgba(122,158,138,0.1)"
                                      : "transparent",
                                }}
                              >
                                {/* Selection checkbox */}
                                <button
                                  type="button"
                                  onClick={() => toggleStandard(std.code)}
                                  style={{
                                    marginTop: "0.125rem",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    borderRadius: "4px",
                                    border: selectedStandards.has(std.code)
                                      ? "2px solid #C4983D"
                                      : "1.5px solid rgba(0,0,0,0.2)",
                                    background: selectedStandards.has(std.code) ? "#C4983D" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    color: "#fff",
                                    fontSize: "0.7rem",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  {selectedStandards.has(std.code) && <span>&#10003;</span>}
                                </button>

                                {/* Coverage indicator */}
                                {std.covered && (
                                  <div
                                    style={{
                                      marginTop: "0.25rem",
                                      width: "0.75rem",
                                      height: "0.75rem",
                                      borderRadius: "50%",
                                      background: "#7A9E8A",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      color: "#fff",
                                      fontSize: "0.5rem",
                                    }}
                                  >
                                    <span>&#10003;</span>
                                  </div>
                                )}

                                <div style={{ flex: 1 }}>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      style={{
                                        fontFamily: "monospace",
                                        fontSize: "0.7rem",
                                        color: "#767676",
                                      }}
                                    >
                                      {std.code}
                                    </span>
                                    {std.score !== undefined && (
                                      <span style={{ ...frostPillBase, color: "#C4983D", background: "rgba(196,152,61,0.1)", border: "1px solid rgba(196,152,61,0.25)", fontSize: "0.6rem" }}>
                                        {Math.round(std.score * 100)}% match
                                      </span>
                                    )}
                                    {std.covered && std.lessonTitle && (
                                      <span style={{ ...frostPillBase, color: "#5A947A", background: "rgba(122,158,138,0.15)", border: "1px solid rgba(122,158,138,0.3)", fontSize: "0.65rem" }}>
                                        via: {std.lessonTitle}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.125rem" }}>{std.description}</p>
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

      {/* Floating action bar */}
      {selectedStandards.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.5)",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            zIndex: 50,
            boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
          }}
        >
          {showMaxWarning && (
            <p style={{ fontSize: "0.75rem", color: "#C4983D", fontWeight: 500 }}>
              Maximum {MAX_SELECTED_STANDARDS} standards allowed
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedStandards(new Set());
              setShowMaxWarning(false);
            }}
            style={{
              fontSize: "0.8rem",
              color: "#767676",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.4rem 0.6rem",
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
              background: "#0B2E4A",
              color: "#F9F6EF",
              borderRadius: "10px",
              padding: "0.6rem 1.4rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            Create lesson covering {selectedStandards.size} standard{selectedStandards.size !== 1 ? "s" : ""} &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
