"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Shell } from "@/components/shell";
import { PART1_QUESTIONS, PART2_QUESTIONS, Part2Question } from "@/lib/compass/questions";
import { getCompassSessionId } from "@/lib/compassSession";
import { track } from "@/lib/analytics";

// Enriches raw answer indices with question text and selected answer text
// so stored results are human-readable without needing to re-import question data
function buildRichAnswers(
  part1Answers: Record<string, number>,
  part2Answers: Record<string, string | string[]>
) {
  const richPart1 = PART1_QUESTIONS.map((q) => ({
    questionId: q.id,
    theme: q.theme,
    question: q.scenario,
    selectedIndex: part1Answers[q.id] ?? null,
    selectedText: part1Answers[q.id] != null
      ? (q.choices[part1Answers[q.id]]?.text ?? null)
      : null,
  }));

  const richPart2 = PART2_QUESTIONS
    .filter((q) => part2Answers[q.id] !== undefined)
    .map((q) => {
      const raw = part2Answers[q.id];
      const selectedValues = Array.isArray(raw) ? raw : [raw];
      const selectedLabels = selectedValues.map(
        (v) => q.choices.find((c) => c.value === v)?.label ?? v
      );
      return {
        questionId: q.id,
        question: q.question,
        selectedValues,
        selectedLabels,
      };
    });

  return { part1: richPart1, part2: richPart2 };
}
import { ARCHETYPES } from "@/lib/compass/archetypes";
import {
  scoreCompass,
  CompassResult,
  DIMENSION_LABELS,
  PHILOSOPHY_LABELS,
  PHILOSOPHY_COLORS,
  PhilosophyKey,
} from "@/lib/compass/scoring";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type QuizPhase = "part1" | "compass-reveal" | "part2";

export default function QuizPage() {
  return (
    <Suspense>
      <QuizPageInner />
    </Suspense>
  );
}

