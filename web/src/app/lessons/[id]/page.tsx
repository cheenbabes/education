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
      <Shell>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Shell>
    );
  }

  if (error || !lesson) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-gray-500">{error || "Lesson not found"}</p>
          <Link href="/lessons" className="text-sm text-blue-600 hover:underline mt-2 block">
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
    <Shell>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/lessons" className="text-sm text-blue-600 hover:underline">
            &larr; All lessons
          </Link>
          {lessonSections.length > 0 && <PrintLesson lesson={printableLesson} />}
        </div>

        <div className="bg-white rounded border border-gray-200 p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
            {scheduledDate && (
              <p className="text-sm text-gray-500 mt-1">
                Scheduled: {scheduledDate}
              </p>
            )}
            {estimatedDuration && (
              <p className="text-sm text-gray-500">
                {estimatedDuration} minutes — {lesson.philosophy.replace(/-/g, " ")}
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {lesson.subjects.map((s) => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
              ))}
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{lesson.interest}</span>
              {children.map((c) => (
                <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {c.name} (Grade {c.gradeLevel})
                </span>
              ))}
            </div>
          </div>

          {/* Philosophy summary */}
          {philosophySummary && lesson.philosophy !== "flexible" && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                Philosophy: {lesson.philosophy.replace(/-/g, " ")}
              </h3>
              <p className="text-sm text-amber-800">{philosophySummary}</p>
            </div>
          )}

          {/* Differentiation */}
          {lessonChildren.some((c) => c.differentiation_notes) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Differentiation</h3>
              {lessonChildren.map((c) =>
                c.differentiation_notes ? (
                  <p key={c.child_id} className="text-sm text-gray-600">
                    <span className="font-medium">{c.name}:</span> {c.differentiation_notes}
                  </p>
                ) : null
              )}
            </div>
          )}

          {/* Completion / Rating section */}
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Completion</h3>
            {children.map((child) => {
              const completion = lesson.completions.find((c) => c.childId === child.id);
              if (completion) {
                return (
                  <div key={child.id} className="flex items-center justify-between bg-green-50 rounded p-3">
                    <div>
                      <p className="text-sm font-medium text-green-800">{child.name} — Completed</p>
                      {completion.notes && (
                        <p className="text-xs text-green-600 mt-0.5">{completion.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={`text-lg ${s <= completion.starRating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                );
              }

              if (showRating === child.id) {
                return (
                  <div key={child.id} className="border border-gray-200 rounded p-3 space-y-3">
                    <p className="text-sm font-medium text-gray-900">Rate this lesson for {child.name}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setSelectedStar(star)}
                          className={`text-2xl ${
                            star <= (hoverStar || selectedStar)
                              ? "text-yellow-400"
                              : "text-gray-200"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes — how did it go? (e.g., 'she loved sketching the bark')"
                      className="border border-gray-300 rounded px-3 py-2 text-sm w-full h-20 resize-none text-gray-900"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRate(child.id)}
                        disabled={selectedStar === 0 || submitting}
                        className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm disabled:opacity-50"
                      >
                        {submitting ? "Saving..." : "Complete"}
                      </button>
                      <button
                        onClick={() => { setShowRating(null); setSelectedStar(0); setNotes(""); }}
                        className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm"
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
                  className="w-full text-left p-3 rounded border border-gray-200 hover:bg-gray-50 text-sm text-gray-700"
                >
                  Rate &amp; complete for <span className="font-medium">{child.name}</span>
                </button>
              );
            })}
          </div>

          {/* Standards */}
          {standardsAddressed.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Standards Addressed ({standardsAddressed.length})
              </h3>
              <div className="space-y-2">
                {standardsAddressed.map((s, i) => (
                  <div key={i} className="text-sm border-l-2 border-green-300 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono">{s.code}</span>
                      <span className="text-gray-600">{s.description_plain}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.how_addressed}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {materialsNeeded.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Materials Needed</h3>
              <div className="space-y-1">
                {materialsNeeded.map((m, i) => (
                  <div key={i} className="text-sm text-gray-600">
                    <span className="font-medium">{m.name}</span>
                    {m.optional && <span className="text-xs text-gray-400 ml-1">(optional)</span>}
                    {m.household_alternative && (
                      <span className="text-gray-400"> — or: {m.household_alternative}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Sections */}
          {lessonSections.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Lesson Plan</h3>
              <div className="space-y-4">
                {lessonSections.map((section, i) => (
                  <div key={i} className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {section.duration_minutes} min
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          section.indoor_outdoor === "outdoor"
                            ? "bg-green-50 text-green-700"
                            : section.indoor_outdoor === "indoor"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}>
                          {section.indoor_outdoor}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {section.instructions}
                    </div>
                    {section.philosophy_connection && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        {section.philosophy_connection}
                      </p>
                    )}
                    {section.tips?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">Tips:</p>
                        <ul className="list-disc list-inside">
                          {section.tips.map((tip, j) => (
                            <li key={j} className="text-xs text-gray-500">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.extensions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">Extensions:</p>
                        <ul className="list-disc list-inside">
                          {section.extensions.map((ext, j) => (
                            <li key={j} className="text-xs text-gray-500">{ext}</li>
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
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Assessment</h3>
              <ul className="list-disc list-inside space-y-1">
                {assessmentSuggestions.map((a, i) => (
                  <li key={i} className="text-sm text-gray-600">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next lesson ideas */}
          {nextLessonSeeds.length > 0 && (
            <div className="bg-gray-50 rounded p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Ideas for Next Lesson</h3>
              <ul className="list-disc list-inside space-y-1">
                {nextLessonSeeds.map((seed, i) => (
                  <li key={i} className="text-sm text-gray-600">{seed}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
