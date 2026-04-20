"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { SUBJECTS, PHILOSOPHIES, GRADES, US_STATES } from "@/lib/types";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";


interface ChildData {
  id: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  standardsOptIn: boolean;
  learningNotes?: string | null;
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
  const [philosophy, setPhilosophy] = useState("");
  const [multiSubject, setMultiSubject] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userState, setUserState] = useState("MI");
  const [tier, setTier] = useState<string | null>(null);
  const [lessonsUsed, setLessonsUsed] = useState(0);
  const [lessonsLimit, setLessonsLimit] = useState(3);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [freeGrade, setFreeGrade] = useState("K");
  const [freeState, setFreeState] = useState("");
  const [showLimitOverlay, setShowLimitOverlay] = useState(false);
  const [archetypePhilosophyIds, setArchetypePhilosophyIds] = useState<string[]>([]);
  const generatingRef = useRef(false);

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

  const gradeToAge = (grade: string): number => {
    if (grade === "K") return 5;
    const n = parseInt(grade, 10);
    return isNaN(n) ? 5 : n + 5;
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/children").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/user/tier").then((r) => r.json()),
      fetch("/api/user/archetype").then((r) => r.json()),
    ]).then(([childrenData, userData, tierData, archetypeData]) => {
      setChildren(childrenData);
      if (userData.state) {
        setUserState(userData.state);
        setFreeState((prev) => prev || userData.state);
      }
      setTier(tierData.tier);
      setLessonsUsed(tierData.lessonsUsed);
      setLessonsLimit(tierData.lessonsLimit);
      if (tierData.resetsAt) setResetsAt(tierData.resetsAt);
      if (archetypeData) {
        setArchetypePhilosophyIds(archetypeData.topPhilosophyIds ?? []);

      }
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

  const isCompass = tier === "compass";
  const canGenerate =
    !generating &&
    (isCompass || selectedChildren.length > 0) &&
    interest.trim().length > 0 &&
    selectedSubjects.length > 0 &&
    philosophy.length > 0;

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
    if (generatingRef.current) return; // prevent double-trigger
    generatingRef.current = true;
    setGenerating(true);
    setError(null);

    // content check first
    const check = await fetch("/api/lessons/check-topic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interest }) })
    const checkData = await check.json()
    if (!checkData.safe) {
      setTopicError("This topic isn't appropriate for a children's lesson. Please choose a different subject.")
      generatingRef.current = false;
      setGenerating(false);
      return
    }
    setTopicError(null)

    setGeneratingStep(0);
    setElapsedSeconds(0);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const stepTimer = setInterval(() => {
      setGeneratingStep((prev) => Math.min(prev + 1, GENERATION_STEPS.length - 1));
    }, 2500);

    const childPayload = isCompass
      ? [{ id: "free-tier-student", name: "Student", grade: freeGrade, age: gradeToAge(freeGrade), standards_opt_in: !!(freeState || userState) }]
      : selectedChildren.map((id) => {
          const child = children.find((c) => c.id === id)!;
          return {
            id: child.id,
            name: child.name,
            grade: child.gradeLevel,
            age: getAge(child.dateOfBirth),
            standards_opt_in: child.standardsOptIn,
            learning_notes: child.learningNotes || null,
          };
        });

    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          children: childPayload,
          interest,
          subjects: selectedSubjects,
          philosophy,
          state: isCompass ? (freeState || userState) : userState,
          multi_subject_optimize: multiSubject,
          past_lesson_hashes: [],
          required_standards: requiredStandards.length > 0 ? requiredStandards : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 429 && data?.error === "monthly_limit") {
          setShowLimitOverlay(true);
          return;
        }

        const messageByCode: Record<string, string> = {
          generation_failed: "Lesson generation is temporarily unavailable. Please try again in a minute.",
          invalid_generation_request: "This lesson request could not be processed. Please review your selections and try again.",
          Unauthorized: "Your session expired. Please sign in again and try again.",
        };
        const message =
          (data?.error && messageByCode[data.error]) ||
          `Server error ${res.status}. Please try again.`;
        throw new Error(message);
      }

      const data = await res.json();

      // Auto-save to database and redirect to lesson page
      const saveRes = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson: data.lesson,
          childIds: isCompass ? [] : selectedChildren,
          scheduledDate: null,
          subjectNames: selectedSubjects,
          generationCostUsd: data.generation_cost_usd ?? null,
        }),
      });
      if (saveRes.status === 429) {
        setShowLimitOverlay(true);
        return;
      }
      if (!saveRes.ok) {
        const saveError = await saveRes.json().catch(() => null);
        throw new Error(saveError?.error === "monthly_limit"
          ? "You've used all of your lesson generations for this month."
          : "Saving the lesson failed. Please try again.");
      }
      const saveData = await saveRes.json();
      router.push(`/lessons/${saveData.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      clearInterval(timer);
      clearInterval(stepTimer);
      setGenerating(false);
      generatingRef.current = false;
    }
  };


  const selectedPhilosophy = PHILOSOPHIES.find((p) => p.id === philosophy);

  return (
    <Shell hue="generate">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-cormorant-sc text-3xl text-gray-900">Create a Lesson</h1>

          <div style={frostCard} className="space-y-6">
            {/* Step 1: Select children or grade */}
            <div className="space-y-3">
              {isCompass ? (
                <>
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    {/* Grade dropdown */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
                        Grade Level
                      </label>
                      <div style={{ position: "relative", width: "13rem" }}>
                        <select
                          value={freeGrade}
                          onChange={(e) => setFreeGrade(e.target.value)}
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.5)",
                            borderRadius: "10px",
                            padding: "0.55rem 2rem 0.55rem 0.75rem",
                            fontSize: "0.875rem",
                            color: "var(--ink)",
                            outline: "none",
                            appearance: "none",
                            WebkitAppearance: "none",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                          }}
                        >
                          {GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g === "K" ? "Kindergarten" : `Grade ${g}`}
                            </option>
                          ))}
                        </select>
                        <svg style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* State dropdown */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.4rem" }}>
                        State Standards
                      </label>
                      <div style={{ position: "relative", width: "13rem" }}>
                        <select
                          value={freeState || userState}
                          onChange={(e) => setFreeState(e.target.value)}
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.5)",
                            borderRadius: "10px",
                            padding: "0.55rem 2rem 0.55rem 0.75rem",
                            fontSize: "0.875rem",
                            color: "var(--ink)",
                            outline: "none",
                            appearance: "none",
                            WebkitAppearance: "none",
                            cursor: "pointer",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                          }}
                        >
                          {US_STATES.map((s) => (
                            <option key={s.abbr} value={s.abbr}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <svg style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Step 2: Interest */}
            <div className="space-y-3">
              <h2 className="font-medium text-gray-900">
                <span style={{ fontSize: "0.7rem", fontVariant: "small-caps", letterSpacing: "0.05em", color: "#6E6E9E", textTransform: "uppercase", marginRight: "0.5rem" }}>
                  Lesson Seed
                </span>
                What is your child curious about?
              </h2>
              <input
                type="text"
                value={interest}
                onChange={(e) => { setInterest(e.target.value); setTopicError(null); }}
                maxLength={200}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full text-gray-900 bg-white/70 focus:outline-none focus:ring-2"
                style={{ focusRingColor: "#6E6E9E" } as React.CSSProperties}
                placeholder="e.g., how volcanoes erupt"
              />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Lessons work best with <span className="font-medium text-gray-700">one specific idea</span>, not a list of topics. Pick the single thing your child is most curious about right now.
                </p>
                <p className="text-xs text-gray-400 shrink-0">{interest.length}/200</p>
              </div>
              {topicError && (
                <p className="text-xs" style={{ color: "#DC2626" }}>{topicError}</p>
              )}
              {isCompass && tier !== null && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(255,255,255,0.68)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${lessonsLimit >= 0 && lessonsUsed >= lessonsLimit ? "rgba(220,38,38,0.3)" : lessonsLimit >= 0 && lessonsUsed >= lessonsLimit - 1 ? "rgba(196,152,61,0.3)" : "rgba(255,255,255,0.45)"}`,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.7rem",
                  fontWeight: 500,
                  color: lessonsLimit >= 0 && lessonsUsed >= lessonsLimit ? "#DC2626" : lessonsLimit >= 0 && lessonsUsed >= lessonsLimit - 1 ? "#B08A2E" : "#5A5A5A",
                }}>
                  {lessonsLimit >= 0 ? `${lessonsUsed} of ${lessonsLimit} free lessons used this month` : `${lessonsUsed} lessons created this month`}
                </div>
              )}
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
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h2 className="font-medium text-gray-900">Educational approach</h2>
                {archetypePhilosophyIds.length > 0 ? (
                  <span style={{ fontSize: "14px", color: "#82284b" }}>
                    ✦ Highlighted match your archetype
                  </span>
                ) : (
                  <Link href="/compass" style={{ fontSize: "0.7rem", color: "var(--accent-primary)", textDecoration: "none" }}>
                    Take the Compass Assessment to find your match →
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {PHILOSOPHIES.map((p) => {
                  const isMatch = archetypePhilosophyIds.includes(p.id);
                  const isSelected = philosophy === p.id;
                  return (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded cursor-pointer transition-colors"
                    style={
                      isSelected
                        ? { background: "#082f4e", color: "#F9F6EF", borderRadius: "8px", border: "none" }
                        : isMatch
                        ? { background: "linear-gradient(135deg, rgba(130,40,75,0.08), rgba(253,181,192,0.15))", border: "1px solid rgba(130,40,75,0.25)", borderRadius: "8px" }
                        : { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "8px" }
                    }
                  >
                    <input
                      type="radio"
                      name="philosophy"
                      value={p.id}
                      checked={isSelected}
                      onChange={(e) => setPhilosophy(e.target.value)}
                      className="mt-0.5"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <p className={`text-sm font-medium ${isSelected ? "text-[#F9F6EF]" : "text-gray-900"}`}>
                          {p.label}
                        </p>
                        {isMatch && !isSelected && (
                          <span style={{ fontSize: "0.6rem", color: "#82284b", fontWeight: 600 }}>✦</span>
                        )}
                      </div>
                      <p className={`text-xs ${isSelected ? "text-[#F9F6EF]/70" : "text-gray-500"}`}>
                        {p.description}
                      </p>
                    </div>
                  </label>
                  );
                })}
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

      {/* 429 limit overlay */}
      {showLimitOverlay && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(249,246,239,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
          <div
            className="frost-card"
            style={{
              maxWidth: "440px",
              width: "90%",
              padding: "2.5rem 2rem",
              textAlign: "center",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "14px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="font-cormorant-sc" style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: "0.5rem",
            }}>
              {"You've used all "}{lessonsLimit >= 0 ? lessonsLimit : ""}{" lessons this month"}
            </h2>
            {resetsAt && (
              <p style={{ fontSize: "0.85rem", color: "#5A5A5A", marginBottom: "1.25rem" }}>
                Resets {new Date(resetsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            <a
              href="/compass"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "10px",
                background: "var(--night)",
                color: "var(--parchment)",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.02em",
                boxSizing: "border-box",
              }}
            >
              Upgrade to Homestead — $21.99/mo
            </a>
            <button
              onClick={() => setShowLimitOverlay(false)}
              style={{
                display: "inline-block",
                marginTop: "0.75rem",
                fontSize: "0.78rem",
                color: "#999",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
