"use client";

import { Shell } from "@/components/shell";
import { PrintLesson } from "@/components/print-lesson";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface LessonDetail {
  id: string;
  title: string;
  interest: string;
  philosophy: string;
  subjects: string[];
  content: Record<string, unknown>;
  lessonChildren: { child: { id: string; name: string; gradeLevel: string } }[];
  completions: { childId: string; starRating: number; notes: string | null; child: { name: string } }[];
  calendarEntries: { scheduledDate: string }[];
  createdAt: string;
}

const PHILOSOPHY_COLORS: Record<string, string> = {
  classical: "#5B5E8A",
  charlotte_mason: "#B07A8A",
  waldorf: "#C4983D",
  montessori: "#7D6B9E",
  project_based: "#5A7FA0",
  place_nature: "#5A947A",
  unschooling: "#C07A42",
  adaptive: "#8A8A7E",
};

function getPhilosophyColor(philosophy: string): string {
  return PHILOSOPHY_COLORS[philosophy] ?? "#6E6E9E";
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

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => {
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

  if (loading) {
    return (
      <Shell hue="lessons">
        <div className="flex items-center justify-center py-12">
          <p style={{ color: "#5A5A5A" }}>Loading...</p>
        </div>
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

  // Extract content — it could be the KG-generated format or any JSON
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

  // For PrintLesson, pass the content directly if it has the right shape
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
      <div className="max-w-3xl space-y-6">
        {/* Back + Print row */}
        <div className="flex items-center justify-between">
          <Link href="/lessons" style={{ color: "#6E6E9E", fontSize: "0.875rem", textDecoration: "none" }} className="hover:underline">
            &larr; All lessons
          </Link>
          {lessonSections.length > 0 && <PrintLesson lesson={printableLesson} />}
        </div>

        {/* Main lesson card */}
        <div style={frostCard} className="space-y-5">
          {/* Header */}
          <div>
            <h1 className="font-cormorant-sc" style={{ fontSize: "1.75rem", color: "#0B2E4A", marginBottom: "0.5rem" }}>
              {lesson.title}
            </h1>

            {/* Philosophy pill */}
            <span
              style={{
                ...frostPillBase,
                color: philoColor,
                marginBottom: "0.5rem",
              }}
            >
              {lesson.philosophy.replace(/_/g, " ")}
            </span>

            {scheduledDate && (
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A", marginTop: "0.25rem" }}>
                Scheduled: {scheduledDate}
              </p>
            )}
            {estimatedDuration && (
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>
                {estimatedDuration} minutes
              </p>
            )}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {lesson.subjects.map((s) => (
                <span key={s} style={{ ...frostPillBase, color: "#6E6E9E" }}>{s}</span>
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
                Philosophy: {lesson.philosophy.replace(/_/g, " ")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{philosophySummary}</p>
            </div>
          )}

          {/* Differentiation */}
          {lessonChildren.some((c) => c.differentiation_notes) && (
            <div style={frostCard}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.5rem", textTransform: "uppercase" }}
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
              style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", textTransform: "uppercase" }}
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

          {/* Standards */}
          {standardsAddressed.length > 0 && (
            <div style={frostCard}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.75rem", textTransform: "uppercase" }}
              >
                Standards Addressed ({standardsAddressed.length})
              </h3>
              <div className="space-y-2">
                {standardsAddressed.map((s, i) => (
                  <div key={i} style={{ fontSize: "0.875rem", borderLeft: "2px solid #7A9E8A", paddingLeft: "0.75rem" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#767676", background: "rgba(122,158,138,0.1)", padding: "0.125rem 0.375rem", borderRadius: "4px" }}>{s.code}</span>
                      <span style={{ color: "#5A5A5A" }}>{s.description_plain}</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#767676", marginTop: "0.125rem" }}>{s.how_addressed}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {materialsNeeded.length > 0 && (
            <div style={frostCard}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.5rem", textTransform: "uppercase" }}
              >
                Materials Needed
              </h3>
              <div className="space-y-1">
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
            </div>
          )}

          {/* Lesson Sections */}
          {lessonSections.length > 0 && (
            <div>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.75rem", textTransform: "uppercase" }}
              >
                Lesson Plan
              </h3>
              <div className="space-y-4">
                {lessonSections.map((section, i) => (
                  <div key={i} style={frostCard}>
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className="font-cormorant-sc"
                        style={{ fontSize: "0.85rem", letterSpacing: "0.04em", color: "#0B2E4A" }}
                      >
                        {section.title}
                      </h4>
                      <div className="flex gap-1.5">
                        <span style={{ ...frostPillBase, color: "#5A5A5A" }}>
                          {section.duration_minutes} min
                        </span>
                        <span style={{
                          ...frostPillBase,
                          color: section.indoor_outdoor === "outdoor"
                            ? "#5A947A"
                            : section.indoor_outdoor === "indoor"
                            ? "#5A7FA0"
                            : "#7D6B9E",
                        }}>
                          {section.indoor_outdoor}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#5A5A5A", whiteSpace: "pre-line" }}>
                      {section.instructions}
                    </div>

                    {/* Philosophy Connection block */}
                    {section.philosophy_connection && (
                      <div
                        style={{
                          ...frostCard,
                          borderLeft: "3px solid #9B7E8E",
                          borderRadius: "0 8px 8px 0",
                          padding: "0.6rem 1rem",
                          marginTop: "0.75rem",
                          fontSize: "0.8rem",
                          color: "#767676",
                          fontStyle: "italic",
                        }}
                      >
                        {section.philosophy_connection}
                      </div>
                    )}

                    {/* Tips */}
                    {section.tips?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5A5A5A", alignSelf: "center" }}>Tips:</span>
                        {section.tips.map((tip, j) => (
                          <span key={j} style={{ ...frostPillBase, color: "#5A5A5A", fontSize: "0.68rem" }}>{tip}</span>
                        ))}
                      </div>
                    )}

                    {section.extensions?.length > 0 && (
                      <div className="mt-2">
                        <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#5A5A5A" }}>Extensions:</p>
                        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }}>
                          {section.extensions.map((ext, j) => (
                            <li key={j} style={{ fontSize: "0.75rem", color: "#767676" }}>{ext}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessment */}
          {assessmentSuggestions.length > 0 && (
            <div style={frostCard}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.5rem", textTransform: "uppercase" }}
              >
                Assessment
              </h3>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }} className="space-y-1">
                {assessmentSuggestions.map((a, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next lesson ideas */}
          {nextLessonSeeds.length > 0 && (
            <div style={{ ...frostCard, background: "rgba(255,255,255,0.55)" }}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "0.8rem", letterSpacing: "0.06em", color: "#0B2E4A", marginBottom: "0.5rem", textTransform: "uppercase" }}
              >
                Ideas for Next Lesson
              </h3>
              <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }} className="space-y-1">
                {nextLessonSeeds.map((seed, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A" }}>{seed}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
