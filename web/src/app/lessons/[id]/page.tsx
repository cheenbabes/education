"use client";

import { Shell } from "@/components/shell";
import { PrintLesson } from "@/components/print-lesson";
import { Unauthorized } from "@/components/unauthorized";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PHILOSOPHY_LABELS, PHILOSOPHY_COLORS as SCORING_COLORS, resolvePhilosophyKey } from "@/lib/compass/scoring";
import { printWorksheet } from "@/lib/printWorksheet";
import { renderVisual } from "@/lib/worksheetSvg";
import { UPGRADE_URL } from "@/lib/upgradeUrl";

interface LessonDetail {
  id: string;
  title: string;
  interest: string;
  philosophy: string;
  subjects: string[];
  subjectNames: string[];
  content: Record<string, unknown>;
  lessonChildren: { child: { id: string; name: string; gradeLevel: string } }[];
  completions: { childId: string; starRating: number; notes: string | null; child: { name: string } }[];
  calendarEntries: { scheduledDate: string }[];
  createdAt: string;
}

interface WorksheetData {
  id: string;
  childName: string | null;
  grade: string;
  philosophy: string;
  content: {
    title: string;
    sections: Array<{
      type: string;
      title: string;
      instructions: string;
      lines?: number;
      drawing_space?: boolean;
      visual?: { type: string; params: Record<string, unknown> };
    }>;
  };
  createdAt: string;
}

function getPhilosophyColor(philosophy: string): string {
  const key = resolvePhilosophyKey(philosophy);
  return SCORING_COLORS[key] ?? "#6E6E9E";
}

/* ---------- design tokens ---------- */

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

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: "none",
};

const ghostButton: React.CSSProperties = {
  background: "transparent",
  color: "#5A5A5A",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 500,
  border: "1px solid rgba(0,0,0,0.15)",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  letterSpacing: "0.06em",
  color: "#0B2E4A",
  textTransform: "uppercase",
};

/* ---------- standard color-coding ---------- */

type SubjectArea = "math" | "ela" | "science" | "social" | "other";

const SUBJECT_COLORS: Record<SubjectArea, { color: string; bg: string; border: string }> = {
  math:    { color: "#2563EB", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.25)" },
  ela:     { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)" },
  science: { color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.25)" },
  social:  { color: "#D97706", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.25)" },
  other:   { color: "#767676", bg: "rgba(122,158,138,0.1)", border: "rgba(122,158,138,0.25)" },
};

function classifyStandard(code: string): SubjectArea {
  const upper = code.toUpperCase();
  if (upper.includes("MATH") || /^\d+\.OA|^\d+\.NBT|^\d+\.NF|^\d+\.MD|^\d+\.G\b|^EE\.\d+\.OA|^EE\.\d+\.NBT|^EE\.\d+\.NF|^EE\.\d+\.MD|^EE\.\d+\.G\b/.test(upper)) return "math";
  if (upper.includes("ELA") || upper.includes("LITERACY") || upper.includes("RF") || upper.includes("RL") || upper.includes("RI") || upper.includes("W.") || upper.includes("SL.") || upper.includes("L.")) return "ela";
  if (upper.includes("SCIENCE") || /^\d+-[A-Z]S\d/i.test(code) || /^\d+-LS|^\d+-PS|^\d+-ESS|^\d+-ETS/.test(upper)) return "science";
  if (upper.includes("SOCIAL") || upper.includes("HISTORY") || /^\d+-G\d+\.\d+/.test(code)) return "social";
  return "other";
}

