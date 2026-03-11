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

export default function GeneratePage() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [interest, setInterest] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [philosophy, setPhilosophy] = useState("flexible");
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
    <Shell>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Generate a Lesson</h1>

        {!result ? (
          <div className="space-y-6">
            {/* Step 1: Select children */}
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Who is this lesson for?</h2>
              {loadingChildren ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading children...</p>
              ) : children.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No children added yet. <a href="/children" className="text-blue-600 hover:underline">Add a child</a> first.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => toggleChild(child.id)}
                      className={`px-3 py-2 rounded border text-sm ${
                        selectedChildren.includes(child.id)
                          ? "border-gray-900 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                      }`}
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

            {/* Step 2: Interest */}
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">What is your child interested in right now?</h2>
              <input
                type="text"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm w-full text-gray-900 dark:text-gray-100"
                placeholder="e.g., dinosaurs, fire trucks, trees, outer space, cooking..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will be the theme of the lesson. It can be anything your child is curious about.
              </p>
            </div>

            {/* Step 3: Subjects */}
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Which subject(s)?</h2>
              <div className="flex gap-2 flex-wrap">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`px-3 py-2 rounded border text-sm ${
                      selectedSubjects.includes(subject)
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
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
                  <span className="text-gray-700 dark:text-gray-300">
                    Optimize for covering multiple subjects in one lesson
                  </span>
                </label>
              )}
            </div>

            {/* Step 4: Philosophy */}
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <h2 className="font-medium text-gray-900 dark:text-gray-100">Educational approach</h2>
              <div className="space-y-2">
                {PHILOSOPHIES.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded border cursor-pointer ${
                      philosophy === p.id
                        ? "border-gray-900 bg-gray-50 dark:bg-gray-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
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

            {/* Generate button / progress */}
            {generating ? (
              <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Generating your lesson...</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{elapsedSeconds}s</span>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gray-900 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(((generatingStep + 1) / GENERATION_STEPS.length) * 100, 95)}%` }}
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
                className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="text-sm text-blue-600 hover:underline"
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
                      className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleSaveToCalendar}
                      disabled={saveStatus === "saving"}
                      className="px-4 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                    >
                      {saveStatus === "saving" ? "Saving..." : "Save to Calendar"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-6 space-y-5">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{result.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {result.estimated_duration_minutes} minutes — {result.philosophy.replace(/-/g, " ")}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {result.children.map((c) => (
                    <span key={c.child_id} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 px-2 py-0.5 rounded">
                      {c.name} (Grade {c.grade}, Age {c.age})
                    </span>
                  ))}
                </div>
              </div>

              {/* Philosophy summary */}
              {result.philosophy_summary && result.philosophy !== "flexible" && (
                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                  <h3 className="text-sm font-medium text-amber-900 mb-1">
                    Why this is {PHILOSOPHIES.find(p => p.id === result.philosophy)?.label || result.philosophy}
                  </h3>
                  <p className="text-sm text-amber-800">{result.philosophy_summary}</p>
                </div>
              )}

              {/* Differentiation notes per child */}
              {result.children.some((c) => c.differentiation_notes) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Differentiation</h3>
                  {result.children.map((c) => (
                    c.differentiation_notes && (
                      <p key={c.child_id} className="text-sm text-gray-600 dark:text-gray-400">
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
                          <span className="text-gray-600 dark:text-gray-400">{s.description_plain}</span>
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
                    <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{m.name}</span>
                      {m.optional && <span className="text-xs text-gray-400 ml-1">(optional)</span>}
                      {m.household_alternative && (
                        <span className="text-gray-400 dark:text-gray-500"> — or: {m.household_alternative}</span>
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
                    <div key={i} className="border border-gray-100 dark:border-gray-800 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{section.title}</h4>
                        <div className="flex gap-2">
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">
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
                      {section.tips.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tips:</p>
                          <ul className="list-disc list-inside">
                            {section.tips.map((tip, j) => (
                              <li key={j} className="text-xs text-gray-500 dark:text-gray-400">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {section.extensions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Extensions:</p>
                          <ul className="list-disc list-inside">
                            {section.extensions.map((ext, j) => (
                              <li key={j} className="text-xs text-gray-500 dark:text-gray-400">{ext}</li>
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
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next lesson ideas */}
              {result.next_lesson_seeds.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Ideas for Next Lesson</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.next_lesson_seeds.map((seed, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{seed}</li>
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
