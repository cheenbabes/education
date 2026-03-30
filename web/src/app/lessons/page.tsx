"use client";

import { Shell } from "@/components/shell";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { PHILOSOPHY_LABELS, PHILOSOPHY_COLORS, resolvePhilosophyKey } from "@/lib/compass/scoring";

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  interest: string;
  subjects: string[];
  subjectNames: string[];
  philosophy: string;
  favorite: boolean;
  content: Record<string, unknown>;
  lessonChildren: { child: { id: string; name: string } }[];
  completions: { starRating: number }[];
  calendarEntries: { scheduledDate: string }[];
  createdAt: string;
}

interface ChildData {
  id: string;
  name: string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.55)",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const frostPill: React.CSSProperties = {
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

const frostInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "8px",
  padding: "0.45rem 0.75rem",
  fontSize: "0.8rem",
  color: "#0B2E4A",
  outline: "none",
  width: "100%",
  maxWidth: "320px",
};

const frostSelect: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "8px",
  padding: "0.35rem 0.6rem",
  fontSize: "0.7rem",
  fontWeight: 500,
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  cursor: "pointer",
  color: "#0B2E4A",
  outline: "none",
  paddingRight: "1.6rem",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "rated" | "philosophy" | "alpha";

function getScheduledDate(lesson: LessonData): string | null {
  return lesson.calendarEntries[0]?.scheduledDate?.split("T")[0] || null;
}