function parseGradeFromCode(code: string): string | null {
  // K-5.P2.1 => "K-5"
  const kRange = code.match(/^(K-\d+)/i);
  if (kRange) return kRange[1].toUpperCase();

  // CCSS.Math.Content.4.OA.A.2 => "4"
  const ccssMatch = code.match(/CCSS\.(?:Math\.Content|ELA-Literacy)\.\w+\.(\d+)/i);
  if (ccssMatch) return ccssMatch[1];

  // CCSS.ELA-Literacy.W.4.3 => "4"  (alt pattern)
  const ccssAlt = code.match(/CCSS\.ELA-Literacy\.\w+\.(\d+)/i);
  if (ccssAlt) return ccssAlt[1];

  // EE.4.OA.1-2 => "4"
  const eeMatch = code.match(/^EE\.(\d+)\./);
  if (eeMatch) return eeMatch[1];

  // 4-LS1-1 or 4-G5.0.1 => "4"
  const leadingGrade = code.match(/^(\d+)-/);
  if (leadingGrade) return leadingGrade[1];

  // Generic: first standalone digit
  const genericDigit = code.match(/\.(\d+)\./);
  if (genericDigit) return genericDigit[1];

  return null;
}

/* ---------- ChevronToggle ---------- */

function ChevronToggle({ open, label }: { open: boolean; onClick?: () => void; label?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        color: "#5A5A5A",
        fontSize: "0.75rem",
        fontWeight: 500,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <span>{label}</span>}
    </span>
  );
}

/* ---------- Structured instructions ---------- */

function StructuredInstructions({ text }: { text: string }) {
  // Break long instruction text into paragraphs separated by double newlines,
  // or numbered/bulleted steps. If the text has numbered steps (1. 2. 3.),
  // render them as distinct styled blocks.
  const lines = text.split(/\n+/).filter((l) => l.trim());

  if (lines.length <= 1) {
    return <p style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>{text}</p>;
  }

  // Detect numbered steps
  const hasNumberedSteps = lines.some((l) => /^\d+[\.\)]\s/.test(l.trim()));

  if (hasNumberedSteps) {
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const stepMatch = line.trim().match(/^(\d+)[\.\)]\s*(.*)/);
          if (stepMatch) {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    ...frostPillBase,
                    background: "rgba(11,46,74,0.06)",
                    border: "1px solid rgba(11,46,74,0.12)",
                    color: "#0B2E4A",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    minWidth: "1.5rem",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "0.15rem",
                  }}
                >
                  {stepMatch[1]}
                </span>
                <p style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7, flex: 1 }}>{stepMatch[2]}</p>
              </div>
            );
          }
          return (
            <p key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  // Paragraph mode
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>
          {line}
        </p>
      ))}
    </div>
  );
}

