"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { ARCHETYPES } from "@/lib/compass/archetypes";

type LibraryTab = "recent" | "all" | "favorites";

function parseTab(raw: string | null): LibraryTab {
  return raw === "all" || raw === "favorites" ? raw : "recent";
}

interface LessonData {
  id: string;
  title: string;
  subjects: string[];
  philosophy?: string | null;
  gradeLevel?: string | null;
  interest?: string | null;
  favorite?: boolean;
  createdAt: string;
  lessonChildren?: { child: { name: string } }[];
}

interface TierData {
  tier: string;
  lessonsUsed: number;
  lessonsLimit: number;
  resetsAt: string;
}

interface ArchetypeData {
  resultId: string;
  archetype: string;
  secondaryArchetype: string | null;
  topPhilosophyIds: string[];
}

interface CompassDashboardProps {
  tierData: TierData;
}

const NIGHT = "#0B2E4A";
const PARCHMENT = "#F9F6EF";
const ACCENT_PRIMARY = "#6E6E9E";
const ACCENT_SECONDARY = "#82284b";
const TEXT_SECONDARY = "#5A5A5A";
const TEXT_TERTIARY = "#767676";

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
  const firstOfNextMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  };
  // Guard against stale Clerk billing data: if the ISO is missing, unparseable,
  // or in the past (can happen on tier-override accounts or mid-renewal), fall
  // back to the first of next calendar month so we never show a past reset date.
  const parsed = iso ? new Date(iso) : null;
  const target =
    parsed && !isNaN(parsed.getTime()) && parsed.getTime() > Date.now()
      ? parsed
      : firstOfNextMonth();
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  return id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CompassDashboard({ tierData }: CompassDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const archetypeOverride = searchParams.get("archetype") || "";
  const initialTab = parseTab(searchParams.get("tab"));
  const initialQuery = searchParams.get("q") || "";
  const [archetype, setArchetype] = useState<ArchetypeData | null>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const jsonOrNull = (r: Response) => (r.ok ? r.json() : null);
    const safeFetch = (url: string) => fetch(url).then(jsonOrNull).catch(() => null);

    Promise.all([
      safeFetch("/api/user/archetype"),
      safeFetch("/api/lessons"),
    ]).then(([archetypeData, lessonsData]) => {
      if (archetypeData && archetypeData.archetype) setArchetype(archetypeData);
      if (Array.isArray(lessonsData)) setLessons(lessonsData);
      setLoading(false);
    });
  }, []);

  const lessonsUsed = tierData.lessonsUsed;
  const lessonsLimit = tierData.lessonsLimit > 0 ? tierData.lessonsLimit : 3;
  const remaining = Math.max(0, lessonsLimit - lessonsUsed);
  const exhausted = lessonsUsed >= lessonsLimit;
  const resetLabel = formatResetDate(tierData.resetsAt);

  const thisMonthCount = useMemo(() => {
    const periodStart = new Date(tierData.resetsAt).getTime() - 31 * 86400000;
    return lessons.filter((l) => new Date(l.createdAt).getTime() >= periodStart).length;
  }, [lessons, tierData.resetsAt]);

  const sortedLessons = useMemo(
    () => lessons.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [lessons]
  );
  const favoritesCount = useMemo(() => lessons.filter((l) => l.favorite).length, [lessons]);

  const filteredLessons = useMemo(() => {
    let rows = sortedLessons;
    if (tab === "favorites") rows = rows.filter((l) => l.favorite);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((l) => {
        const hay = [l.title, l.interest, l.philosophy, l.subjects?.join(" ")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return tab === "recent" ? rows.slice(0, 5) : rows;
  }, [sortedLessons, tab, query]);

  const updateUrl = (nextTab: LibraryTab, nextQuery: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (nextTab === "recent") params.delete("tab"); else params.set("tab", nextTab);
    if (nextQuery.trim()) params.set("q", nextQuery.trim()); else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  };

  const changeTab = (next: LibraryTab) => {
    setTab(next);
    updateUrl(next, query);
  };

  useEffect(() => {
    if (loading) return;
    track("dashboard_viewed", {
      tier: "compass",
      lessons_used: lessonsUsed,
      lessons_limit: lessonsLimit,
      has_archetype: !!archetype,
      has_lessons: lessons.length > 0,
    });
    if (exhausted) {
      track("dashboard_quota_exhausted_viewed", { tier: "compass" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div
      className="space-y-6"
      style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      {/* ── QUOTA HERO ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(11,46,74,0.10), rgba(110,110,158,0.14))",
          border: "1px solid rgba(11,46,74,0.14)",
          borderRadius: "14px",
          padding: "1.1rem 1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
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
            <span style={{ color: TEXT_TERTIARY, fontWeight: 500 }}> of {lessonsLimit}</span> lessons created
          </div>
          <div style={{ fontSize: "0.8rem", color: TEXT_SECONDARY }}>
            {exhausted
              ? `You've used all ${lessonsLimit} free lessons — upgrade to keep creating.`
              : `You have ${remaining} free lesson${remaining === 1 ? "" : "s"} left — resets ${resetLabel}.`}
          </div>
          <div style={{ display: "inline-flex", gap: "0.3rem", marginTop: "0.4rem" }}>
            {Array.from({ length: lessonsLimit }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: i < lessonsUsed ? ACCENT_SECONDARY : "rgba(130,40,75,0.15)",
                  border: `1px solid ${i < lessonsUsed ? ACCENT_SECONDARY : "rgba(130,40,75,0.35)"}`,
                }}
              />
            ))}
          </div>
        </div>
        {exhausted ? (
          <Link
            href="/pricing"
            onClick={() => track("dashboard_upgrade_clicked", { tier: "compass", source: "quota_hero" })}
            style={{
              background: NIGHT,
              color: PARCHMENT,
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "0.6rem 1.1rem",
              borderRadius: "9px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            Upgrade to Homestead →
          </Link>
        ) : (
          <Link
            href="/create"
            onClick={() =>
              track("dashboard_create_clicked", {
                tier: "compass",
                lessons_used: lessonsUsed,
                lessons_limit: lessonsLimit,
              })
            }
            style={{
              background: NIGHT,
              color: PARCHMENT,
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "0.6rem 1.1rem",
              borderRadius: "9px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            + Create lesson
          </Link>
        )}
      </div>

      {/* ── ARCHETYPE STRIP ── */}
      {/* Dev override: /dashboard?archetype=the-guide (or any archetype id).
          Visual-only — lets designers tune avatarFocus per archetype without
          re-taking the quiz. Real data shows when param is absent. */}
      {(() => {
        const effective: ArchetypeData | null =
          archetypeOverride && ARCHETYPES.some((a) => a.id === archetypeOverride)
            ? {
                resultId: archetype?.resultId ?? "",
                archetype: archetypeOverride,
                secondaryArchetype: archetype?.secondaryArchetype ?? null,
                topPhilosophyIds: archetype?.topPhilosophyIds ?? [],
              }
            : archetype;
        return effective ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.7rem 0.9rem",
            background: "rgba(130,40,75,0.09)",
            border: "1px solid rgba(130,40,75,0.18)",
            borderRadius: "10px",
            flexWrap: "wrap",
            boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
          }}
        >
          {(() => {
            const def = ARCHETYPES.find((a) => a.id === effective.archetype);
            const src = def?.imagePath;
            const color = def?.color || "#82284b";
            const focusX = def?.avatarFocus?.x ?? "50%";
            const focusY = def?.avatarFocus?.y ?? "10%";
            const focusScale = def?.avatarFocus?.scale ?? "180%";
            return (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: src
                    ? `url(${src}) ${focusX} ${focusY} / ${focusScale} auto no-repeat, radial-gradient(circle at 30% 30%, ${color}22, ${color}08 70%)`
                    : `radial-gradient(circle at 30% 30%, ${color}22, ${color}08 70%)`,
                  border: `1px solid ${color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: `0 2px 10px ${color}22`,
                }}
                aria-label={def?.name || "Archetype"}
                role="img"
              >
                {!src && (
                  <span
                    className="font-cormorant-sc"
                    style={{ fontSize: "1rem", fontWeight: 700, color }}
                  >
                    {effective.archetype.replace(/^the-/, "").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            );
          })()}
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
              {prettyArchetype(effective.archetype)}
            </div>
            <div style={{ fontSize: "0.74rem", color: TEXT_SECONDARY }}>
              {effective.topPhilosophyIds.map((id, i) => (
                <span key={id}>
                  {i > 0 ? " · " : ""}
                  {prettyPhilosophy(id)}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/compass/results?id=${effective.resultId}`}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.7rem 0.9rem",
            background: "rgba(110,110,158,0.09)",
            border: "1px solid rgba(110,110,158,0.22)",
            borderRadius: "10px",
            flexWrap: "wrap",
            boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
          }}
        >
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
      );
      })()}

      {/* ── LESSON LIBRARY ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.62)",
          border: "1px solid rgba(255,255,255,0.55)",
          borderRadius: "12px",
          padding: "0.95rem 1rem",
          boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
        }}
      >
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
            {loading ? "…" : `${thisMonthCount} this month · ${lessons.length} total`}
          </span>
        </div>

        {/* Tabs — only when the library has enough content to warrant filtering */}
        {!loading && lessons.length > 3 && (
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
              { id: "recent", label: "Recent", count: Math.min(5, lessons.length) },
              { id: "all", label: "All", count: lessons.length },
              { id: "favorites", label: "Favorites", count: favoritesCount },
            ] as Array<{ id: LibraryTab; label: string; count: number }>).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeTab(t.id)}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "6px",
                    background: active ? NIGHT : "transparent",
                    color: active ? PARCHMENT : TEXT_SECONDARY,
                    border: "1px solid " + (active ? NIGHT : "transparent"),
                    cursor: "pointer",
                    fontWeight: active ? 600 : 500,
                    fontFamily: "inherit",
                  }}
                >
                  {t.label}
                  <span style={{ opacity: 0.65, marginLeft: "0.25rem", fontWeight: 400 }}>{t.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inline search — shown alongside tabs when there are >3 lessons */}
        {!loading && lessons.length > 3 && (
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
              placeholder="Search your lessons by title, interest, or subject…"
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
        )}

        {loading ? (
          <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: TEXT_TERTIARY }}>
            Loading…
          </div>
        ) : filteredLessons.length === 0 && lessons.length === 0 ? (
          <div style={{ padding: "0.5rem 0 0.25rem", textAlign: "center" }}>
            <p className="font-cormorant-sc" style={{ fontSize: "0.95rem", color: NIGHT, marginBottom: "0.4rem" }}>
              No lessons yet.
            </p>
            <p style={{ fontSize: "0.78rem", color: TEXT_SECONDARY, marginBottom: "0.8rem" }}>
              Create your first lesson in under a minute.
            </p>
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
              + Create first lesson
            </Link>
          </div>
        ) : (
          filteredLessons.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.82rem", color: TEXT_SECONDARY }}>
              No lessons match {query.trim() ? `“${query.trim()}”` : "this filter"}.
            </div>
          ) : filteredLessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.55rem 0",
                fontSize: "0.82rem",
                color: "#1f2328",
                borderBottom: idx < filteredLessons.length - 1 ? "1px dashed rgba(0,0,0,0.08)" : "none",
                gap: "0.5rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{lesson.title}</div>
                <div style={{ fontSize: "0.7rem", color: TEXT_TERTIARY, marginTop: "0.15rem" }}>
                  {[
                    lesson.philosophy ? prettyPhilosophy(lesson.philosophy) : null,
                    lesson.gradeLevel ? `Grade ${lesson.gradeLevel}` : null,
                    lesson.subjects?.join(", "),
                    formatRelative(lesson.createdAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center", flexShrink: 0 }}>
                <Link
                  href={`/lessons/${lesson.id}`}
                  style={{
                    fontSize: "0.72rem",
                    color: NIGHT,
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    background: "rgba(11,46,74,0.06)",
                  }}
                >
                  Open
                </Link>
                <Link
                  href="/pricing"
                  onClick={() =>
                    track("dashboard_upgrade_clicked", { tier: "compass", source: "schedule_chip" })
                  }
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
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LockGlyph /> schedule
                </Link>
              </div>
            </div>
          ))
        )}

        {!loading && lessons.length > 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "0.7rem",
              paddingTop: "0.6rem",
              borderTop: "1px dashed rgba(0,0,0,0.08)",
            }}
          >
            <Link
              href="/standards"
              style={{
                fontSize: "0.78rem",
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

      {/* ── UNLOCK CARD ── */}
      <div
        style={{
          background: "rgba(11,46,74,0.06)",
          border: "1px dashed rgba(11,46,74,0.24)",
          borderRadius: "12px",
          padding: "1rem 1.1rem",
          boxShadow: "0 3px 14px rgba(11,46,74,0.06)",
        }}
      >
        <div
          className="font-cormorant-sc"
          style={{
            fontSize: "0.95rem",
            color: NIGHT,
            margin: "0 0 0.5rem",
            letterSpacing: "0.04em",
            fontWeight: 700,
          }}
        >
          What Homestead adds
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {[
            {
              title: "Add up to 4 children",
              body:
                "Attach each lesson to a specific child and track their progress across every standard.",
            },
            {
              title: "Schedule lessons to your week",
              body: "Drag any lesson onto a day. See what's next for each kid at a glance.",
            },
            {
              title: "10× more lessons + a coverage heatmap",
              body:
                "30 lessons per month (vs. 3), plus a state-standards heatmap showing exactly what each child has covered.",
            },
          ].map((b) => (
            <div
              key={b.title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                fontSize: "0.8rem",
                color: "#1f2328",
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(212,175,55,0.15)",
                  color: "#B08A2E",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  marginTop: "1px",
                }}
              >
                ✓
              </span>
              <div>
                <b style={{ fontWeight: 600, color: "#1f2328" }}>{b.title}</b>
                <span
                  style={{
                    color: TEXT_SECONDARY,
                    fontSize: "0.76rem",
                    marginTop: "0.1rem",
                    display: "block",
                  }}
                >
                  {b.body}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
          <Link
            href="/pricing"
            onClick={() => track("dashboard_upgrade_clicked", { tier: "compass", source: "unlock_card" })}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "0.5rem",
              borderRadius: "8px",
              textDecoration: "none",
              background: NIGHT,
              color: PARCHMENT,
            }}
          >
            See plans
          </Link>
          <Link
            href="/create"
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "0.5rem",
              borderRadius: "8px",
              textDecoration: "none",
              color: NIGHT,
              background: "transparent",
              border: "1px solid rgba(11,46,74,0.2)",
            }}
          >
            Create another lesson first
          </Link>
        </div>
      </div>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="9" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 11h-1V7a4 4 0 10-8 0v4H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2zm-7-4a2 2 0 114 0v4h-4V7z" />
    </svg>
  );
}
