"use client";

import { Shell } from "@/components/shell";
import { PrintLesson } from "@/components/print-lesson";
import { SUBJECTS, PHILOSOPHIES } from "@/lib/types";
import { useState, useEffect } from "react";

const KG_SERVICE_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

interface ChildData {
  id: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  standardsOptIn: boolean;
}

interface LessonPlan {
  title: string;
  theme: string;
  estimated_duration_minutes: number;
  philosophy: string;
  philosophy_summary: string;
  children: { child_id: string; name: string; grade: string; age: number; differentiation_notes: string }[];
  standards_addressed: { code: string; description_plain: string; how_addressed: string }[];
  materials_needed: { name: string; household_alternative: string; optional: boolean }[];
  lesson_sections: { title: string; duration_minutes: number; type: string; indoor_outdoor: string; instructions: string; philosophy_connection: string; tips: string[]; extensions: string[] }[];
  assessment_suggestions: string[];
  next_lesson_seeds: string[];
  content_hash: string | null;
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

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  fontSize: "0.85rem",
};

export default function GeneratePage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [interest, setInterest] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [philosophy, setPhilosophy] = useState("adaptive");
  const [multiSubject, setMultiSubject] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [userState, setUserState] = useState("MI");

  useEffect(() => {
    Promise.all([
      fetch("/api/children?userId=demo-user").then((r) => r.json()),
      fetch("/api/user?userId=demo-user").then((r) => r.json()),
    ]).then(([childrenData, userData]) => {
      setChildren(childrenData);
      if (userData.state) setUserState(userData.state);
      setLoadingChildren(false);
    });
  }, []);

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const toggleChild = (id: string) => {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const canGenerate =
    selectedChildren.length > 0 &&
    interest.trim().length > 0 &&
    selectedSubjects.length > 0;

  const GENERATION_STEPS = [
    "Looking up state standards...",
    "Gathering philosophy principles...",
    "Checking developmental milestones...",
    "Designing lesson activities...",
    "Writing lesson plan...",
    "Validating standards alignment...",
    "Finalizing...",
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    setError(null);
    setGeneratingStep(0);
    setElapsedSeconds(0);
    setSaveStatus("idle");
    setSavedLessonId(null);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const stepTimer = setInterval(() => {
      setGeneratingStep((prev) => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, 2500);

    const childPayload = selectedChildren.map((id) => {
      const child = children.find((c) => c.id === id)!;
      return {
        id: child.id,
        name: child.name,
        grade: child.gradeLevel,
        age: getAge(child.dateOfBirth),
        standards_opt_in: child.standardsOptIn,
      };
    });

    try {
      const res = await fetch(`${KG_SERVICE_URL}/generate-lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          children: childPayload,
          interest,
          subjects: selectedSubjects,
          philosophy,
          state: userState,
          multi_subject_optimize: multiSubject,
          past_lesson_hashes: [],
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Server error ${res.status}: ${detail}`);
      }

      const data = await res.json();
      setResult(data.lesson);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      clearInterval(timer);
      clearInterval(stepTimer);
      setGenerating(false);
    }
  };

  const handleSaveToCalendar = async () => {
    if (!result) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: result,
          childIds: selectedChildren,
          scheduledDate: scheduledDate || null,
          userId: "demo-user",
        }),
      });
      const data = await res.json();
      setSavedLessonId(data.id);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("idle");
      setError("Failed to save lesson");
    }
  };

  const selectedPhilosophy = PHILOSOPHIES.find((p) => p.id === philosophy);

  return (
    <Shell hue="generate">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-cormorant-sc text-3xl text-gray-900">Generate a Lesson</h1>

        {!result ? (
          <div style={frostCard} className="space-y-6">
            {/* Step 1: Select children */}
            <div className="space-y-3">
              <h2 className="font-medium text-gray-900">Who is this lesson for?</h2>
              {loadingChildren ? (
                <p className="text-sm text-gray-500">Loading children...</p>
              ) : children.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No children added yet.{" "}
                  <a href="/children" className="hover:underline" style={{ color: "#6E6E9E" }}>
                    Add a child
                  </a>{" "}
                  first.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => toggleChild(child.id)}
                      className="text-sm transition-colors"
                      style={
                        selectedChildren.includes(child.id)
                          ? { ...nightButton, padding: "0.4rem 0.8rem" }
                          : { ...frostPill, fontSize: "0.8rem", padding: "0.4rem 0.8rem", color: "#374151" }
                      }
                    >
                      {child.name} (Grade {child.gradeLevel})
                    </button>
                  ))}
                </div>
              )}
              {selectedChildren.length > 1 && (
                <p className="text-xs text-green-600">
                  Multi-age lesson — each child will get objectives at their grade level.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Step 2: Interest */}
            <div className="space-y-3">
              <h2 className="font-medium text-gray-900">
                <span style={{ fontSize: "0.7rem", fontVariant: "small-caps", letterSpacing: "0.05em", color: "#6E6E9E", textTransform: "uppercase", marginRight: "0.5rem" }}>
                  Interest
                </span>
                What is your child curious about?
              </h2>
              <input
                type="text"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full text-gray-900 bg-white/70 focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#6E6E9E" } as React.CSSProperties}
                placeholder="e.g., dinosaurs, fire trucks, trees, outer space, cooking..."
              />
              <p className="text-xs text-gray-500">
                This will be the theme of the lesson. Follow your child&apos;s curiosity!
              </p>
            </div>

            <div className="border-t border-gray-100" />

            {/* Step 3: Subjects */}
            <div className="space-y-3">
              <h2 className="font-medium text-gray-900">Which subject(s)?</h2>
              <div className="flex gap-2 flex-wrap">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className="text-sm transition-colors"
                    style={
                      selectedSubjects.includes(subject)
                        ? { ...nightButton, padding: "0.4rem 0.8rem" }
                        : { ...frostPill, fontSize: "0.8rem", padding: "0.4rem 0.8rem", color: "#374151" }
                    }
                  >
                    {subject}
                  </button>
                ))}
              </div>
              {selectedSubjects.length > 0 && (
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={multiSubject}
                    onChange={(e) => setMultiSubject(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-700">
                    Optimize for covering multiple subjects in one lesson
                  </span>
                </label>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Step 4: Philosophy */}
            <div className="space-y-3">
              <h2 className="font-medium text-gray-900">Educational approach</h2>
              <div className="space-y-2">
                {PHILOSOPHIES.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded cursor-pointer transition-colors"
                    style={
                      philosophy === p.id
                        ? {
                            background: "#0B2E4A",
                            color: "#F9F6EF",
                            borderRadius: "8px",
                            border: "none",
                          }
                        : {
                            background: "rgba(255,255,255,0.5)",
                            border: "1px solid rgba(255,255,255,0.4)",
                            borderRadius: "8px",
                          }
                    }
                  >
                    <input
                      type="radio"
                      name="philosophy"
                      value={p.id}
                      checked={philosophy === p.id}
                      onChange={(e) => setPhilosophy(e.target.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className={`text-sm font-medium ${philosophy === p.id ? "text-[#F9F6EF]" : "text-gray-900"}`}>
                        {p.label}
                      </p>
                      <p className={`text-xs ${philosophy === p.id ? "text-[#F9F6EF]/70" : "text-gray-500"}`}>
                        {p.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedPhilosophy && "disclaimer" in selectedPhilosophy && selectedPhilosophy.disclaimer && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  {selectedPhilosophy.disclaimer}
                </p>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Generate button / progress */}
            {generating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Generating your lesson...</p>
                  <span className="text-xs text-gray-400">{elapsedSeconds}s</span>
                </div>

                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(((generatingStep + 1) / GENERATION_STEPS.length) * 100, 95)}%`,
                      backgroundColor: "#6E6E9E",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  {GENERATION_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${
                      i < generatingStep ? "text-green-600" :
                      i === generatingStep ? "text-gray-900 font-medium" :
                      "text-gray-300"
                    }`}>
                      {i < generatingStep ? (
                        <span className="text-green-500 text-xs">&#10003;</span>
                      ) : i === generatingStep ? (
                        <span className="inline-block w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
                      )}
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={nightButton}
              >
                Generate Lesson
              </button>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Real lesson result */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setResult(null); setSaveStatus("idle"); setSavedLessonId(null); }}
                className="text-sm hover:underline"
                style={{ color: "#6E6E9E" }}
              >
                &larr; Generate another
              </button>
              <div className="flex gap-2 items-center">
                <PrintLesson lesson={result} />
                {saveStatus === "saved" && savedLessonId ? (
                  <a
                    href={`/lessons/${savedLessonId}`}
                    className="px-4 py-1.5 bg-green-600 text-white rounded text-sm"
                  >
                    Saved — View Lesson
                  </a>
                ) : (
                  <>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900"
                    />
                    <button
                      onClick={handleSaveToCalendar}
                      disabled={saveStatus === "saving"}
                      className="text-sm disabled:opacity-50"
                      style={{ ...nightButton, padding: "0.4rem 0.8rem" }}
                    >
                      {saveStatus === "saving" ? "Saving..." : "Save to Calendar"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={frostCard} className="space-y-5">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{result.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {result.estimated_duration_minutes} minutes — {result.philosophy.replace(/-/g, " ")}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {result.children.map((c) => (
                    <span key={c.child_id} style={frostPill}>
                      {c.name} (Grade {c.grade}, Age {c.age})
                    </span>
                  ))}
                </div>
              </div>

              {/* Philosophy summary */}
              {result.philosophy_summary && result.philosophy !== "adaptive" && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px",
                    padding: "1rem",
                    borderLeft: "4px solid #7A9E8A",
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-800 mb-1">
                    Why this is {PHILOSOPHIES.find(p => p.id === result.philosophy)?.label || result.philosophy}
                  </h3>
                  <p className="text-sm text-gray-700">{result.philosophy_summary}</p>
                </div>
              )}

              {/* Differentiation notes per child */}
              {result.children.some((c) => c.differentiation_notes) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Differentiation</h3>
                  {result.children.map((c) => (
                    c.differentiation_notes && (
                      <p key={c.child_id} className="text-sm text-gray-600">
                        <span className="font-medium">{c.name}:</span> {c.differentiation_notes}
                      </p>
                    )
                  ))}
                </div>
              )}

              {/* Standards */}
              {result.standards_addressed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Standards Addressed ({result.standards_addressed.length})
                  </h3>
                  <div className="space-y-2">
                    {result.standards_addressed.map((s, i) => (
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
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Materials Needed</h3>
                <div className="space-y-1">
                  {result.materials_needed.map((m, i) => (
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

              {/* Lesson Sections */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Lesson Plan</h3>
                <div className="space-y-4">
                  {result.lesson_sections.map((section, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.72)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.5)",
                        borderRadius: "12px",
                        padding: "1rem",
                        borderLeft: "4px solid #9B7E8E",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{section.title}</h4>
                        <div className="flex gap-2">
                          <span style={frostPill}>
                            {section.duration_minutes} min
                          </span>
                          <span
                            style={{
                              ...frostPill,
                              color:
                                section.indoor_outdoor === "outdoor"
                                  ? "#15803d"
                                  : section.indoor_outdoor === "indoor"
                                  ? "#6E6E9E"
                                  : "#7e22ce",
                            }}
                          >
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
                      {section.tips.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500">Tips:</p>
                          <ul className="list-disc list-inside">
                            {section.tips.map((tip, j) => (
                              <li key={j} className="text-xs text-gray-500">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {section.extensions.length > 0 && (
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

              {/* Assessment */}
              {result.assessment_suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Assessment</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.assessment_suggestions.map((a, i) => (
                      <li key={i} className="text-sm text-gray-600">{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next lesson ideas */}
              {result.next_lesson_seeds.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    borderRadius: "8px",
                    padding: "1rem",
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    <span style={{ fontSize: "0.7rem", fontVariant: "small-caps", letterSpacing: "0.05em", color: "#6E6E9E", textTransform: "uppercase", marginRight: "0.5rem" }}>
                      Seed
                    </span>
                    Ideas for Next Lesson
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.next_lesson_seeds.map((seed, i) => (
                      <li key={i} className="text-sm text-gray-600">{seed}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