/* ---------- Main page ---------- */

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const { user } = useUser();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Worksheet state
  const [worksheets, setWorksheets] = useState<WorksheetData[]>([]);
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [worksheetError, setWorksheetError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("compass");
  const [worksheetTierData, setWorksheetTierData] = useState<{ worksheetsUsed: number; worksheetsLimit: number } | null>(null);

  // Collapsible section state
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [assessmentOpen, setAssessmentOpen] = useState(true);
  const [nextLessonOpen, setNextLessonOpen] = useState(true);
  const [sectionOpenMap, setSectionOpenMap] = useState<Record<number, boolean>>({});
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!lesson || !scheduleDate) return;
    setScheduling(true);
    try {
      await fetch(`/api/lessons/${lesson.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: scheduleDate }),
      });
      setLesson((prev) => prev ? {
        ...prev,
        calendarEntries: [...prev.calendarEntries, { scheduledDate: scheduleDate + "T12:00:00" }],
      } : prev);
      setScheduleDate("");
    } finally {
      setScheduling(false);
    }
  };

  const toggleSection = (idx: number) => {
    setSectionOpenMap((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }));
  };
  const isSectionOpen = (idx: number) => sectionOpenMap[idx] ?? true;

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("Lesson not found");
        return r.json();
      })
      .then((data) => {
        setLesson(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    fetch(`/api/lessons/${lessonId}/worksheet`)
      .then((r) => r.json())
      .then(setWorksheets)
      .catch(() => {});

    fetch("/api/user/tier")
      .then((r) => r.json())
      .then((d) => {
        if (d.tier) setUserTier(d.tier);
        setWorksheetTierData({ worksheetsUsed: d.worksheetsUsed ?? 0, worksheetsLimit: d.worksheetsLimit ?? 0 });
      })
      .catch(() => {});
  }, [lessonId]);

  const handleRate = async (childId: string) => {
    if (!lesson) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, starRating: selectedStar, notes }),
      });
      const completion = await res.json();
      const child = lesson.lessonChildren.find((lc) => lc.child.id === childId)?.child;
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              completions: [
                ...prev.completions,
                { childId, starRating: completion.starRating, notes: completion.notes, child: { name: child?.name || "" } },
              ],
            }
          : prev
      );
      setShowRating(null);
      setSelectedStar(0);
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  const generateWorksheet = async (childId: string | null, childName: string, grade: string) => {
    if (worksheetTierData && worksheetTierData.worksheetsUsed >= worksheetTierData.worksheetsLimit) {
      setWorksheetError(`You've used all ${worksheetTierData.worksheetsLimit} worksheets this month. Upgrade or wait until next month.`);
      return;
    }
    setWorksheetLoading(true);
    setWorksheetError(null);
    setShowChildPicker(false);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/worksheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, childName, grade }),
      });
      if (res.status === 429) {
        const data = await res.json();
        setWorksheetError(`Worksheet limit reached (${data.used}/${data.limit} this month). Upgrade to generate more.`);
        return;
      }
      if (!res.ok) throw new Error("Failed to generate worksheet");
      const ws = await res.json();
      setWorksheets((prev) => [ws, ...prev]);
    } catch {
      setWorksheetError("Failed to generate worksheet. Please try again.");
    } finally {
      setWorksheetLoading(false);
    }
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

  if (error === "unauthorized") {
    return (
      <Shell hue="lessons">
        <Unauthorized message="This lesson belongs to another account." />
      </Shell>
    );
  }

  if (error || !lesson) {
    return (
      <Shell hue="lessons">
        <div className="text-center py-12">
          <p style={{ color: "#5A5A5A" }}>{error || "Lesson not found"}</p>
          <Link href="/lessons" style={{ color: "#6E6E9E", fontSize: "0.875rem" }} className="mt-2 block hover:underline">
            Back to lessons
          </Link>
        </div>
      </Shell>
    );
  }

  // Extract content
  const content = lesson.content as Record<string, unknown>;
  const children = lesson.lessonChildren.map((lc) => lc.child);
  const scheduledDate = lesson.calendarEntries[0]?.scheduledDate?.split("T")[0];

  // KG-generated lesson content fields
  const standardsAddressed = (content.standards_addressed as { code: string; description_plain: string; how_addressed: string }[]) || [];
  const materialsNeeded = (content.materials_needed as { name: string; household_alternative: string; optional: boolean }[]) || [];
  const lessonSections = (content.lesson_sections as { title: string; duration_minutes: number; indoor_outdoor: string; instructions: string; philosophy_connection: string; tips: string[]; extensions: string[] }[]) || [];
  const assessmentSuggestions = (content.assessment_suggestions as string[]) || [];
  const nextLessonSeeds = (content.next_lesson_seeds as string[]) || [];
  const philosophySummary = content.philosophy_summary as string | undefined;
  const estimatedDuration = content.estimated_duration_minutes as number | undefined;
  const lessonChildren = (content.children as { child_id: string; name: string; grade: string; age: number; differentiation_notes: string }[]) || [];

  const philoColor = getPhilosophyColor(lesson.philosophy);

  // For PrintLesson
  const printableLesson = {
    title: lesson.title,
    theme: lesson.interest,
    estimated_duration_minutes: estimatedDuration || 0,
    philosophy: lesson.philosophy,
    philosophy_summary: philosophySummary,
    children: lessonChildren.map((c) => ({
      name: c.name,
      grade: c.grade,
      age: c.age,
      differentiation_notes: c.differentiation_notes,
    })),
    standards_addressed: standardsAddressed,
    materials_needed: materialsNeeded,
    lesson_sections: lessonSections,
    assessment_suggestions: assessmentSuggestions,
    next_lesson_seeds: nextLessonSeeds,
  };

  return (
    <Shell hue="lessons">
      <div className="max-w-6xl space-y-6">
        {/* Back + Print row */}
        <div className="flex items-center justify-between">
          <Link href="/lessons" style={{ color: "#6E6E9E", fontSize: "0.8rem", textDecoration: "none", fontWeight: 500 }} className="hover:underline">
            &larr; All lessons
          </Link>
          <div className="flex gap-2 items-center">
            {lessonSections.length > 0 && <PrintLesson lesson={printableLesson} />}
            {lesson.lessonChildren.length === 0 ? (
              /* Compass / free-tier upsell */
              <Link
                href={UPGRADE_URL}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(110,110,158,0.3)",
                  color: "var(--accent-primary)",
                  background: "rgba(110,110,158,0.06)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Add to Calendar — Upgrade to Homestead
              </Link>
            ) : !scheduledDate ? (
              <div className="flex gap-1.5 items-center">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                    padding: "0.3rem 0.5rem",
                    fontSize: "0.75rem",
                    color: "#0B2E4A",
                  }}
                />
                <button
                  onClick={handleSchedule}
                  disabled={!scheduleDate || scheduling}
                  style={{
                    ...nightButton,
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.75rem",
                    opacity: !scheduleDate || scheduling ? 0.5 : 1,
                  }}
                >
                  {scheduling ? "Saving..." : "Add to Calendar"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main lesson card */}
        <div style={frostCard} className="space-y-5">
          {/* Header */}
          <div>
            {/* Philosophy + metadata row */}
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: "0.5rem" }}>
              <span
                style={{
                  ...frostPillBase,
                  color: philoColor,
                  background: `${philoColor}15`,
                  border: `1px solid ${philoColor}30`,
                }}
              >
                {PHILOSOPHY_LABELS[resolvePhilosophyKey(lesson.philosophy)] || lesson.philosophy.replace(/_/g, " ")}
              </span>
              {scheduledDate && (
                <span style={{ ...frostPillBase, color: "#5A5A5A" }}>
                  {new Date(scheduledDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {estimatedDuration && (
                <span style={{ ...frostPillBase, color: "#5A5A5A" }}>
                  {estimatedDuration} min
                </span>
              )}
            </div>

            <h1 className="font-cormorant-sc" style={{ fontSize: "1.75rem", color: "#0B2E4A", lineHeight: 1.2, marginBottom: "0.75rem" }}>
              {lesson.title}
            </h1>

            <div className="flex gap-1.5 flex-wrap">
              {(lesson.subjectNames?.length > 0 ? lesson.subjectNames : []).map((s) => (
                <span key={s} style={{ ...frostPillBase, color: "#4A8B6E", background: "rgba(74,139,110,0.08)", border: "1px solid rgba(74,139,110,0.2)" }}>{s}</span>
              ))}
              <span style={{ ...frostPillBase, color: "#9B7E8E" }}>{lesson.interest}</span>
              {children.map((c) => (
                <span key={c.id} style={{ ...frostPillBase, color: "#5A5A5A" }}>
                  {c.name} (Grade {c.gradeLevel})
                </span>
              ))}
            </div>
          </div>

          {/* Philosophy summary */}
          {philosophySummary && lesson.philosophy !== "adaptive" && (
            <div
              style={{
                ...frostCard,
                borderLeft: `3px solid ${philoColor}`,
                borderRadius: "0 12px 12px 0",
                padding: "1rem 1.25rem",
              }}
            >
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: philoColor, marginBottom: "0.4rem", textTransform: "uppercase" }}
              >
                Philosophy: {PHILOSOPHY_LABELS[resolvePhilosophyKey(lesson.philosophy)] || lesson.philosophy.replace(/_/g, " ")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{philosophySummary}</p>
            </div>
          )}

          {/* Differentiation */}
          {lessonChildren.some((c) => c.differentiation_notes) && (
            <div style={frostCard}>
              <h3
                className="font-cormorant-sc"
                style={{ ...sectionHeadingStyle, marginBottom: "0.5rem" }}
              >
                Differentiation
              </h3>
              {lessonChildren.map((c) =>
                c.differentiation_notes ? (
                  <p key={c.child_id} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>
                    <span style={{ fontWeight: 600 }}>{c.name}:</span> {c.differentiation_notes}
                  </p>
                ) : null
              )}
            </div>
          )}

          {/* Completion / Rating section */}
          <div style={{ ...frostCard, padding: "1rem" }} className="space-y-3">
            <h3
              className="font-cormorant-sc"
              style={{ ...sectionHeadingStyle }}
            >
              Completion
            </h3>
            {children.map((child) => {
              const completion = lesson.completions.find((c) => c.childId === child.id);
              if (completion) {
                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between"
                    style={{
                      background: "rgba(122,158,138,0.1)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5A947A" }}>{child.name} — Completed</p>
                      {completion.notes && (
                        <p style={{ fontSize: "0.75rem", color: "#7A9E8A", marginTop: "0.125rem" }}>{completion.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ fontSize: "1.125rem", color: s <= completion.starRating ? "#C4983D" : "rgba(0,0,0,0.12)" }}>★</span>
                      ))}
                    </div>
                  </div>
                );
              }

              if (showRating === child.id) {
                return (
                  <div key={child.id} style={{ ...frostCard, padding: "0.75rem" }} className="space-y-3">
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0B2E4A" }}>Rate this lesson for {child.name}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setSelectedStar(star)}
                          style={{
                            fontSize: "1.5rem",
                            color: star <= (hoverStar || selectedStar) ? "#C4983D" : "rgba(0,0,0,0.12)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes — how did it go? (e.g., 'she loved sketching the bark')"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        padding: "0.45rem 0.6rem",
                        fontSize: "0.875rem",
                        width: "100%",
                        height: "5rem",
                        resize: "none",
                        color: "#0B2E4A",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRate(child.id)}
                        disabled={selectedStar === 0 || submitting}
                        style={{ ...nightButton, opacity: selectedStar === 0 || submitting ? 0.5 : 1 }}
                      >
                        {submitting ? "Saving..." : "Complete"}
                      </button>
                      <button
                        onClick={() => { setShowRating(null); setSelectedStar(0); setNotes(""); }}
                        style={ghostButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={child.id}
                  onClick={() => setShowRating(child.id)}
                  style={{
                    ...frostCard,
                    padding: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#5A5A5A",
                    display: "block",
                  }}
                >
                  Rate &amp; complete for <span style={{ fontWeight: 600 }}>{child.name}</span>
                </button>
              );
            })}
          </div>

          {/* Standards — collapsed by default */}
          {standardsAddressed.length > 0 && (
            <div style={frostCard}>
              <div
                className="flex items-center justify-between"
                style={{ cursor: "pointer" }}
                onClick={() => setStandardsOpen((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <ChevronToggle open={standardsOpen} />
                  <h3
                    className="font-cormorant-sc"
                    style={{ ...sectionHeadingStyle, margin: 0 }}
                  >
                    Standards Addressed
                  </h3>
                </div>
                {!standardsOpen && (
                  <span style={{ ...frostPillBase, color: "#767676" }}>
                    {standardsAddressed.length} standard{standardsAddressed.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {standardsOpen && (
                <div className="space-y-2" style={{ marginTop: "0.75rem" }}>
                  {standardsAddressed.map((s, i) => {
                    const subject = classifyStandard(s.code);
                    const colors = SUBJECT_COLORS[subject];
                    const grade = parseGradeFromCode(s.code);

                    return (
                      <div
                        key={i}
                        style={{
                          fontSize: "0.875rem",
                          borderLeft: `2px solid ${colors.border}`,
                          paddingLeft: "0.75rem",
                        }}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                              color: colors.color,
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              padding: "0.125rem 0.375rem",
                              borderRadius: "4px",
                            }}
                          >
                            {s.code}
                          </span>
                          {grade && (
                            <span
                              style={{
                                ...frostPillBase,
                                fontSize: "0.6rem",
                                padding: "0.125rem 0.4rem",
                                color: colors.color,
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "9999px",
                                fontWeight: 600,
                              }}
                            >
                              Grade {grade}
                            </span>
                          )}
                          <span style={{ color: "#5A5A5A" }}>{s.description_plain}</span>
                        </div>
                        <p style={{ fontSize: "0.7rem", color: "#767676", marginTop: "0.125rem" }}>{s.how_addressed}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Materials — collapsible */}
          {materialsNeeded.length > 0 && (
            <div style={frostCard}>
              <div
                className="flex items-center justify-between"
                style={{ cursor: "pointer" }}
                onClick={() => setMaterialsOpen((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <ChevronToggle open={materialsOpen} />
                  <h3
                    className="font-cormorant-sc"
                    style={{ ...sectionHeadingStyle, margin: 0 }}
                  >
                    Materials Needed
                  </h3>
                </div>
                {!materialsOpen && (
                  <span style={{ ...frostPillBase, color: "#767676" }}>
                    {materialsNeeded.length} material{materialsNeeded.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {materialsOpen && (
                <div className="space-y-1" style={{ marginTop: "0.5rem" }}>
                  {materialsNeeded.map((m, i) => (
                    <div key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      {m.optional && <span style={{ fontSize: "0.7rem", color: "#767676", marginLeft: "0.25rem" }}>(optional)</span>}
                      {m.household_alternative && (
                        <span style={{ color: "#767676" }}> — or: {m.household_alternative}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lesson Sections — each individually collapsible, expanded by default */}
          {lessonSections.length > 0 && (
            <div>
              <h3
                className="font-cormorant-sc"
                style={{ ...sectionHeadingStyle, marginBottom: "0.75rem" }}
              >
                Lesson Plan
              </h3>
              <div className="space-y-4">
                {lessonSections.map((section, i) => {
                  const ioConfig: Record<string, { color: string; bg: string; icon: string }> = {
                    outdoor: { color: "#3D7E5A", bg: "rgba(61,126,90,0.12)", icon: "\uD83C\uDF3F" },
                    indoor:  { color: "#5A7FA0", bg: "rgba(90,127,160,0.12)", icon: "\uD83C\uDFE0" },
                    both:    { color: "#7D6B9E", bg: "rgba(125,107,158,0.12)", icon: "\u2728" },
                  };
                  const io = ioConfig[section.indoor_outdoor] || ioConfig.both;
                  const open = isSectionOpen(i);

                  return (
                    <div key={i} style={{ ...frostCard, borderLeft: `3px solid ${io.color}30` }}>
                      <div
                        className="flex items-center justify-between"
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleSection(i)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronToggle open={open} />
                          <h4
                            className="font-cormorant-sc"
                            style={{ fontSize: "0.85rem", letterSpacing: "0.04em", color: "#0B2E4A", margin: 0 }}
                          >
                            {section.title}
                          </h4>
                        </div>
                        <div className="flex gap-1.5">
                          <span style={{ ...frostPillBase, color: "#5A5A5A" }}>
                            {section.duration_minutes} min
                          </span>
                          <span style={{
                            ...frostPillBase,
                            color: io.color,
                            background: io.bg,
                            border: `1px solid ${io.color}25`,
                          }}>
                            {io.icon} {section.indoor_outdoor}
                          </span>
                        </div>
                      </div>

                      {open && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <StructuredInstructions text={section.instructions} />

                          {/* Philosophy Connection block */}
                          {section.philosophy_connection && (
                            <div
                              style={{
                                borderLeft: `3px solid ${philoColor}40`,
                                borderRadius: "0 8px 8px 0",
                                padding: "0.6rem 1rem",
                                marginTop: "0.75rem",
                                fontSize: "0.8rem",
                                color: "#767676",
                                fontStyle: "italic",
                                background: `${philoColor}08`,
                              }}
                            >
                              {section.philosophy_connection}
                            </div>
                          )}

                          {/* Tips */}
                          {section.tips?.length > 0 && (
                            <div style={{
                              marginTop: "0.75rem",
                              padding: "0.6rem 0.75rem",
                              background: "rgba(196,152,61,0.06)",
                              borderRadius: "8px",
                              borderLeft: "3px solid rgba(196,152,61,0.3)",
                            }}>
                              <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#B08A2E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Tips</p>
                              <div className="space-y-1">
                                {section.tips.map((tip, j) => (
                                  <p key={j} style={{ fontSize: "0.8rem", color: "#5A5A5A", lineHeight: 1.5 }}>{tip}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {section.extensions?.length > 0 && (
                            <div style={{
                              marginTop: "0.5rem",
                              padding: "0.6rem 0.75rem",
                              background: "rgba(90,127,160,0.06)",
                              borderRadius: "8px",
                              borderLeft: "3px solid rgba(90,127,160,0.3)",
                            }}>
                              <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#5A7FA0", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Extensions</p>
                              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }} className="space-y-0.5">
                                {section.extensions.map((ext, j) => (
                                  <li key={j} style={{ fontSize: "0.8rem", color: "#5A5A5A", lineHeight: 1.5 }}>{ext}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assessment — collapsible */}
          {assessmentSuggestions.length > 0 && (
            <div style={frostCard}>
              <div
                className="flex items-center justify-between"
                style={{ cursor: "pointer" }}
                onClick={() => setAssessmentOpen((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <ChevronToggle open={assessmentOpen} />
                  <h3
                    className="font-cormorant-sc"
                    style={{ ...sectionHeadingStyle, margin: 0 }}
                  >
                    Assessment
                  </h3>
                </div>
                {!assessmentOpen && (
                  <span style={{ ...frostPillBase, color: "#767676" }}>
                    {assessmentSuggestions.length} suggestion{assessmentSuggestions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {assessmentOpen && (
                <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", marginTop: "0.5rem" }} className="space-y-1">
                  {assessmentSuggestions.map((a, i) => (
                    <li key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Next lesson ideas — collapsible */}
          {nextLessonSeeds.length > 0 && (
            <div style={{ ...frostCard, background: "rgba(255,255,255,0.55)" }}>
              <div
                className="flex items-center justify-between"
                style={{ cursor: "pointer" }}
                onClick={() => setNextLessonOpen((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <ChevronToggle open={nextLessonOpen} />
                  <h3
                    className="font-cormorant-sc"
                    style={{ ...sectionHeadingStyle, margin: 0 }}
                  >
                    Ideas for Next Lesson
                  </h3>
                </div>
                {!nextLessonOpen && (
                  <span style={{ ...frostPillBase, color: "#767676" }}>
                    {nextLessonSeeds.length} idea{nextLessonSeeds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {nextLessonOpen && (
                <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", marginTop: "0.5rem" }} className="space-y-1">
                  {nextLessonSeeds.map((seed, i) => (
                    <li key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{seed}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Worksheets ─────────────────────────────────────────────── */}
          <div style={{ marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <h3
              className="font-cormorant-sc"
              style={{ ...sectionHeadingStyle, marginBottom: "0.75rem" }}
            >
              Worksheets
            </h3>

            {/* Create button / child picker */}
            {userTier === "compass" ? (
              <p style={{ fontSize: "0.8rem", color: "#767676" }}>
                Worksheet generation is available on Homestead and above.{" "}
                <a href="/account" style={{ color: "#0B2E4A", fontWeight: 600, textDecoration: "underline" }}>Upgrade →</a>
              </p>
            ) : worksheets.length === 0 && !showChildPicker ? (
              <div>
                {children.length === 0 && (
                  <button
                    onClick={() => {
                      const grade = lessonChildren[0]?.grade || "K";
                      generateWorksheet(null, "Student", grade);
                    }}
                    disabled={worksheetLoading}
                    style={{ ...nightButton, opacity: worksheetLoading ? 0.5 : 1 }}
                  >
                    {worksheetLoading ? "Creating..." : "Create Worksheet"}
                  </button>
                )}
                {children.length === 1 && (
                  <button
                    onClick={() => {
                      const child = children[0];
                      const grade = lessonChildren.find((lc) => lc.child_id === child.id)?.grade || child.gradeLevel || "K";
                      generateWorksheet(child.id, child.name, grade);
                    }}
                    disabled={worksheetLoading}
                    style={{ ...nightButton, opacity: worksheetLoading ? 0.5 : 1 }}
                  >
                    {worksheetLoading ? "Creating..." : `Create Worksheet for ${children[0].name}`}
                  </button>
                )}
                {children.length > 1 && (
                  <button
                    onClick={() => setShowChildPicker(true)}
                    disabled={worksheetLoading}
                    style={{ ...nightButton, opacity: worksheetLoading ? 0.5 : 1 }}
                  >
                    {worksheetLoading ? "Creating..." : "Create Worksheet"}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ ...frostCard, padding: "1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "#5A5A5A", marginBottom: "0.6rem" }}>Choose a child:</p>
                <div className="flex gap-2 flex-wrap">
                  {children.map((child) => {
                    const grade = lessonChildren.find((lc) => lc.child_id === child.id)?.grade || child.gradeLevel || "K";
                    return (
                      <button
                        key={child.id}
                        onClick={() => generateWorksheet(child.id, child.name, grade)}
                        style={{
                          ...frostPillBase,
                          cursor: "pointer",
                          color: "#0B2E4A",
                          background: "rgba(11,46,74,0.06)",
                          border: "1px solid rgba(11,46,74,0.15)",
                          fontSize: "0.8rem",
                          padding: "0.4rem 0.9rem",
                        }}
                      >
                        {child.name}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowChildPicker(false)}
                    style={{ ...frostPillBase, cursor: "pointer", color: "#999", fontSize: "0.75rem" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Remaining worksheet count for paid users */}
            {worksheetTierData && userTier !== "compass" && !worksheetError && (
              <p style={{ fontSize: "0.72rem", color: "#999", marginTop: "0.4rem" }}>
                {worksheetTierData.worksheetsUsed}/{worksheetTierData.worksheetsLimit} worksheets this month
              </p>
            )}

            {/* Error message */}
            {worksheetError && (
              <p style={{ fontSize: "0.8rem", color: "#B04040", marginTop: "0.5rem" }}>{worksheetError}</p>
            )}

            {/* Loading indicator */}
            {worksheetLoading && (
              <p style={{ fontSize: "0.8rem", color: "#767676", marginTop: "0.5rem", fontStyle: "italic" }}>
                Creating worksheet...
              </p>
            )}

            {/* Existing worksheets */}
            {worksheets.length > 0 && (
              <div className="space-y-3" style={{ marginTop: "1rem" }}>
                {worksheets.map((ws) => (
                  <div key={ws.id} style={{ ...frostCard, padding: "1rem" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0B2E4A", marginBottom: "0.4rem" }}>
                          {ws.content.title}
                        </p>
                        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: "0.5rem" }}>
                          {ws.childName && (
                            <span style={{ ...frostPillBase, color: "#5A5A5A", fontSize: "0.65rem" }}>{ws.childName}</span>
                          )}
                          <span style={{ ...frostPillBase, color: "#5A7FA0", background: "rgba(90,127,160,0.08)", border: "1px solid rgba(90,127,160,0.2)", fontSize: "0.65rem" }}>
                            Grade {ws.grade}
                          </span>
                          <span style={{ ...frostPillBase, color: philoColor, background: `${philoColor}10`, border: `1px solid ${philoColor}25`, fontSize: "0.65rem" }}>
                            {ws.philosophy.replace(/_/g, " ")}
                          </span>
                          <span style={{ ...frostPillBase, color: "#999", fontSize: "0.6rem" }}>
                            {new Date(ws.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {ws.content.sections.slice(0, 3).map((sec, i) => (
                            <div key={i}>
                              <p style={{ fontSize: "0.75rem", color: "#5A5A5A" }}>
                                <span style={{ fontWeight: 600 }}>{sec.title}</span>
                                {" — "}
                                {sec.instructions.slice(0, 60)}{sec.instructions.length > 60 ? "…" : ""}
                              </p>
                              {sec.visual && (
                                <div
                                  style={{ marginTop: "0.35rem", opacity: 0.7, maxWidth: "120px" }}
                                  dangerouslySetInnerHTML={{ __html: renderVisual(sec.visual.type, sec.visual.params) ?? "" }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => printWorksheet(ws)}
                        style={{
                          ...ghostButton,
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        Print Worksheet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Issue report */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <Link
              href={`/contact?subject=lesson-issue&lessonId=${lesson.id}&userId=${user?.id ?? ""}`}
              style={{
                fontSize: "0.78rem",
                color: "var(--text-tertiary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Issues with this lesson? Contact us
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