function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "true"; // debug off by default, enable with ?debug=true
  const { isSignedIn } = useUser();

  // Resume after auth redirect
  const resuming = searchParams.get("resume") === "true";

  // Part 1 state
  const [part1Answers, setPart1Answers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  // Compass result (calculated after Part 1)
  const [compassResult, setCompassResult] = useState<CompassResult | null>(null);

  // Part 2 state
  const [part2Answers, setPart2Answers] = useState<Record<string, string | string[]>>({});
  const [currentP2, setCurrentP2] = useState(0);

  // Phase management
  const [phase, setPhase] = useState<QuizPhase>("part1");

  const skipToP2 = searchParams.get("skipToP2") === "true";

  // Skip straight to Part 2 when coming from the results page
  useEffect(() => {
    if (!skipToP2) return;
    try {
      const saved = sessionStorage.getItem("compass_result");
      if (saved) {
        const stored = JSON.parse(saved);
        // Reconstruct a CompassResult-compatible object from stored data
        const archObj = ARCHETYPES?.find?.((a: { id: string }) => a.id === stored.archetype);
        if (archObj) {
          setCompassResult({
            archetype: archObj,
            secondaryArchetype: stored.secondaryArchetype
              ? ARCHETYPES?.find?.((a: { id: string }) => a.id === stored.secondaryArchetype) ?? null
              : null,
            dimensions: stored.dimensions || stored.dimensionScores || {},
            philosophies: stored.philosophies || stored.philosophyBlend || {},
            structureFlowSplit: stored.structureFlowSplit,
          } as Parameters<typeof setCompassResult>[0]);
        }
        setPhase("part2");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipToP2]);

  // Resume after auth: restore part1 answers, re-score, jump to compass-reveal
  useEffect(() => {
    if (!resuming) return;
    try {
      const saved = sessionStorage.getItem("compass_part1_answers");
      if (saved) {
        const answers = JSON.parse(saved) as Record<string, number>;
        setPart1Answers(answers);
        const result = scoreCompass(answers);
        setCompassResult(result);
        setPhase("compass-reveal");
        sessionStorage.removeItem("compass_part1_answers");
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resuming]);

  const totalPart1 = PART1_QUESTIONS.length;

  // Fire quiz-started once per mount, tagging resume/skip entries so we can
  // separate fresh quiz attempts from post-auth continuations.
  useEffect(() => {
    track("compass_quiz_started", {
      signed_in: !!isSignedIn,
      resuming,
      skip_to_p2: skipToP2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compass-reveal impression: fires when the user reaches the archetype reveal
  // between Part 1 and Part 2. No longer a signup gate — everyone continues freely.
  useEffect(() => {
    if (phase === "compass-reveal" && compassResult) {
      track("compass_reveal_shown", {
        archetype: compassResult.archetype.id,
        secondary_archetype: compassResult.secondaryArchetype?.id || null,
        signed_in: !!isSignedIn,
      });
    }
  }, [phase, isSignedIn, compassResult]);

  // Part 2 start: covers the "Continue to Curriculum Matching" button,
  // the skipToP2=true URL path, and the resume-after-auth path.
  useEffect(() => {
    if (phase === "part2" && compassResult) {
      track("compass_part2_started", {
        archetype: compassResult.archetype.id,
        source: skipToP2 ? "skip_to_p2" : resuming ? "resume" : "direct",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, compassResult]);

  // Filter Part 2 questions based on conditional logic
  const visiblePart2Questions = useMemo(() => {
    return PART2_QUESTIONS.filter((q) => {
      if (!q.showWhen) return true;
      const depAnswer = part2Answers[q.showWhen.questionId];
      if (Array.isArray(depAnswer)) {
        return depAnswer.some((v) => q.showWhen!.values.includes(v));
      }
      return q.showWhen.values.includes(depAnswer as string);
    });
  }, [part2Answers]);

  const handlePart1Select = useCallback(
    (choiceIdx: number) => {
      if (animating) return;
      setSelectedChoice(choiceIdx);

      // Brief delay before advancing
      setAnimating(true);
      setTimeout(() => {
        const qId = PART1_QUESTIONS[currentQ].id;
        const newAnswers = { ...part1Answers, [qId]: choiceIdx };
        setPart1Answers(newAnswers);

        if (currentQ + 1 < totalPart1) {
          setCurrentQ(currentQ + 1);
          setSelectedChoice(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          // Score and show compass
          const result = scoreCompass(newAnswers);
          setCompassResult(result);
          setPhase("compass-reveal");
          window.scrollTo({ top: 0, behavior: "smooth" });
          track("compass_part1_completed", {
            signed_in: !!isSignedIn,
            archetype: result.archetype.id,
            secondary_archetype: result.secondaryArchetype?.id || null,
          });
          // Save Part 1 result immediately — if user doesn't complete Part 2,
          // their archetype is still persisted. Part 2 completion creates a newer
          // record with preferences, which GET /api/user/archetype returns instead.
          fetch("/api/compass/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              archetype: result.archetype.id,
              secondaryArchetype: result.secondaryArchetype?.id || null,
              dimensionScores: result.dimensions,
              philosophyBlend: result.philosophies,
              part2Preferences: {},
              quizAnswers: buildRichAnswers(newAnswers, {}),
              sessionId: getCompassSessionId(),
            }),
          })
            .then((res) => {
              if (!res.ok) {
                track("compass_submit_failed", { step: "part1", status: res.status });
              }
            })
            .catch((err) => {
              track("compass_submit_failed", {
                step: "part1",
                reason: err instanceof Error ? err.message : "network_error",
              });
            });
        }
        setAnimating(false);
      }, 400);
    },
    [animating, currentQ, part1Answers, totalPart1, isSignedIn]
  );

  const handlePart2Answer = useCallback(
    (questionId: string, value: string, type: "single" | "multi" | "range") => {
      if (type === "multi") {
        setPart2Answers((prev) => {
          const current = (prev[questionId] as string[]) || [];
          const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { ...prev, [questionId]: updated };
        });
      } else {
        setPart2Answers((prev) => ({ ...prev, [questionId]: value }));
      }
    },
    []
  );

  const advancePart2 = useCallback(() => {
    if (currentP2 + 1 < visiblePart2Questions.length) {
      setCurrentP2(currentP2 + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Part 2 complete — save everything to database and go to results
      if (compassResult) {
        track("compass_part2_completed", {
          archetype: compassResult.archetype.id,
          secondary_archetype: compassResult.secondaryArchetype?.id || null,
          questions_answered: Object.keys(part2Answers).length,
        });
        // Save to sessionStorage for the results page
        sessionStorage.setItem(
          "compass_result",
          JSON.stringify({
            archetype: compassResult.archetype.id,
            secondaryArchetype: compassResult.secondaryArchetype?.id || null,
            dimensions: compassResult.dimensions,
            philosophies: compassResult.philosophies,
            structureFlowSplit: compassResult.structureFlowSplit,
            part2Preferences: part2Answers,
          })
        );

        // Save to database — results page still works from sessionStorage if
        // this fails, but we emit compass_submit_failed so we don't lose sight
        // of persistence problems in prod.
        fetch("/api/compass/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            archetype: compassResult.archetype.id,
            secondaryArchetype: compassResult.secondaryArchetype?.id || null,
            dimensionScores: compassResult.dimensions,
            philosophyBlend: compassResult.philosophies,
            part2Preferences: part2Answers,
            quizAnswers: buildRichAnswers(part1Answers, part2Answers),
            sessionId: getCompassSessionId(),
          }),
        })
          .then((res) => {
            if (!res.ok) {
              track("compass_submit_failed", { step: "part2", status: res.status });
            }
          })
          .catch((err) => {
            track("compass_submit_failed", {
              step: "part2",
              reason: err instanceof Error ? err.message : "network_error",
            });
          });
      }
      router.push("/compass/results");
    }
  }, [currentP2, visiblePart2Questions.length, compassResult, part1Answers, part2Answers, router]);

  // ------- Render helpers -------

  const progressPercent =
    phase === "part1"
      ? ((currentQ + (selectedChoice !== null ? 1 : 0)) / totalPart1) * 50
      : phase === "compass-reveal"
        ? 50
        : phase === "part2"
          ? 50 + ((currentP2 + 1) / visiblePart2Questions.length) * 40
          : 95;

  return (
    <Shell hue="compass">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%`, backgroundColor: "#6E6E9E" }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12 min-h-screen flex flex-col justify-center">
        {/* ===== PART 1: Scenario Questions ===== */}
        {phase === "part1" && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Question {currentQ + 1} of {totalPart1}
              </p>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-primary)" }}>
                Part 1: Your Teaching Style
              </p>
            </div>

            <div
              key={PART1_QUESTIONS[currentQ].id}
              className="animate-fadeIn"
            >
              <h2 className="font-cormorant text-center mb-6" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.4, color: "var(--ink)", fontWeight: 600 }}>
                {PART1_QUESTIONS[currentQ].scenario}
              </h2>

              <div className="space-y-3">
                {PART1_QUESTIONS[currentQ].choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePart1Select(idx)}
                    disabled={animating}
                    className="w-full text-left transition-all duration-200"
                    style={
                      selectedChoice === idx
                        ? {
                            background: "#0B2E4A",
                            color: "#F9F6EF",
                            borderRadius: "12px",
                            padding: "1rem",
                            border: "none",
                            cursor: "pointer",
                          }
                        : {
                            background: "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.5)",
                            borderRadius: "12px",
                            padding: "1rem",
                            color: "#374151",
                            cursor: "pointer",
                          }
                    }
                  >
                    <span className="text-sm leading-relaxed">
                      {choice.text}
                    </span>
                    {debug && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(choice.philosophies)
                          .filter(([, v]) => (v as number) > 0)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([phil, pts]) => (
                            <span
                              key={phil}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${PHILOSOPHY_COLORS[phil as PhilosophyKey]}20`,
                                color: PHILOSOPHY_COLORS[phil as PhilosophyKey],
                              }}
                            >
                              {PHILOSOPHY_LABELS[phil as PhilosophyKey]?.split(/[\s/]/)[0]} +{pts as number}
                            </span>
                          ))}
                        {Object.entries(choice.dimensions)
                          .filter(([, v]) => (v as number) !== 0)
                          .map(([dim, v]) => {
                            const dimLabel: Record<string, string> = {
                              structure: "Structure",
                              modality: "Modality",
                              subjectApproach: "Subjects",
                              direction: "Direction",
                              social: "Social",
                            };
                            const val = v as number;
                            const pole: Record<string, [string, string]> = {
                              structure: ["Prescriptive", "Adaptive"],
                              modality: ["Hands-on", "Books"],
                              subjectApproach: ["Integrated", "Separate"],
                              direction: ["Teacher-led", "Child-led"],
                              social: ["Collaborative", "Individual"],
                            };
                            const [left, right] = pole[dim] || ["−", "+"];
                            const arrow = val < 0 ? `← ${left}` : `→ ${right}`;
                            return (
                              <span
                                key={dim}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                              >
                                {dimLabel[dim] || dim} {arrow} {Math.abs(val)}
                              </span>
                            );
                          })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {currentQ > 0 && (
              <button
                onClick={() => {
                  setCurrentQ(currentQ - 1);
                  setSelectedChoice(null);
                }}
                className="text-sm transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.45)",
                  borderRadius: "8px",
                  padding: "0.4rem 0.85rem",
                  color: "rgba(27,26,23,0.65)",
                  cursor: "pointer",
                }}
              >
                &#8592; Previous question
              </button>
            )}
          </div>
        )}

        {/* ===== COMPASS REVEAL (after Part 1) ===== */}
        {phase === "compass-reveal" && compassResult && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="flex items-end justify-center">
                <img
                  src={compassResult.archetype.resultsImagePath}
                  alt={compassResult.archetype.name}
                  className="object-contain"
                  style={{ height: "200px", width: "auto" }}
                />
                {compassResult.secondaryArchetype && (
                  <img
                    src={compassResult.secondaryArchetype.toolPath}
                    alt={compassResult.secondaryArchetype.name}
                    className="object-contain opacity-70"
                    style={{ height: "110px", width: "auto", marginLeft: "-12px" }}
                  />
                )}
              </div>
              <h2 className="font-cormorant-sc text-3xl text-gray-900">
                {compassResult.archetype.name}
              </h2>
              {compassResult.secondaryArchetype && (
                <p className="text-sm text-gray-500">
                  with {compassResult.secondaryArchetype.name} tendencies
                </p>
              )}
              <p className="text-gray-600 max-w-md mx-auto">
                {isSignedIn
                  ? compassResult.archetype.description
                  : compassResult.archetype.description.split(".")[0] + "."}
              </p>
            </div>

            {/* Dimension bars — only show when signed in */}
            {isSignedIn && (
              <div
                className="space-y-5"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <h3 className="font-semibold text-gray-900">
                  Your Five Dimensions
                </h3>
                {(Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>).map(
                  (dim) => (
                    <DimensionBar
                      key={dim}
                      label={DIMENSION_LABELS[dim].name}
                      leftLabel={DIMENSION_LABELS[dim].left}
                      rightLabel={DIMENSION_LABELS[dim].right}
                      value={compassResult.dimensions[dim]}
                      callout={
                        dim === "structure" && compassResult.structureFlowSplit.hasSplit
                          ? compassResult.structureFlowSplit.message
                          : undefined
                      }
                    />
                  )
                )}
              </div>
            )}

            {/* Philosophy pie chart — only show when signed in */}
            {isSignedIn && (
              <div
                className="space-y-4"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <h3 className="font-semibold text-gray-900">
                  Your Philosophy Blend
                </h3>
                <PhilosophyChart philosophies={compassResult.philosophies} />
                <p className="text-xs text-gray-400 text-center italic">
                  Most educators are a blend — your compass reflects your natural
                  tendencies, not a rigid category.
                </p>
              </div>
            )}

            {/* Debug panel — archetype scoring breakdown */}
            {debug && compassResult.archetypeScores && (
              <div className="bg-orange-50 border border-orange-200 rounded p-4 space-y-3">
                <h3 className="text-sm font-semibold text-orange-800">
                  Debug: Archetype Scoring
                </h3>
                <div className="space-y-1.5">
                  {compassResult.archetypeScores.map((s, idx) => {
                    const maxScore = compassResult.archetypeScores[0].score;
                    const pct = maxScore > 0 ? (s.score / maxScore) * 100 : 0;
                    const isPrimary = idx === 0;
                    const isSecondary = idx === 1;
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className={`text-xs w-28 text-right ${isPrimary ? "font-bold text-orange-900" : isSecondary ? "font-medium text-orange-700" : "text-orange-600"}`}>
                          {s.name}
                        </span>
                        <div className="flex-1 h-3 bg-orange-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPrimary ? "bg-orange-600" : isSecondary ? "bg-orange-400" : "bg-orange-200"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-orange-600 w-12 text-right font-mono">
                          {s.score.toFixed(3)}
                        </span>
                        {isPrimary && <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded">1st</span>}
                        {isSecondary && <span className="text-[10px] bg-orange-400 text-white px-1.5 py-0.5 rounded">2nd</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-orange-600 space-y-1 pt-2 border-t border-orange-200">
                  <p><strong>Result:</strong> {compassResult.archetype.name} with {compassResult.secondaryArchetype?.name || "no"} tendencies</p>
                  <p><strong>Gap:</strong> {(compassResult.archetypeScores[0].score - compassResult.archetypeScores[1].score).toFixed(3)} between 1st and 2nd</p>
                  <p><strong>Top philosophies:</strong> {Object.entries(compassResult.philosophies).sort(([,a],[,b]) => b - a).slice(0, 3).map(([k, v]) => `${PHILOSOPHY_LABELS[k as PhilosophyKey]?.split(/[\s/]/)[0]} ${v}%`).join(", ")}</p>
                </div>
              </div>
            )}

            {/* Two distinct paths off the reveal page — the old single "Continue
                to Part 2 →" forced everyone through the curricula match flow even
                if they were here for inspiration. Now: a sample-lesson option for
                browsers, and an explicit curricula-matching option for buyers. */}
            <div className="space-y-3">
              <div
                className="grid gap-2.5"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
              >
                <Link
                  href="/compass/lessons"
                  onClick={() =>
                    track("compass_reveal_lessons_clicked", {
                      archetype: compassResult?.archetype?.id ?? null,
                      secondary: compassResult?.secondaryArchetype?.id ?? null,
                    })
                  }
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    color: "var(--ink)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "12px",
                    padding: "0.95rem 1.1rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <span>View Sample Lessons &rarr;</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 400,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    See what your style looks like
                  </span>
                </Link>

                <button
                  onClick={() => {
                    track("compass_reveal_curricula_clicked", {
                      archetype: compassResult?.archetype?.id ?? null,
                      secondary: compassResult?.secondaryArchetype?.id ?? null,
                      visible_questions: visiblePart2Questions.length,
                    });
                    setPhase("part2");
                    setCurrentP2(0);
                  }}
                  style={{
                    background: "#0B2E4A",
                    color: "#F9F6EF",
                    borderRadius: "12px",
                    padding: "0.95rem 1.1rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  <span>Match Me With Curricula &rarr;</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "rgba(249,246,239,0.7)" }}>
                    {visiblePart2Questions.length} quick questions · no signup
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PART 2: Practical Preferences ===== */}
        {phase === "part2" && (
          <Part2QuestionView
            question={visiblePart2Questions[currentP2]}
            currentIndex={currentP2}
            total={visiblePart2Questions.length}
            answer={part2Answers[visiblePart2Questions[currentP2]?.id]}
            onAnswer={handlePart2Answer}
            onNext={advancePart2}
            onBack={
              currentP2 > 0
                ? () => setCurrentP2(currentP2 - 1)
                : undefined
            }
          />
        )}

        {/* teaser + email-gate phases removed — no more signup gate in the quiz */}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Shell>
  );
}

// ------- Sub-components -------

function DimensionBar({
  label,
  leftLabel,
  rightLabel,
  value,
  callout,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  callout?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{leftLabel}</span>
        <span className="font-medium text-gray-700">
          {label}
        </span>
        <span className="text-gray-500">{rightLabel}</span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow transition-all duration-700 ease-out"
          style={{ left: `calc(${value}% - 8px)`, backgroundColor: "#6E6E9E" }}
        />
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: "#6E6E9E", opacity: 0.4 }}
        />
      </div>
      {callout && (
        <p className="text-xs text-amber-600 italic mt-1">
          {callout}
        </p>
      )}
    </div>
  );
}

function PhilosophyChart({
  philosophies,
}: {
  philosophies: Record<PhilosophyKey, number>;
}) {
  const data = (Object.keys(philosophies) as PhilosophyKey[])
    .filter((key) => philosophies[key] > 0)
    .sort((a, b) => philosophies[b] - philosophies[a])
    .map((key) => ({
      name: PHILOSOPHY_LABELS[key],
      value: philosophies[key],
      color: PHILOSOPHY_COLORS[key],
    }));

  const top3 = data.slice(0, 3);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={70}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {top3.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {item.name}
            </span>
            <span className="text-sm text-gray-400">
              {item.value}%
            </span>
          </div>
        ))}
        {data.length > 3 && (
          <div className="space-y-1 pt-1 border-t border-gray-100 mt-1">
            {data.slice(3).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-500">
                  {item.name}
                </span>
                <span className="text-xs text-gray-400">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Part2QuestionView({
  question,
  currentIndex,
  total,
  answer,
  onAnswer,
  onNext,
  onBack,
}: {
  question: Part2Question;
  currentIndex: number;
  total: number;
  answer: string | string[] | undefined;
  onAnswer: (id: string, value: string, type: "single" | "multi" | "range") => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  if (!question) return null;

  const hasAnswer =
    question.type === "multi"
      ? Array.isArray(answer) && answer.length > 0
      : !!answer;

  return (
    <div className="space-y-6 animate-fadeIn" key={question.id}>
      <div className="text-center space-y-1">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Question {currentIndex + 1} of {total}
        </p>
        <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-primary)" }}>
          Part 2: Your Practical Needs
        </p>
      </div>

      <h2 className="font-cormorant text-center" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.4, color: "var(--ink)", fontWeight: 600 }}>
        {question.question}
      </h2>

      <div className="space-y-2">
        {question.choices.map((choice) => {
          const isSelected =
            question.type === "multi"
              ? Array.isArray(answer) && answer.includes(choice.value)
              : answer === choice.value;

          return (
            <button
              key={choice.value}
              onClick={() => onAnswer(question.id, choice.value, question.type)}
              className="w-full text-left transition-all duration-200"
              style={
                isSelected
                  ? {
                      background: "#0B2E4A",
                      color: "#F9F6EF",
                      borderRadius: "12px",
                      padding: "1rem",
                      border: "none",
                      cursor: "pointer",
                    }
                  : {
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      borderRadius: "12px",
                      padding: "1rem",
                      color: "#374151",
                      cursor: "pointer",
                    }
              }
            >
              <span className="text-sm">{choice.label}</span>
            </button>
          );
        })}
      </div>

      {question.type === "multi" && (
        <p className="text-xs text-center" style={{ color: "rgba(27,26,23,0.5)" }}>
          Select all that apply
        </p>
      )}

      <div className="flex justify-between items-center pt-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm transition-all duration-150"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: "8px",
              padding: "0.4rem 0.85rem",
              color: "rgba(27,26,23,0.65)",
              cursor: "pointer",
            }}
          >
            &#8592; Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          disabled={!hasAnswer}
          className="disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{
            background: "#0B2E4A",
            color: "#F9F6EF",
            borderRadius: "10px",
            padding: "0.6rem 1.4rem",
            fontSize: "0.85rem",
            border: "none",
            cursor: hasAnswer ? "pointer" : "not-allowed",
          }}
        >
          {currentIndex + 1 === total ? "See Results" : "Next"}
        </button>
      </div>
    </div>
  );
}
