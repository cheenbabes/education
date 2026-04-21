"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { UPGRADE_URL } from "@/lib/upgradeUrl";
import { printWorksheet } from "@/lib/printWorksheet";
import { ArchetypeAvatar } from "@/components/archetype-avatar";
import {
  SHARED_SHADOW,
  quotaHeroStyle,
  archetypeStripStyle,
  archetypeInviteStyle,
  frostCardStyle,
} from "@/components/dashboard-cards";

/* ───────────── Types ───────────── */

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
  philosophy?: string | null;
  favorite?: boolean;
  lessonChildren: { child: { id: string; name: string } }[];
  calendarEntries: { scheduledDate: string }[];
  completions: {
    childId: string;
    starRating: number;
    completedAt: string;
    child: { name: string };
  }[];
  createdAt: string;
}

interface WorksheetItem {
  id: string;
  lessonId: string;
  childName: string | null;
  grade: string;
  philosophy: string;
  content: {
    title: string;
    sections: Array<{ type: string; title: string; instructions: string }>;
  };
  createdAt: string;
  lesson: { id: string; title: string; philosophy: string };
}

interface TierData {
  tier: string;
  childrenCount: number;
  childrenLimit: number;
  lessonsUsed: number;
  lessonsLimit: number;
  worksheetsUsed: number;
  worksheetsLimit: number;
  resetsAt: string;
}

interface ArchetypeData {
  resultId: string;
  archetype: string;
  secondaryArchetype: string | null;
  topPhilosophyIds: string[];
}

interface PaidDashboardProps {
  tierData: TierData;
}

type LessonTab = "all" | "upcoming" | "attention" | "unscheduled" | "completed" | "favorites";

/* ───────────── Tokens + helpers ───────────── */

const NIGHT = "#0B2E4A";
const PARCHMENT = "#F9F6EF";
const ACCENT_PRIMARY = "#6E6E9E";
const ACCENT_SECONDARY = "#82284b";
const TEXT_SECONDARY = "#5A5A5A";
const TEXT_TERTIARY = "#767676";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? "1 week ago" : `${w} weeks ago`;
  }
  const m = Math.floor(days / 30);
  return m === 1 ? "1 month ago" : `${m} months ago`;
}

