"use client";

import { Shell } from "@/components/shell";
import { TierGate } from "@/components/tier-gate";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { UPGRADE_URL } from "@/lib/upgradeUrl";
import { printWorksheet } from "@/lib/printWorksheet";
import { useFeatureFlagEnabled } from "posthog-js/react";

interface Child {
  id: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  standardsOptIn: boolean;
}

interface LessonData {
  id: string;
  title: string;
  subjects: string[];
  interest: string;
  lessonChildren: { child: { name: string } }[];
  calendarEntries: { scheduledDate: string }[];
  completions: { childId: string; starRating: number; completedAt: string; child: { name: string } }[];
  createdAt: string;
}

interface WorksheetItem {
  id: string;
  lessonId: string;
  childName: string | null;
  grade: string;
  philosophy: string;
  content: { title: string; sections: Array<{ type: string; title: string; instructions: string }> };
  createdAt: string;
  lesson: { id: string; title: string; philosophy: string };
}

interface CalendarLesson {
  id: string;
  title: string;
  subjects: string[];
  children: string[];
  completed: boolean;
  rating?: number;
}

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
};

const frostPill: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "0.25rem 0.6rem",
  fontWeight: 500,
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
  cursor: "pointer",
};

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  fontSize: "0.85rem",
};

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardPage() {
  const worksheetsEnabled = useFeatureFlagEnabled("worksheets_enabled");
  const [children, setChildren] = useState<Child[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [archetype, setArchetype] = useState<{ archetype: string; secondaryArchetype: string | null; resultId: string; topPhilosophyIds: string[] } | null>(null);
  const [tierData, setTierData] = useState<{ tier: string; childrenCount: number; childrenLimit: number; lessonsUsed: number; lessonsLimit: number; worksheetsUsed: number; worksheetsLimit: number; resetsAt: string } | null>(null);
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    Promise.all([
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/lessons").then((r) => r.json()),
      fetch("/api/user/archetype").then((r) => r.json()),
      fetch("/api/user/tier").then((r) => r.json()),
      fetch("/api/worksheets").then((r) => r.json()).catch(() => []),
    ]).then(([childrenData, lessonsData, archetypeData, tierDataRes, worksheetsData]) => {
      setChildren(childrenData);
      setLessons(lessonsData);
      if (archetypeData) setArchetype(archetypeData);
      setTierData(tierDataRes);
      setWorksheets(Array.isArray(worksheetsData) ? worksheetsData.slice(0, 5) : []);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const atChildLimit = !!tierData && tierData.childrenCount >= tierData.childrenLimit;
  const atLessonLimit = !!tierData && tierData.lessonsUsed >= tierData.lessonsLimit;

  // Upcoming: lessons with calendar entries in the future (or today) that have no completions
  const upcoming = lessons
    .filter((l) => {
      const entry = l.calendarEntries[0];
      if (!entry) return false;
      const date = entry.scheduledDate.split("T")[0];
      return date >= today && l.completions.length === 0;
    })
    .sort((a, b) => {
      const dateA = a.calendarEntries[0]?.scheduledDate || "";
      const dateB = b.calendarEntries[0]?.scheduledDate || "";
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Missed: past scheduled date, no completions
  const missed = lessons
    .filter((l) => {
      const entry = l.calendarEntries[0];
      if (!entry) return false;
      const date = entry.scheduledDate.split("T")[0];
      return date < today && l.completions.length === 0;
    })
    .sort((a, b) => {
      const dateA = a.calendarEntries[0]?.scheduledDate || "";
      const dateB = b.calendarEntries[0]?.scheduledDate || "";
      return dateB.localeCompare(dateA); // most recent missed first
    })
    .slice(0, 5);

  // Unscheduled: lessons with no calendar entries and no completions
  const unscheduled = lessons
    .filter((l) => l.calendarEntries.length === 0 && l.completions.length === 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Recent completions: lessons that have at least one completion, most recent first
  const recentCompletions = lessons
    .flatMap((l) =>
      l.completions.map((c) => ({
        id: l.id,
        title: l.title,
        childName: c.child?.name || "Unknown",
        rating: c.starRating,
        completedAt: c.completedAt.split("T")[0],
      }))
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5);

  // Build calendar lessonsByDate map
  const lessonsByDate = useMemo(() => {
    const byDate: Record<string, CalendarLesson[]> = {};
    for (const lesson of lessons) {
      for (const entry of lesson.calendarEntries) {
        const date = entry.scheduledDate.split("T")[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push({
          id: lesson.id,
          title: lesson.title,
          subjects: lesson.subjects,
          children: lesson.lessonChildren.map((lc) => lc.child.name),
          completed: lesson.completions.length > 0,
          rating: lesson.completions[0]?.starRating,
        });
      }
    }
    return byDate;
  }, [lessons]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || current.getDay() !== 0) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (dates.length > 42) break;
    }
    return dates;
  }, [currentDate]);

  const navigateWeek = (dir: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  const navigateMonth = (dir: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + dir);
      return next;
    });
  };

  // Compute age from dateOfBirth
  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const calendarToday = formatDate(new Date());

  if (loading) {
    return (
      <Shell hue="dashboard" fullWidth>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell hue="dashboard" fullWidth>
      <TierGate requiredTier="homestead" pageName="Dashboard" description="See your children's progress, upcoming lessons, and track your teaching journey">
      <div className="space-y-6" style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant-sc text-3xl text-gray-900">Dashboard</h1>
          {atLessonLimit ? (
            <a href={UPGRADE_URL} style={{
              ...nightButton, textDecoration: "none", opacity: 0.75, fontSize: "0.85rem",
            }}>
              {tierData!.lessonsUsed}/{tierData!.lessonsLimit} lessons · Upgrade →
            </a>
          ) : (
            <Link href="/create" style={nightButton}>
              Create Lesson
            </Link>
          )}
        </div>

        {/* ── USAGE SNAPSHOT ── */}
        {tierData && (
          <div style={{ ...frostCard, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Lessons bar */}
              <div style={{ flex: "1", minWidth: "120px" }}>
                <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: "0.3rem" }}>Lessons</p>
                <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: "4px", height: "5px", overflow: "hidden", marginBottom: "0.25rem" }}>
                  <div style={{
                    height: "100%", borderRadius: "4px",
                    width: `${Math.min(100, (tierData.lessonsUsed / (tierData.lessonsLimit || 1)) * 100)}%`,
                    background: tierData.lessonsUsed / tierData.lessonsLimit >= 0.9 ? "#B04040"
                      : tierData.lessonsUsed / tierData.lessonsLimit >= 0.6 ? "#C4983D"
                      : "#4a8b6e",
                  }} />
                </div>
                <p style={{ fontSize: "0.7rem", color: "#5A5A5A" }}>{tierData.lessonsUsed} / {tierData.lessonsLimit}</p>
              </div>
              {/* Worksheets bar (paid only, feature-flagged) */}
              {worksheetsEnabled && tierData.tier !== "compass" && (
                <div style={{ flex: "1", minWidth: "120px" }}>
                  <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: "0.3rem" }}>Worksheets</p>
                  <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: "4px", height: "5px", overflow: "hidden", marginBottom: "0.25rem" }}>
                    <div style={{
                      height: "100%", borderRadius: "4px",
                      width: `${Math.min(100, (tierData.worksheetsUsed / (tierData.worksheetsLimit || 1)) * 100)}%`,
                      background: tierData.worksheetsUsed / tierData.worksheetsLimit >= 0.9 ? "#B04040"
                        : tierData.worksheetsUsed / tierData.worksheetsLimit >= 0.6 ? "#C4983D"
                        : "#4a8b6e",
                    }} />
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#5A5A5A" }}>{tierData.worksheetsUsed} / {tierData.worksheetsLimit}</p>
                </div>
              )}
              {/* Tier badge + reset */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                <span style={{
                  fontSize: "0.62rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "5px",
                  background: "rgba(212,175,55,0.12)", color: "#9a7530", border: "1px solid rgba(212,175,55,0.25)",
                  textTransform: "capitalize",
                }}>
                  {tierData.tier}
                </span>
                {tierData.resetsAt && (
                  <p style={{ fontSize: "0.62rem", color: "#999" }}>
                    resets {new Date(tierData.resetsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── OVERVIEW SECTION ── */}

        {/* Archetype card */}
        {archetype ? (
          <div style={{ ...frostCard, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.35rem" }}>
                Your Teaching Archetype
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span className="font-cormorant-sc" style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                  {archetype.archetype.replace("the-", "The ")}
                </span>
                {archetype.secondaryArchetype && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    + {archetype.secondaryArchetype.replace("the-", "The ")}
                  </span>
                )}
                {archetype.topPhilosophyIds.map((id) => (
                  <span key={id} style={{
                    fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "5px",
                    background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)",
                    border: "1px solid rgba(110,110,158,0.2)",
                  }}>
                    {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
            <Link href={`/compass/results?id=${archetype.resultId}`}
              style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none" }}>
              View full results →
            </Link>
          </div>
        ) : (
          <div style={{ ...frostCard, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Discover your teaching archetype to personalize your lessons.
            </p>
            <Link href="/compass" className="btn-night" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem", textDecoration: "none", whiteSpace: "nowrap" }}>
              Take the Compass Assessment →
            </Link>
          </div>
        )}

        {/* Children summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} style={frostCard}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{child.name}</h3>
                <span style={{ ...frostPill, color: "#6E6E9E" }}>
                  Grade {child.gradeLevel}
                </span>
              </div>
              <p className="text-sm text-gray-600">Age {getAge(child.dateOfBirth)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Standards: {child.standardsOptIn ? "Tracking" : "Not tracking"}
              </p>
              {child.standardsOptIn && (
                <Link
                  href={`/standards?child=${child.id}`}
                  className="text-sm hover:underline mt-2 block"
                  style={{ color: "#6E6E9E" }}
                >
                  View progress
                </Link>
              )}
            </div>
          ))}
          {atChildLimit ? (
            <div className="rounded flex items-center justify-between"
              style={{
                background: "rgba(255,255,255,0.4)",
                border: "1px dashed rgba(255,255,255,0.6)",
                borderRadius: "12px",
                padding: "1.25rem",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#767676" }}>
                {tierData!.childrenCount}/{tierData!.childrenLimit} children
              </span>
              <a href={UPGRADE_URL} style={{
                fontSize: "0.78rem", fontWeight: 600, color: "#9a7530", textDecoration: "none",
                padding: "0.25rem 0.65rem", borderRadius: "6px",
                background: "rgba(196,152,61,0.1)", border: "1px solid rgba(196,152,61,0.25)",
              }}>
                Upgrade →
              </a>
            </div>
          ) : (
            <Link
              href="/account"
              className="rounded flex items-center justify-center text-gray-500 hover:text-gray-600"
              style={{
                background: "rgba(255,255,255,0.4)",
                border: "1px dashed rgba(255,255,255,0.6)",
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              + Add child
            </Link>
          )}
        </div>

        {/* Upcoming lessons */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-cormorant-sc text-xl text-gray-900">Upcoming Lessons</h2>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {upcoming.length === 0 && lessons.length === 0 && (
              <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                <p className="font-cormorant-sc" style={{ fontSize: "1rem", color: "#0B2E4A", marginBottom: "0.5rem" }}>
                  Ready to create your first lesson?
                </p>
                <p style={{ fontSize: "0.8rem", color: "#767676", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Take the Compass Assessment to discover your teaching style, then generate a lesson tailored to your philosophy and your child&apos;s interests.
                </p>
                <Link href="/create" style={{
                  background: "#0B2E4A", color: "#F9F6EF", borderRadius: "10px",
                  padding: "0.55rem 1.4rem", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500,
                }}>
                  Create My First Lesson
                </Link>
              </div>
            )}
            {upcoming.length === 0 && lessons.length > 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No upcoming lessons scheduled.{" "}
                <Link href="/create" className="hover:underline" style={{ color: "#6E6E9E" }}>
                  Create one
                </Link>
              </div>
            )}
            {upcoming.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block p-4 hover:bg-white/30 transition-colors"
                style={idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <div className="flex gap-2 mt-1">
                      {lesson.subjects.map((s) => (
                        <span key={s} style={{ ...frostPill, color: "#6E6E9E" }}>
                          {s}
                        </span>
                      ))}
                      {lesson.lessonChildren.map((lc) => (
                        <span key={lc.child.name} style={frostPill}>
                          {lc.child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {lesson.calendarEntries[0]?.scheduledDate.split("T")[0]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Unscheduled lessons — created but no date assigned */}
        {unscheduled.length > 0 && (
          <div>
            <h2 className="font-cormorant-sc text-xl text-gray-900 mb-3">Unscheduled Lessons</h2>
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {unscheduled.map((lesson, idx) => (
                <Link
                  href={`/lessons/${lesson.id}`}
                  key={lesson.id}
                  className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                  style={{ display: "flex", textDecoration: "none", ...(idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}) }}
                >
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <div className="flex gap-2 mt-1">
                      {lesson.subjects.map((s) => (
                        <span key={s} style={{ ...frostPill, color: "#6E6E9E" }}>
                          {s}
                        </span>
                      ))}
                      {lesson.lessonChildren.map((lc) => (
                        <span key={lc.child.name} style={frostPill}>
                          {lc.child.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                    Created {lesson.createdAt.split("T")[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Needs attention — past due, not completed */}
        {missed.length > 0 && (
          <div>
            <h2 className="font-cormorant-sc text-xl text-gray-900 mb-3">Needs Attention</h2>
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(196,152,61,0.2)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {missed.map((lesson, idx) => {
                const date = lesson.calendarEntries[0]?.scheduledDate.split("T")[0] || "";
                const daysAgo = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
                return (
                  <Link
                    href={`/lessons/${lesson.id}`}
                    key={lesson.id}
                    className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                    style={{ display: "flex", textDecoration: "none", ...(idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}) }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        Scheduled {date} — {daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      background: "rgba(196,152,61,0.1)",
                      color: "#B08A2E",
                      whiteSpace: "nowrap",
                    }}>
                      Not completed
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent completions */}
        <div>
          <h2 className="font-cormorant-sc text-xl text-gray-900 mb-3">Recent Completions</h2>
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {recentCompletions.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No completed lessons yet.
              </div>
            )}
            {recentCompletions.map((completion, idx) => (
              <Link
                href={`/lessons/${completion.id}`}
                key={`${completion.id}-${idx}`}
                className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
                style={{ display: "flex", textDecoration: "none", ...(idx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)" } : {}) }}
              >
                <div>
                  <p className="font-medium text-gray-900">{completion.title}</p>
                  <p className="text-sm text-gray-500">{completion.childName} — {completion.completedAt}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= completion.rating ? "text-yellow-400" : "text-gray-200"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── RECENT WORKSHEETS (feature-flagged) ── */}
        {worksheetsEnabled && worksheets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-cormorant-sc text-xl text-gray-900">Recent Worksheets</h2>
              <Link href="/lessons?tab=worksheets" className="text-sm hover:underline" style={{ color: "#6E6E9E" }}>
                View all
              </Link>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {worksheets.map((ws) => (
                <div key={ws.id} style={{
                  flex: "0 0 200px",
                  background: "rgba(255,255,255,0.82)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: "10px",
                  padding: "0.875rem",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize: "0.78rem", color: "#0B2E4A", fontWeight: 600, marginBottom: "0.3rem", lineHeight: 1.35 }}>
                    {ws.lesson.title}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#767676", marginBottom: "0.6rem" }}>
                    {ws.childName ? `${ws.childName} · ` : ""}Grade {ws.grade} · {new Date(ws.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <button
                    onClick={() => printWorksheet(ws)}
                    style={{
                      fontSize: "0.65rem", color: "#6E6E9E",
                      background: "transparent", border: "1px solid rgba(110,110,158,0.2)",
                      borderRadius: "5px", padding: "0.2rem 0.5rem", cursor: "pointer",
                    }}
                  >
                    Print
                  </button>
                </div>
              ))}
              <Link href="/lessons" style={{
                flex: "0 0 160px",
                background: "rgba(255,255,255,0.35)",
                border: "1px dashed rgba(110,110,158,0.2)",
                borderRadius: "10px",
                padding: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                textDecoration: "none",
                fontSize: "0.72rem",
                color: "#9999BB",
                lineHeight: 1.5,
              }}>
                Create a worksheet<br />from any lesson
              </Link>
            </div>
          </div>
        )}

        {/* ── SECTION DIVIDER ── */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "1.5rem" }}>
          <h2 className="font-cormorant-sc text-2xl text-gray-900 mb-4">Your Schedule</h2>
        </div>

        {/* ── CALENDAR SECTION ── */}
        <div className="space-y-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <button
                onClick={() => setView("week")}
                style={
                  view === "week"
                    ? { ...frostPillBase, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A", fontSize: "0.8rem", padding: "0.35rem 0.8rem" }
                    : { ...frostPillBase, fontSize: "0.8rem", padding: "0.35rem 0.8rem", color: "#5A5A5A" }
                }
              >
                Week
              </button>
              <button
                onClick={() => setView("month")}
                style={
                  view === "month"
                    ? { ...frostPillBase, background: "#0B2E4A", color: "#F9F6EF", border: "1px solid #0B2E4A", fontSize: "0.8rem", padding: "0.35rem 0.8rem" }
                    : { ...frostPillBase, fontSize: "0.8rem", padding: "0.35rem 0.8rem", color: "#5A5A5A" }
                }
              >
                Month
              </button>
            </div>
          </div>

          {/* Calendar navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => (view === "week" ? navigateWeek(-1) : navigateMonth(-1))}
              style={frostPillBase}
            >
              &larr; Previous
            </button>
            <h3 className="font-cormorant-sc" style={{ fontSize: "1.1rem", color: "#0B2E4A" }}>
              {view === "week"
                ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => (view === "week" ? navigateWeek(1) : navigateMonth(1))}
              style={frostPillBase}
            >
              Next &rarr;
            </button>
          </div>

          {/* Week View */}
          {view === "week" && (
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const dateStr = formatDate(date);
                const calLessons = lessonsByDate[dateStr] || [];
                const isToday = dateStr === calendarToday;

                return (
                  <div
                    key={dateStr}
                    style={{
                      background: calLessons.length > 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)",
                      backdropFilter: "blur(12px)",
                      border: isToday ? "1px solid rgba(110,110,158,0.4)" : "1px solid rgba(255,255,255,0.5)",
                      borderRadius: "10px",
                      padding: "0.6rem",
                      minHeight: "10rem",
                      boxShadow: calLessons.length > 0 ? "0 2px 10px rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    <div className="text-center mb-2">
                      <p
                        style={{
                          fontSize: "0.65rem",
                          color: "#767676",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontVariantCaps: "small-caps",
                        }}
                      >
                        {DAY_NAMES[date.getDay()]}
                      </p>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: isToday ? "#6E6E9E" : "#0B2E4A",
                        }}
                      >
                        {date.getDate()}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {calLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/lessons/${lesson.id}`}
                          style={{
                            display: "block",
                            padding: "0.375rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "0.7rem",
                            textDecoration: "none",
                            background: lesson.completed
                              ? "rgba(122,158,138,0.15)"
                              : "rgba(255,255,255,0.72)",
                            border: isToday
                              ? "1px solid rgba(255,255,255,0.5)"
                              : "1px solid rgba(255,255,255,0.5)",
                            borderLeft: isToday ? "3px solid #6E6E9E" : lesson.completed ? "3px solid #7A9E8A" : "1px solid rgba(255,255,255,0.5)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          <p style={{ fontWeight: 500, color: "#0B2E4A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lesson.title}
                          </p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {lesson.children.map((c) => (
                              <span key={c} style={{ color: "#767676", fontSize: "0.65rem" }}>{c}</span>
                            ))}
                          </div>
                          {lesson.completed && lesson.rating && (
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} style={{ fontSize: "0.625rem", color: s <= lesson.rating! ? "#C4983D" : "rgba(0,0,0,0.12)" }}>★</span>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Month View */}
          {view === "month" && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(255,255,255,0.3)", borderRadius: "10px 10px 0 0", marginBottom: "1px" }}>
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: "center",
                      padding: "0.5rem 0",
                      fontSize: "0.65rem",
                      color: "#767676",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontVariantCaps: "small-caps",
                      background: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(0,0,0,0.04)", borderRadius: "0 0 10px 10px" }}>
                {monthDates.map((date) => {
                  const dateStr = formatDate(date);
                  const calLessons = lessonsByDate[dateStr] || [];
                  const isToday = dateStr === calendarToday;
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={dateStr}
                      style={{
                        background: isToday ? "rgba(110,110,158,0.08)" : "rgba(255,255,255,0.6)",
                        padding: "0.5rem",
                        minHeight: "5rem",
                        opacity: isCurrentMonth ? 1 : 0.4,
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.75rem",
                          marginBottom: "0.25rem",
                          color: isToday ? "#6E6E9E" : "#767676",
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {date.getDate()}
                      </p>
                      {calLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/lessons/${lesson.id}`}
                          style={{
                            display: "block",
                            fontSize: "0.625rem",
                            padding: "0.2rem 0.375rem",
                            borderRadius: "4px",
                            marginBottom: "0.125rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: "none",
                            background: lesson.completed
                              ? "rgba(122,158,138,0.15)"
                              : "rgba(255,255,255,0.72)",
                            color: lesson.completed ? "#5A947A" : "#6E6E9E",
                            border: "1px solid rgba(255,255,255,0.5)",
                          }}
                        >
                          {lesson.title}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Link href="/create" style={{ ...nightButton, display: "inline-block", textDecoration: "none" }}>
              + Create New Lesson
            </Link>
          </div>
        </div>
      </div>
      </TierGate>
    </Shell>
  );
}