function getDisplayDate(lesson: LessonData): string {
  const scheduled = getScheduledDate(lesson);
  const raw = scheduled || lesson.createdAt.split("T")[0];
  return new Date(raw + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDuration(lesson: LessonData): number | null {
  const dur = (lesson.content as Record<string, unknown>)?.estimated_duration_minutes;
  return typeof dur === "number" ? dur : null;
}

function getTimePeriod(lesson: LessonData): string {
  const raw = getScheduledDate(lesson) || lesson.createdAt.split("T")[0];
  const date = new Date(raw + "T12:00:00");
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfWeek) return "This Week";
  if (date >= lastWeekStart) return "Last Week";
  if (date >= startOfMonth) return "Earlier This Month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function sortLessons(lessons: LessonData[], sortKey: SortKey): LessonData[] {
  const sorted = [...lessons];
  switch (sortKey) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "rated":
      return sorted.sort((a, b) => (b.completions[0]?.starRating || 0) - (a.completions[0]?.starRating || 0));
    case "philosophy":
      return sorted.sort((a, b) => a.philosophy.localeCompare(b.philosophy));
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

function Chevron() {
  return (
    <svg
      style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "saved">("all");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [philFilter, setPhilFilter] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  useEffect(() => {
    Promise.all([
      fetch("/api/lessons?userId=demo-user").then((r) => r.json()),
      fetch("/api/children?userId=demo-user").then((r) => r.json()),
    ]).then(([lessonsData, childrenData]) => {
      setLessons(lessonsData);
      setChildren(childrenData);
      setLoading(false);
    });
  }, []);

  // Distinct philosophies present in lessons
  const availablePhilosophies = useMemo(() => {
    const set = new Set(lessons.map((l) => l.philosophy));
    return Array.from(set).sort();
  }, [lessons]);

  // Distinct subject names present in lessons
  const availableSubjects = useMemo(() => {
    const set = new Set(lessons.flatMap((l) => l.subjectNames || []));
    return Array.from(set).sort();
  }, [lessons]);

  // Filter pipeline
  const filtered = useMemo(() => {
    let result = lessons;

    // Status
    if (statusFilter === "pending") result = result.filter((l) => l.completions.length === 0);
    if (statusFilter === "completed") result = result.filter((l) => l.completions.length > 0);
    if (statusFilter === "saved") result = result.filter((l) => l.favorite);

    // Child
    if (childFilter !== "all") {
      result = result.filter((l) => l.lessonChildren.some((lc) => lc.child.id === childFilter));
    }

    // Philosophy
    if (philFilter.size > 0) {
      result = result.filter((l) => philFilter.has(l.philosophy));
    }

    // Subject
    if (subjectFilter.size > 0) {
      result = result.filter((l) => (l.subjectNames || []).some((s) => subjectFilter.has(s)));
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((l) => {
        const philKey = resolvePhilosophyKey(l.philosophy);
        const philLabel = PHILOSOPHY_LABELS[philKey].toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.interest.toLowerCase().includes(q) ||
          (l.subjectNames || []).join(" ").toLowerCase().includes(q) ||
          l.subjects.join(" ").toLowerCase().includes(q) ||
          philLabel.includes(q) ||
          l.lessonChildren.some((lc) => lc.child.name.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    result = sortLessons(result, sortKey);

    return result;
  }, [lessons, statusFilter, childFilter, philFilter, subjectFilter, searchTerm, sortKey]);

  // Group by time period
  const grouped = useMemo(() => {
    const groups: { label: string; lessons: LessonData[] }[] = [];
    const map = new Map<string, LessonData[]>();

    for (const l of filtered) {
      const period = getTimePeriod(l);
      if (!map.has(period)) map.set(period, []);
      map.get(period)!.push(l);
    }

    map.forEach((items, label) => {
      groups.push({ label, lessons: items });
    });

    return groups;
  }, [filtered]);

  // Stats
  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => l.completions.length > 0).length;
  const pendingCount = totalLessons - completedCount;
  const savedCount = lessons.filter((l) => l.favorite).length;
  const uniqueChildren = new Set(lessons.flatMap((l) => l.lessonChildren.map((lc) => lc.child.id))).size;

  // Toggle favorite
  const toggleFavorite = async (lessonId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/lessons/${lessonId}/favorite`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setLessons((prev) => prev.map((l) => (l.id === updated.id ? { ...l, favorite: updated.favorite } : l)));
    }
  };

  // Toggle philosophy filter
  const togglePhil = (phil: string) => {
    setPhilFilter((prev) => {
      const next = new Set(prev);
      if (next.has(phil)) next.delete(phil);
      else next.add(phil);
      return next;
    });
  };

  // Toggle subject filter
  const toggleSubject = (subject: string) => {
    setSubjectFilter((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  if (loading) {
    return (
      <Shell hue="lessons">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell hue="lessons">
      <div className="space-y-4">
        <h1 className="font-cormorant-sc text-3xl" style={{ color: "#0B2E4A" }}>
          All Lessons
        </h1>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <div style={{ ...frostCard, padding: "0.75rem 1.25rem" }} className="flex gap-4 flex-wrap">
          <span style={{ fontSize: "0.75rem", color: "#0B2E4A", fontWeight: 600 }}>{totalLessons} lessons</span>
          <span style={{ fontSize: "0.75rem", color: "#5A947A" }}>{completedCount} completed</span>
          <span style={{ fontSize: "0.75rem", color: "#C07A42" }}>{pendingCount} pending</span>
          {savedCount > 0 && <span style={{ fontSize: "0.75rem", color: "#C4983D" }}>{savedCount} saved</span>}
          <span style={{ fontSize: "0.75rem", color: "#767676" }}>{uniqueChildren} children</span>
        </div>

        {/* ── Search + filters row ──────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Search + sort + child filter */}
          <div className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={frostInput}
            />

            {/* Sort dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={frostSelect}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="rated">Highest rated</option>
                <option value="philosophy">By philosophy</option>
                <option value="alpha">Alphabetical</option>
              </select>
              <Chevron />
            </div>

            {/* Child dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={childFilter}
                onChange={(e) => setChildFilter(e.target.value)}
                style={frostSelect}
              >
                <option value="all">All children</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Status tabs + philosophy pills */}
          <div className="flex gap-3 flex-wrap items-center">
            {/* Status tabs */}
            <div className="flex gap-1">
              {(["all", "pending", "completed", "saved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={
                    statusFilter === f
                      ? { ...frostPill, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A", cursor: "pointer" }
                      : { ...frostPill, cursor: "pointer", color: "#5A5A5A" }
                  }
                >
                  {f === "saved" ? "Saved" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "saved" && " \u2661"}
                </button>
              ))}
            </div>

            {/* Philosophy filter pills */}
            {availablePhilosophies.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                {availablePhilosophies.map((phil) => {
                  const active = philFilter.has(phil);
                  const key = resolvePhilosophyKey(phil);
                  const color = PHILOSOPHY_COLORS[key] || "#6E6E9E";
                  const label = PHILOSOPHY_LABELS[key].split(/[\s/]/)[0];
                  return (
                    <button
                      key={phil}
                      onClick={() => togglePhil(phil)}
                      style={{
                        ...frostPill,
                        cursor: "pointer",
                        color: active ? "#fff" : color,
                        background: active ? color : `${color}10`,
                        border: `1px solid ${active ? color : `${color}30`}`,
                        fontSize: "0.65rem",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                {philFilter.size > 0 && (
                  <button
                    onClick={() => setPhilFilter(new Set())}
                    style={{ ...frostPill, cursor: "pointer", color: "#999", fontSize: "0.6rem" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Subject filter pills */}
            {availableSubjects.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {availableSubjects.map((subject) => {
                  const active = subjectFilter.has(subject);
                  const color = "#4A8B6E";
                  return (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject)}
                      style={{
                        ...frostPill,
                        cursor: "pointer",
                        color: active ? "#fff" : color,
                        background: active ? color : `${color}10`,
                        border: `1px solid ${active ? color : `${color}30`}`,
                        fontSize: "0.65rem",
                      }}
                    >
                      {subject}
                    </button>
                  );
                })}
                {subjectFilter.size > 0 && (
                  <button
                    onClick={() => setSubjectFilter(new Set())}
                    style={{ ...frostPill, cursor: "pointer", color: "#999", fontSize: "0.6rem" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Grouped lesson list ───────────────────────────────────────── */}
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="font-cormorant-sc" style={{ fontSize: "0.85rem", color: "#767676", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.lessons.map((lesson) => {
                  const isCompleted = lesson.completions.length > 0;
                  const rating = lesson.completions[0]?.starRating;
                  const philKey = resolvePhilosophyKey(lesson.philosophy);
                  const philoColor = PHILOSOPHY_COLORS[philKey] || "#6E6E9E";
                  const philoLabel = PHILOSOPHY_LABELS[philKey] || lesson.philosophy.replace(/_/g, " ");
                  const duration = getDuration(lesson);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      style={{ display: "block", textDecoration: "none" }}
                    >
                      <div style={{ ...frostCard, transition: "box-shadow 0.15s, transform 0.15s" }} className="hover-frost-card">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title + status */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {/* Favorite heart */}
                              <button
                                onClick={(e) => toggleFavorite(lesson.id, e)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer", padding: 0,
                                  fontSize: "1rem", color: lesson.favorite ? "#C4983D" : "rgba(0,0,0,0.12)",
                                  lineHeight: 1,
                                }}
                                title={lesson.favorite ? "Remove from saved" : "Save lesson"}
                              >
                                {lesson.favorite ? "\u2665" : "\u2661"}
                              </button>

                              <p style={{ fontSize: "0.95rem", fontWeight: 500, color: "#0B2E4A" }}>{lesson.title}</p>

                              {isCompleted && (
                                <span style={{
                                  fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px",
                                  borderRadius: "4px", background: "rgba(122,158,138,0.15)",
                                  color: "#5A947A", border: "1px solid rgba(122,158,138,0.3)",
                                }}>
                                  Done
                                </span>
                              )}
                            </div>

                            {/* Tags row */}
                            <div className="flex gap-1.5 flex-wrap">
                              {/* Philosophy */}
                              <span style={{
                                ...frostPill,
                                color: philoColor,
                                background: `${philoColor}12`,
                                border: `1px solid ${philoColor}25`,
                              }}>
                                {philoLabel}
                              </span>

                              {/* Interest */}
                              <span style={{
                                ...frostPill,
                                color: "#9B7E8E",
                                background: "rgba(155,126,142,0.08)",
                                border: "1px solid rgba(155,126,142,0.2)",
                              }}>
                                {lesson.interest}
                              </span>

                              {/* Duration */}
                              {duration && (
                                <span style={{
                                  ...frostPill,
                                  color: "#5A7FA0",
                                  background: "rgba(90,127,160,0.08)",
                                  border: "1px solid rgba(90,127,160,0.2)",
                                  fontSize: "0.65rem",
                                }}>
                                  {duration} min
                                </span>
                              )}

                              {/* Children */}
                              {lesson.lessonChildren.map((lc) => (
                                <span key={lc.child.id} style={{
                                  ...frostPill,
                                  color: "#5A5A5A",
                                  background: "rgba(0,0,0,0.03)",
                                  border: "1px solid rgba(0,0,0,0.08)",
                                  fontSize: "0.65rem",
                                }}>
                                  {lc.child.name}
                                </span>
                              ))}

                              {/* Subjects */}
                              {(lesson.subjectNames || []).map((s) => (
                                <span key={s} style={{
                                  ...frostPill,
                                  color: "#4A8B6E",
                                  background: "rgba(74,139,110,0.08)",
                                  border: "1px solid rgba(74,139,110,0.2)",
                                  fontSize: "0.65rem",
                                }}>
                                  {s}
                                </span>
                              ))}
                            </div>

                            {/* Standards — compact line */}
                            {lesson.subjects.length > 0 && (
                              <p style={{ fontSize: "0.6rem", color: "#999", fontFamily: "monospace", marginTop: "0.35rem" }}>
                                {lesson.subjects.join(" · ")}
                              </p>
                            )}
                          </div>

                          {/* Right: date + rating */}
                          <div className="text-right flex-shrink-0">
                            <p style={{ fontSize: "0.7rem", color: "#999" }}>
                              {getDisplayDate(lesson)}
                            </p>
                            {rating && (
                              <div className="flex gap-0.5 justify-end mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span key={s} style={{ fontSize: "0.8rem", color: s <= rating ? "#C4983D" : "rgba(0,0,0,0.1)" }}>★</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <p className="font-cormorant-sc" style={{ fontSize: "1.25rem", color: "#767676", fontStyle: "italic" }}>
                {searchTerm ? "No lessons match your search." : "No lessons match your filters."}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex justify-end pt-2">
          <Link href="/create">
            <button style={{ background: "#0B2E4A", color: "#F9F6EF", borderRadius: "10px", padding: "0.6rem 1.4rem", border: "none", cursor: "pointer" }} className="text-sm font-medium">
              + Create Lesson
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        .hover-frost-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
      `}</style>
    </Shell>
  );
}
