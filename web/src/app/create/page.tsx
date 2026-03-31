"use client";

import { Shell } from "@/components/shell";
import { SUBJECTS, PHILOSOPHIES } from "@/lib/types";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const KG_SERVICE_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

interface ChildData {
  id: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  standardsOptIn: boolean;
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

export default function GeneratePageWrapper() {
  return (
    <Suspense>
      <GeneratePage />
    </Suspense>
  );
}

/** Detect subjects from standard code patterns */
function detectSubjectsFromStandards(codes: string[]): string[] {
  const subjects = new Set<string>();
  for (const code of codes) {
    const upper = code.toUpperCase();
    if (
      upper.startsWith("CCSS.MATH") ||
      upper.includes(".OA.") ||
      upper.includes(".NBT.")
    ) {
      subjects.add("Math");
    }
    if (
      upper.startsWith("CCSS.ELA-LITERACY") ||
      upper.includes(".RL.") ||
      upper.includes(".W.")
    ) {
      subjects.add("Language Arts");
    }
    if (
      upper.includes("-LS") ||
      upper.includes("-PS") ||
      upper.includes("-ESS")
    ) {
      subjects.add("Science");
    }
  }
  return Array.from(subjects);
}

function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [interest, setInterest] = useState(searchParams.get("interest") || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [philosophy, setPhilosophy] = useState("adaptive");
  const [multiSubject, setMultiSubject] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userState, setUserState] = useState("MI");

  // Standards from query param
  const standardsParam = searchParams.get("standards") || "";
  const [requiredStandards, setRequiredStandards] = useState<string[]>(() =>
    standardsParam ? standardsParam.split(",").filter(Boolean) : []
  );
  const [standardDescriptions, setStandardDescriptions] = useState<Record<string, string>>({});

  // Load descriptions: try sessionStorage first, then fetch from API
  useEffect(() => {
    if (requiredStandards.length === 0) return;

    // Try sessionStorage first
    try {
      const stored = sessionStorage.getItem("standardDescriptions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (requiredStandards.every((c) => parsed[c])) {
          setStandardDescriptions(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    // Fetch from API
    fetch(`/api/standards/lookup?codes=${encodeURIComponent(requiredStandards.join(","))}`)
      .then((r) => r.json())
      .then((data) => setStandardDescriptions(data))
      .catch(() => { /* silent */ });
  }, [requiredStandards]);

  const removeRequiredStandard = (code: string) => {
    setRequiredStandards((prev) => prev.filter((c) => c !== code));
  };

  // Auto-detect subjects from standards on mount
  useEffect(() => {
    if (requiredStandards.length > 0) {
      const detected = detectSubjectsFromStandards(requiredStandards);
      if (detected.length > 0) {
        setSelectedSubjects((prev) => {
          const merged = new Set([...prev, ...detected]);
          return Array.from(merged);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
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
    setError(null);
    setGeneratingStep(0);
    setElapsedSeconds(0);

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
          required_standards: requiredStandards.length > 0 ? requiredStandards : undefined,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Server error ${res.status}: ${detail}`);
      }

      const data = await res.json();

      // Auto-save to database and redirect to lesson page
      const saveRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: data.lesson,
          childIds: selectedChildren,
          scheduledDate: null,
          subjectNames: selectedSubjects,
        }),
      });
      const saveData = await saveRes.json();
      router.push(`/lessons/${saveData.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      clearInterval(timer);
      clearInterval(stepTimer);
      setGenerating(false);
    }
  };


  const selectedPhilosophy = PHILOSOPHIES.find((p) => p.id === philosophy);

  return (
    <Shell hue="generate">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-cormorant-sc text-3xl text-gray-900">Create a Lesson</h1>

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

            {/* Required Standards (from standards page) */}
            {requiredStandards.length > 0 && (
              <>
                <div className="border-t border-gray-100" />
                <div className="space-y-3">
                  <h2 className="font-medium text-gray-900">
                    <span style={{ fontSize: "0.7rem", fontVariant: "small-caps", letterSpacing: "0.05em", color: "#C4983D", textTransform: "uppercase", marginRight: "0.5rem" }}>
                      Required
                    </span>
                    Standards to cover
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {requiredStandards.map((code) => (
                      <div
                        key={code}
                        title={standardDescriptions[code] || code}
                        style={{
                          background: "rgba(196,152,61,0.08)",
                          border: "1px solid rgba(196,152,61,0.25)",
                          borderRadius: "8px",
                          padding: "0.4rem 0.6rem",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          maxWidth: "100%",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#C4983D", fontWeight: 600 }}>{code}</span>
                          {standardDescriptions[code] && (
                            <p style={{ fontSize: "0.7rem", color: "#5A5A5A", marginTop: "0.15rem", lineHeight: 1.4 }}>
                              {standardDescriptions[code]}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequiredStandard(code)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#767676",
                            fontSize: "0.85rem",
                            lineHeight: 1,
                            padding: "0 0.1rem",
                            display: "inline-flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                          aria-label={`Remove ${code}`}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    The generated lesson will specifically address these standards. Click &times; to remove any.
                  </p>
                </div>
              </>
            )}

            <div className="border-t border-gray-100" />

            {/* Generate button / progress */}
            {generating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Creating your lesson...</p>
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
              <div className="space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  style={nightButton}
                >
                  Create Lesson
                </button>
                <p style={{ fontSize: "0.75rem", color: "#999", textAlign: "center", fontStyle: "italic" }}>
                  Creating a lesson takes about 60 seconds. Please be patient.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
      </div>
    </Shell>
  );
}