function formatResetDate(iso: string | undefined): string {
  const target = nextValidResetDate(iso);
  if (!target) return "next month";
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Returns a Date safely in the future for "next reset" copy. Falls back to
 * the first of next calendar month if `iso` is missing, unparseable, or in
 * the past (which happens when Clerk returns a stale periodEnd for tier-
 * override accounts or accounts that haven't renewed yet).
 */
function nextValidResetDate(iso: string | undefined): Date | null {
  const firstOfNextMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  };
  if (!iso) return firstOfNextMonth();
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return firstOfNextMonth();
  if (parsed.getTime() <= Date.now()) return firstOfNextMonth();
  return parsed;
}

function prettyArchetype(slug: string): string {
  return slug
    .replace(/^the-/, "The ")
    .split("-")
    .map((s) => (s[0] ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ")
    .replace(/^The\s/, "The ");
}

function prettyPhilosophy(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function childAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function parseTab(raw: string | null): LessonTab {
  const set = new Set<LessonTab>(["all", "upcoming", "attention", "unscheduled", "completed", "favorites"]);
  return set.has(raw as LessonTab) ? (raw as LessonTab) : "all";
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/* ───────────── Main component ───────────── */

export function PaidDashboard({ tierData }: PaidDashboardProps) {
  const worksheetsEnabled = useFeatureFlagEnabled("worksheets_enabled");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [archetype, setArchetype] = useState<ArchetypeData | null>(null);
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<LessonTab>(parseTab(searchParams.get("tab")));
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    const jsonOrNull = (r: Response) => (r.ok ? r.json() : null);
    const safeFetch = (url: string) => fetch(url).then(jsonOrNull).catch(() => null);
    Promise.all([
      safeFetch("/api/children"),
      safeFetch("/api/lessons"),
      safeFetch("/api/user/archetype"),
      safeFetch("/api/worksheets"),
    ]).then(([kids, lsns, arche, wks]) => {
      if (Array.isArray(kids)) setChildren(kids);
      if (Array.isArray(lsns)) setLessons(lsns);
      if (arche && arche.archetype) setArchetype(arche);
      if (Array.isArray(wks)) setWorksheets(wks.slice(0, 5));
      setLoading(false);
    });
  }, []);

  /* ── Derived lesson buckets ── */

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const upcoming = useMemo(
    () =>
      lessons
        .filter((l) => {
          const e = l.calendarEntries[0];
          if (!e) return false;
          const d = e.scheduledDate.split("T")[0];
          return d >= today && l.completions.length === 0;
        })
        .sort((a, b) => (a.calendarEntries[0]?.scheduledDate || "").localeCompare(b.calendarEntries[0]?.scheduledDate || "")),
    [lessons, today]
  );

  const missed = useMemo(
    () =>
      lessons
        .filter((l) => {
          const e = l.calendarEntries[0];
          if (!e) return false;
          const d = e.scheduledDate.split("T")[0];
          return d < today && l.completions.length === 0;
        })
        .sort((a, b) => (b.calendarEntries[0]?.scheduledDate || "").localeCompare(a.calendarEntries[0]?.scheduledDate || "")),
    [lessons, today]
  );

  const unscheduled = useMemo(
    () =>
      lessons
        .filter((l) => l.calendarEntries.length === 0 && l.completions.length === 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lessons]
  );

  const completed = useMemo(
    () => lessons.filter((l) => l.completions.length > 0).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lessons]
  );

  const favorites = useMemo(() => lessons.filter((l) => l.favorite), [lessons]);

  const bucketFor = (t: LessonTab): LessonData[] => {
    switch (t) {
      case "upcoming": return upcoming;
      case "attention": return missed;
      case "unscheduled": return unscheduled;
      case "completed": return completed;
      case "favorites": return favorites;
      default: return lessons.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  };

  const filteredLessons = useMemo(() => {
    const rows = bucketFor(tab);
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((l) => {
      const hay = [
        l.title,
        l.interest,
        l.philosophy,
        l.subjects?.join(" "),
        l.lessonChildren?.map((lc) => lc.child.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query, upcoming, missed, unscheduled, completed, favorites, lessons]);

  const updateUrl = useCallback(
    (nextTab: LessonTab, nextQuery: string) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (nextTab === "all") params.delete("tab");
      else params.set("tab", nextTab);
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams]
  );

  /* ── Quota hero ── */

  const { lessonsUsed, lessonsLimit, resetsAt } = tierData;
  const limitKnown = lessonsLimit > 0;
  const remaining = Math.max(0, lessonsLimit - lessonsUsed);
  const exhausted = limitKnown && lessonsUsed >= lessonsLimit;
  const pct = limitKnown ? Math.min(100, (lessonsUsed / lessonsLimit) * 100) : 0;
  const resetLabel = formatResetDate(resetsAt);

  const atChildLimit =
    !!tierData && tierData.childrenLimit >= 0 && tierData.childrenCount >= tierData.childrenLimit;

  /* ── Children recap map ── */

  const childRecap = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; lastTitle: string | null }>();
    for (const c of children) map.set(c.id, { total: 0, completed: 0, lastTitle: null });
    for (const l of lessons) {
      for (const lc of l.lessonChildren || []) {
        const r = map.get(lc.child.id);
        if (!r) continue;
        r.total += 1;
        if (l.completions.length > 0) r.completed += 1;
        if (!r.lastTitle) r.lastTitle = l.title;
      }
    }
    return map;
  }, [children, lessons]);

  /* ── Calendar lesson bucketing ── */

  const lessonsByDate = useMemo(() => {
    const byDate: Record<string, Array<{ id: string; title: string; children: string[]; completed: boolean; rating?: number }>> = {};
    for (const lesson of lessons) {
      for (const entry of lesson.calendarEntries) {
        const d = entry.scheduledDate.split("T")[0];
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push({
          id: lesson.id,
          title: lesson.title,
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
    const cur = new Date(startDate);
    while (cur <= lastDay || cur.getDay() !== 0) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
      if (dates.length > 42) break;
    }
    return dates;
  }, [currentDate]);

  const calendarToday = formatDate(new Date());

  /* ───────────── Render ───────────── */

  return (
    <div
      className="space-y-6"
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      {/* ── QUOTA HERO ── */}
      <div
        style={{
          ...quotaHeroStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: "220px" }}>
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: ACCENT_PRIMARY,
              textTransform: "uppercase",
            }}
          >
            This month
          </span>
          <div
            className="font-cormorant-sc"
            style={{ fontSize: "1.65rem", fontWeight: 700, color: "#1f2328", letterSpacing: "0.02em" }}
          >
            {lessonsUsed}
            {limitKnown && (
              <span style={{ color: TEXT_TERTIARY, fontWeight: 500 }}> of {lessonsLimit}</span>
            )}{" "}
            lessons created
          </div>
          <div style={{ fontSize: "0.8rem", color: TEXT_SECONDARY }}>
            {limitKnown
              ? exhausted
                ? `You've used all ${lessonsLimit} lessons for this month — resets ${resetLabel}.`
                : `${remaining} lesson${remaining === 1 ? "" : "s"} left this month — resets ${resetLabel}.`
              : `Unlimited lessons · ${tierData.tier} plan`}
          </div>
          {/* Progress bar — works better than dots at 30/100 */}
          {limitKnown && (
            <div
              style={{
                height: "6px",
                borderRadius: "4px",
                background: "rgba(130,40,75,0.18)",
                overflow: "hidden",
                marginTop: "0.6rem",
                maxWidth: "340px",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: exhausted
                    ? "#b54a74"
                    : pct > 80
                      ? "#C4983D"
                      : ACCENT_SECONDARY,
                  transition: "width 0.3s",
                }}
              />
            </div>
          )}
        </div>
        {exhausted ? (
          <Link
            href={UPGRADE_URL}
            style={{
              background: NIGHT,
              color: PARCHMENT,
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "0.6rem 1.1rem",
              borderRadius: "9px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            Upgrade for more →
          </Link>
        ) : (
          <Link
            href="/create"
            style={{
              background: NIGHT,
              color: PARCHMENT,
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "0.6rem 1.1rem",
              borderRadius: "9px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            + Create lesson
          </Link>
        )}
      </div>

      {/* ── ARCHETYPE STRIP ── */}
      {archetype ? (
        <div style={{ ...archetypeStripStyle, display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <ArchetypeAvatar archetypeId={archetype.archetype} size={64} />
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{
                fontSize: "0.64rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: ACCENT_SECONDARY,
              }}
            >
              Your archetype
            </div>
            <div
              className="font-cormorant-sc"
              style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2328", letterSpacing: "0.02em" }}
            >
              {prettyArchetype(archetype.archetype)}
              {archetype.secondaryArchetype && (
                <span style={{ color: TEXT_SECONDARY, fontWeight: 500, fontSize: "0.85rem" }}>
                  {" "}· + {prettyArchetype(archetype.secondaryArchetype)}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.74rem", color: TEXT_SECONDARY }}>
              {archetype.topPhilosophyIds.map((id, i) => (
                <span key={id}>
                  {i > 0 ? " · " : ""}
                  {prettyPhilosophy(id)}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/compass/results?id=${archetype.resultId}`}
            style={{
              fontSize: "0.74rem",
              color: ACCENT_PRIMARY,
              textDecoration: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            View results →
          </Link>
        </div>
      ) : (
        <div style={{ ...archetypeInviteStyle, display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontSize: "0.85rem", color: TEXT_SECONDARY }}>
            Take the 5-minute Compass assessment to personalize your lessons to your teaching style.
          </div>
          <Link
            href="/compass"
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: PARCHMENT,
              background: NIGHT,
              padding: "0.4rem 0.9rem",
              borderRadius: "8px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Take the Compass →
          </Link>
        </div>
      )}

      {/* ── YOUR LESSONS (unified, tabbed) ── */}
      <div style={frostCardStyle}>
        <div
          className="font-cormorant-sc"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#1f2328",
            letterSpacing: "0.04em",
            marginBottom: "0.6rem",
          }}
        >
          <span>Your lessons</span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: "0.7rem",
              color: TEXT_TERTIARY,
              letterSpacing: "0.02em",
              textTransform: "none",
            }}
          >
            {loading ? "…" : `${lessons.length} total · ${completed.length} completed`}
          </span>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.3rem",
            marginBottom: "0.6rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            flexWrap: "wrap",
          }}
        >
          {([
            { id: "all", label: "All", count: lessons.length, attention: false },
            { id: "upcoming", label: "Upcoming", count: upcoming.length, attention: false },
            { id: "attention", label: "Needs attention", count: missed.length, attention: missed.length > 0 },
            { id: "unscheduled", label: "Unscheduled", count: unscheduled.length, attention: false },
            { id: "completed", label: "Completed", count: completed.length, attention: false },
            { id: "favorites", label: "Favorites", count: favorites.length, attention: false },
          ] as Array<{ id: LessonTab; label: string; count: number; attention: boolean }>).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  updateUrl(t.id, query);
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  background: active
                    ? NIGHT
                    : t.attention
                      ? "rgba(196,152,61,0.1)"
                      : "transparent",
                  color: active ? PARCHMENT : t.attention ? "#B08A2E" : TEXT_SECONDARY,
                  border: active
                    ? `1px solid ${NIGHT}`
                    : t.attention
                      ? "1px solid rgba(196,152,61,0.3)"
                      : "1px solid transparent",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 500,
                  fontFamily: "inherit",
                }}
              >
                {t.label}
                <span style={{ opacity: 0.65, marginLeft: "0.3rem", fontWeight: 400 }}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "8px",
            padding: "0.4rem 0.7rem",
            marginBottom: "0.65rem",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEXT_TERTIARY} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateUrl(tab, e.target.value);
            }}
            placeholder="Search by title, child, subject, or interest…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.78rem",
              background: "transparent",
              color: "#1f2328",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                updateUrl(tab, "");
              }}
              style={{
                fontSize: "0.66rem",
                color: TEXT_TERTIARY,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.1rem 0.3rem",
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: TEXT_TERTIARY }}>
            Loading…
          </div>
        ) : filteredLessons.length === 0 ? (
          <div style={{ padding: "1.25rem 0.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: TEXT_SECONDARY, marginBottom: "0.6rem" }}>
              {lessons.length === 0
                ? "No lessons yet. Let's start with your first one."
                : query.trim()
                  ? `No lessons match "${query.trim()}".`
                  : "Nothing here yet."}
            </p>
            {lessons.length === 0 && (
              <Link
                href="/create"
                style={{
                  background: NIGHT,
                  color: PARCHMENT,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                + Create lesson
              </Link>
            )}
          </div>
        ) : (
          filteredLessons.map((lesson, idx) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0",
                fontSize: "0.82rem",
                color: "#1f2328",
                borderBottom: idx < filteredLessons.length - 1 ? "1px dashed rgba(0,0,0,0.08)" : "none",
                gap: "0.5rem",
                textDecoration: "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#1f2328" }}>
                  {lesson.title}
                  {lesson.favorite && <span style={{ color: "#C4983D", marginLeft: "0.35rem" }}>★</span>}
                </div>
                <div style={{ fontSize: "0.7rem", color: TEXT_TERTIARY, marginTop: "0.15rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {lesson.philosophy && (
                    <span style={{ color: ACCENT_PRIMARY }}>{prettyPhilosophy(lesson.philosophy)}</span>
                  )}
                  {lesson.subjects?.slice(0, 3).map((s) => (
                    <span key={s}>· {s}</span>
                  ))}
                  {lesson.lessonChildren?.map((lc) => (
                    <span key={lc.child.id} style={{ color: ACCENT_SECONDARY }}>· {lc.child.name}</span>
                  ))}
                  <span>· {formatRelative(lesson.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                {lesson.completions[0] && (
                  <span style={{ color: "#C4983D", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {"★".repeat(lesson.completions[0].starRating)}
                    {"☆".repeat(5 - lesson.completions[0].starRating)}
                  </span>
                )}
                {lesson.calendarEntries[0] && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: TEXT_SECONDARY,
                      background: "rgba(0,0,0,0.04)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lesson.calendarEntries[0].scheduledDate.split("T")[0]}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}

        {!loading && lessons.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "0.7rem", paddingTop: "0.55rem", borderTop: "1px dashed rgba(0,0,0,0.08)" }}>
            <Link
              href="/standards"
              style={{
                fontSize: "0.76rem",
                color: ACCENT_PRIMARY,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Browse standards to seed your next lesson →
            </Link>
          </div>
        )}
      </div>

      {/* ── CHILDREN ── */}
      <div>
        <h2
          className="font-cormorant-sc"
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "#1f2328",
            marginBottom: "0.6rem",
          }}
        >
          Children
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {children.map((child) => {
            const recap = childRecap.get(child.id);
            return (
              <div key={child.id} style={frostCardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <h3 style={{ fontWeight: 600, color: NIGHT, margin: 0 }}>{child.name}</h3>
                  <span
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "5px",
                      background: "rgba(110,110,158,0.12)",
                      color: ACCENT_PRIMARY,
                    }}
                  >
                    Grade {child.gradeLevel}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: TEXT_SECONDARY, margin: 0 }}>
                  Age {childAge(child.dateOfBirth)}
                  {recap && recap.total > 0 && (
                    <>
                      {" · "}
                      {recap.total} lesson{recap.total === 1 ? "" : "s"}
                      {recap.completed > 0 && <> · {recap.completed} completed</>}
                    </>
                  )}
                </p>
                {child.standardsOptIn && (
                  <Link
                    href={`/standards?child=${child.id}`}
                    style={{
                      display: "inline-block",
                      marginTop: "0.45rem",
                      fontSize: "0.72rem",
                      color: ACCENT_PRIMARY,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    View progress →
                  </Link>
                )}
              </div>
            );
          })}
          {atChildLimit ? (
            <div
              style={{
                background: "rgba(255,255,255,0.4)",
                border: "1px dashed rgba(255,255,255,0.6)",
                borderRadius: "12px",
                padding: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: TEXT_TERTIARY }}>
                {tierData.childrenCount}
                {tierData.childrenLimit >= 0 ? `/${tierData.childrenLimit}` : ""} children — limit reached
              </span>
              <a
                href={UPGRADE_URL}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#B08A2E",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  background: "rgba(196,152,61,0.12)",
                  border: "1px solid rgba(196,152,61,0.3)",
                  textDecoration: "none",
                }}
              >
                Upgrade →
              </a>
            </div>
          ) : (
            <Link
              href="/account"
              style={{
                background: "rgba(255,255,255,0.4)",
                border: "1px dashed rgba(110,110,158,0.3)",
                borderRadius: "12px",
                padding: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: ACCENT_PRIMARY,
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              + Add child
            </Link>
          )}
        </div>
      </div>

      {/* ── CALENDAR ── */}
      <div style={frostCardStyle}>
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "0.75rem" }}>
          <h2
            className="font-cormorant-sc"
            style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.06em", color: "#1f2328", margin: 0 }}
          >
            Schedule
          </h2>
          <div className="flex gap-1.5">
            {(["week", "month"] as const).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "5px",
                    background: active ? NIGHT : "transparent",
                    color: active ? PARCHMENT : TEXT_SECONDARY,
                    border: active ? `1px solid ${NIGHT}` : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    fontWeight: active ? 600 : 500,
                    textTransform: "capitalize",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: "0.5rem" }}>
          <button
            onClick={() =>
              setCurrentDate((prev) => {
                const next = new Date(prev);
                if (view === "week") next.setDate(next.getDate() - 7);
                else next.setMonth(next.getMonth() - 1);
                return next;
              })
            }
            style={{ fontSize: "0.75rem", color: TEXT_SECONDARY, background: "transparent", border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
          >
            ← Previous
          </button>
          <h3 className="font-cormorant-sc" style={{ fontSize: "0.95rem", color: NIGHT, margin: 0 }}>
            {view === "week"
              ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <button
            onClick={() =>
              setCurrentDate((prev) => {
                const next = new Date(prev);
                if (view === "week") next.setDate(next.getDate() + 7);
                else next.setMonth(next.getMonth() + 1);
                return next;
              })
            }
            style={{ fontSize: "0.75rem", color: TEXT_SECONDARY, background: "transparent", border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
          >
            Next →
          </button>
        </div>

        {view === "week" ? (
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const dateStr = formatDate(date);
              const cal = lessonsByDate[dateStr] || [];
              const isToday = dateStr === calendarToday;
              return (
                <div
                  key={dateStr}
                  style={{
                    background: cal.length > 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)",
                    border: isToday ? `1px solid ${ACCENT_PRIMARY}` : "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "10px",
                    padding: "0.5rem",
                    minHeight: "8rem",
                    boxShadow: cal.length > 0 ? "0 2px 10px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: "0.4rem" }}>
                    <p
                      style={{
                        fontSize: "0.6rem",
                        color: TEXT_TERTIARY,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: 0,
                      }}
                    >
                      {DAY_NAMES[date.getDay()]}
                    </p>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: isToday ? ACCENT_PRIMARY : NIGHT,
                        margin: 0,
                      }}
                    >
                      {date.getDate()}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {cal.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        style={{
                          display: "block",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "5px",
                          fontSize: "0.68rem",
                          textDecoration: "none",
                          background: lesson.completed ? "rgba(122,158,138,0.15)" : "rgba(255,255,255,0.72)",
                          borderLeft: lesson.completed ? "3px solid #7A9E8A" : `3px solid ${ACCENT_PRIMARY}`,
                          color: NIGHT,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {lesson.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(255,255,255,0.3)", marginBottom: "1px" }}>
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    padding: "0.4rem 0",
                    fontSize: "0.62rem",
                    color: TEXT_TERTIARY,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "rgba(255,255,255,0.55)",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px" style={{ background: "rgba(0,0,0,0.04)" }}>
              {monthDates.map((date) => {
                const dateStr = formatDate(date);
                const cal = lessonsByDate[dateStr] || [];
                const isToday = dateStr === calendarToday;
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                return (
                  <div
                    key={dateStr}
                    style={{
                      background: isToday ? "rgba(110,110,158,0.08)" : "rgba(255,255,255,0.6)",
                      padding: "0.4rem",
                      minHeight: "4.5rem",
                      opacity: isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: isToday ? ACCENT_PRIMARY : TEXT_TERTIARY,
                        fontWeight: isToday ? 600 : 400,
                        margin: "0 0 0.25rem",
                      }}
                    >
                      {date.getDate()}
                    </p>
                    {cal.slice(0, 2).map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        style={{
                          display: "block",
                          fontSize: "0.6rem",
                          padding: "0.15rem 0.3rem",
                          borderRadius: "3px",
                          marginBottom: "0.1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: "none",
                          background: lesson.completed ? "rgba(122,158,138,0.15)" : "rgba(255,255,255,0.72)",
                          color: lesson.completed ? "#5A947A" : ACCENT_PRIMARY,
                        }}
                      >
                        {lesson.title}
                      </Link>
                    ))}
                    {cal.length > 2 && (
                      <p style={{ fontSize: "0.58rem", color: TEXT_TERTIARY, margin: 0 }}>+{cal.length - 2} more</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── WORKSHEETS (feature-flagged) ── */}
      {worksheetsEnabled && worksheets.length > 0 && (
        <div style={frostCardStyle}>
          <div className="flex items-center justify-between" style={{ marginBottom: "0.6rem" }}>
            <h2
              className="font-cormorant-sc"
              style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.06em", color: "#1f2328", margin: 0 }}
            >
              Recent worksheets
            </h2>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {worksheets.map((ws) => (
              <div
                key={ws.id}
                style={{
                  flex: "0 0 200px",
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.55)",
                  borderRadius: "10px",
                  padding: "0.8rem",
                  boxShadow: SHARED_SHADOW,
                }}
              >
                <p
                  style={{
                    fontSize: "0.76rem",
                    color: NIGHT,
                    fontWeight: 600,
                    marginBottom: "0.3rem",
                    lineHeight: 1.35,
                  }}
                >
                  {ws.lesson.title}
                </p>
                <p style={{ fontSize: "0.64rem", color: TEXT_TERTIARY, marginBottom: "0.6rem" }}>
                  {ws.childName ? `${ws.childName} · ` : ""}Grade {ws.grade} ·{" "}
                  {new Date(ws.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <button
                  onClick={() => printWorksheet(ws)}
                  style={{
                    fontSize: "0.64rem",
                    color: ACCENT_PRIMARY,
                    background: "transparent",
                    border: "1px solid rgba(110,110,158,0.25)",
                    borderRadius: "5px",
                    padding: "0.2rem 0.5rem",
                    cursor: "pointer",
                  }}
                >
                  Print
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
