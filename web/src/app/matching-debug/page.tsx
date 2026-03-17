"use client";

import { useState, useCallback } from "react";
import { Shell } from "@/components/shell";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { PHILOSOPHY_LABELS, PHILOSOPHY_COLORS, PhilosophyKey } from "@/lib/compass/scoring";
import type { ScoreBreakdown } from "@/lib/compass/matching";

const SUBJECT_LABELS: Record<string, string> = {
  literacy: "Literacy / Language Arts",
  math: "Math",
  science: "Science",
  social_studies: "Social Studies",
};

const PREP_OPTIONS = [
  { value: "none", label: "Open and go" },
  { value: "light", label: "15-30 min/week" },
  { value: "moderate", label: "1-2 hours/week" },
  { value: "heavy", label: "3+ hours" },
];

const RELIGIOUS_OPTIONS = [
  { value: "secular", label: "Secular only" },
  { value: "christian", label: "Christian" },
  { value: "no-preference", label: "No preference" },
];

const SCREEN_OPTIONS = [
  { value: "avoid", label: "Avoid screens" },
  { value: "minimal", label: "Minimal" },
  { value: "some", label: "Some OK" },
  { value: "welcome", label: "Welcome" },
];

interface MatchResultDebug {
  curriculum: {
    id: string;
    name: string;
    publisher: string;
    subjects: string[];
    gradeRange: string;
    prepLevel: string;
    religiousType: string;
    priceRange: string;
    qualityScore: number;
    philosophyScores: Record<string, number>;
  };
  totalScore: number;
  philosophyFitScore: number;
  fitLabel: string;
  breakdown?: ScoreBreakdown;
  excludedReason?: string;
}

interface MatchOutputDebug {
  bySubject: Record<string, MatchResultDebug[]>;
  warnings: Array<{ type: string; message: string }>;
  allScored?: MatchResultDebug[];
}

export default function MatchingDebugPage() {
  const [primaryId, setPrimaryId] = useState("the-explorer");
  const [secondaryId, setSecondaryId] = useState("the-naturalist");
  const [subjects, setSubjects] = useState<string[]>(["literacy", "math"]);
  const [prepLevel, setPrepLevel] = useState("light");
  const [religious, setReligious] = useState("no-preference");
  const [screen, setScreen] = useState("minimal");
  const [grades, setGrades] = useState<string[]>(["2", "4"]);
  const [learningNeeds, setLearningNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState("not-a-factor");

  const [results, setResults] = useState<MatchOutputDebug | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);

  // Build philosophy blend from archetype profiles
  const primary = ARCHETYPES.find((a) => a.id === primaryId)!;
  const secondary = ARCHETYPES.find((a) => a.id === secondaryId);

  const getBlend = useCallback(() => {
    const blend: Record<string, number> = {};
    // 70% primary, 30% secondary (simulating a real quiz result)
    for (const [k, v] of Object.entries(primary.philosophyProfile)) {
      blend[k] = (v as number) * 0.7;
    }
    if (secondary) {
      for (const [k, v] of Object.entries(secondary.philosophyProfile)) {
        blend[k] = (blend[k] || 0) + (v as number) * 0.3;
      }
    }
    return blend;
  }, [primary, secondary]);

  const runMatch = useCallback(async () => {
    setLoading(true);
    try {
      const blend = getBlend();
      const res = await fetch("/api/compass/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          philosophyBlend: blend,
          part2Preferences: {
            subjects,
            prepLevel,
            religiousPreference: religious,
            screenTime: screen,
            grades,
            learningNeeds: learningNeeds.length > 0 ? learningNeeds : undefined,
            budget,
            setting: "home",
          },
          debug: true,
        }),
      });
      const data: MatchOutputDebug = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getBlend, subjects, prepLevel, religious, screen, grades, learningNeeds, budget]);

  const blend = getBlend();
  const sortedBlend = Object.entries(blend)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0.01);

  const included = results?.allScored?.filter((r) => !r.excludedReason) || [];
  const excluded = results?.allScored?.filter((r) => r.excludedReason) || [];

  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Curriculum Matching Debug</h1>

        {/* Archetype selector */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Step 1: Select Archetype</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Primary Archetype</label>
              <select value={primaryId} onChange={(e) => setPrimaryId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100">
                {ARCHETYPES.map((a) => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Secondary Archetype</label>
              <select value={secondaryId} onChange={(e) => setSecondaryId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100">
                {ARCHETYPES.filter((a) => a.id !== primaryId).map((a) => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Show computed blend */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Computed Philosophy Blend (70% primary / 30% secondary)</p>
            <div className="flex flex-wrap gap-1">
              {sortedBlend.map(([k, v]) => (
                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${PHILOSOPHY_COLORS[k as PhilosophyKey]}20`, color: PHILOSOPHY_COLORS[k as PhilosophyKey] }}>
                  {PHILOSOPHY_LABELS[k as PhilosophyKey]?.split(/[\s/]/)[0]} {(v * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Part 2 preferences */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Step 2: Set Preferences</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Subjects</label>
              <div className="space-y-1">
                {["literacy", "math", "science", "social_studies"].map((s) => (
                  <label key={s} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={subjects.includes(s)}
                      onChange={() => setSubjects(subjects.includes(s) ? subjects.filter((x) => x !== s) : [...subjects, s])} />
                    {SUBJECT_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Prep Level</label>
              <select value={prepLevel} onChange={(e) => setPrepLevel(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs">
                {PREP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="text-xs font-medium text-gray-500 block mb-1 mt-2">Religious</label>
              <select value={religious} onChange={(e) => setReligious(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs">
                {RELIGIOUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Screen Time</label>
              <select value={screen} onChange={(e) => setScreen(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs">
                {SCREEN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="text-xs font-medium text-gray-500 block mb-1 mt-2">Budget</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs">
                <option value="not-a-factor">Not a factor</option>
                <option value="under-50">Under $50</option>
                <option value="50-150">$50-150</option>
                <option value="150-300">$150-300</option>
                <option value="over-300">Over $300</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Grades</label>
              <div className="flex flex-wrap gap-1">
                {["K","1","2","3","4","5","6","7","8","9","10","11","12"].map((g) => (
                  <button key={g} onClick={() => setGrades(grades.includes(g) ? grades.filter((x) => x !== g) : [...grades, g])}
                    className={`text-[10px] w-6 h-5 rounded ${grades.includes(g) ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                    {g}
                  </button>
                ))}
              </div>
              <label className="text-xs font-medium text-gray-500 block mb-1 mt-2">Learning Needs</label>
              <div className="space-y-1">
                {["dyslexia", "adhd", "gifted"].map((n) => (
                  <label key={n} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={learningNeeds.includes(n)}
                      onChange={() => setLearningNeeds(learningNeeds.includes(n) ? learningNeeds.filter((x) => x !== n) : [...learningNeeds, n])} />
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button onClick={runMatch} disabled={loading}
            className="w-full py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50">
            {loading ? "Matching..." : "Run Curriculum Match"}
          </button>
        </div>

        {/* Warnings */}
        {results?.warnings && results.warnings.length > 0 && (
          <div className="space-y-2">
            {results.warnings.map((w, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-medium">[{w.type}]</span> {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Results by subject */}
        {results && Object.entries(results.bySubject).map(([subject, matches]) => (
          <div key={subject} className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {SUBJECT_LABELS[subject] || subject} — Top {matches.length}
            </h3>
            {matches.map((m, idx) => (
              <CurriculumDebugCard key={m.curriculum.id + subject} match={m} rank={idx + 1} />
            ))}
          </div>
        ))}

        {/* All scored (debug) */}
        {results?.allScored && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                All {included.length} Scored + {excluded.length} Excluded
              </h3>
              <button onClick={() => setShowExcluded(!showExcluded)}
                className="text-xs text-blue-600 hover:underline">
                {showExcluded ? "Hide excluded" : "Show excluded"}
              </button>
            </div>

            {included.map((m, idx) => (
              <CurriculumDebugCard key={m.curriculum.id + "all"} match={m} rank={idx + 1} compact />
            ))}

            {showExcluded && excluded.map((m) => (
              <div key={m.curriculum.id + "excl"} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">{m.curriculum.name}</span>
                  <span className="text-xs text-red-600 dark:text-red-400">EXCLUDED</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{m.excludedReason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function CurriculumDebugCard({ match: m, rank, compact }: { match: MatchResultDebug; rank: number; compact?: boolean }) {
  const b = m.breakdown;
  const maxScore = m.totalScore;

  return (
    <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            #{rank} {m.curriculum.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
              m.fitLabel === "strong" ? "bg-green-50 text-green-700" :
              m.fitLabel === "good" ? "bg-blue-50 text-blue-700" :
              "bg-gray-100 text-gray-600"
            }`}>{m.fitLabel}</span>
          </h4>
          {!compact && (
            <p className="text-xs text-gray-500">{m.curriculum.publisher} · {m.curriculum.gradeRange} · {m.curriculum.prepLevel} · {m.curriculum.religiousType} · {m.curriculum.priceRange}</p>
          )}
        </div>
        <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{m.totalScore.toFixed(3)}</span>
      </div>

      {b && (
        <div className="space-y-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
            <ScoreRow label="Philosophy fit" value={b.philosophyFit} maxVal={maxScore} />
            <ScoreRow label="Prep bonus" value={b.prepBonus} maxVal={maxScore} />
            <ScoreRow label="Setting bonus" value={b.settingBonus} maxVal={maxScore} />
            <ScoreRow label="Quality bonus" value={b.qualityBonus} maxVal={maxScore} />
            <ScoreRow label="Integrated bonus" value={b.integratedBonus} maxVal={maxScore} />
            <ScoreRow label="Screen adjust" value={b.screenAdjust} maxVal={maxScore} />
            {b.dyslexiaBonus !== 0 && <ScoreRow label="Dyslexia bonus" value={b.dyslexiaBonus} maxVal={maxScore} />}
            {b.adhdAdjust !== 0 && <ScoreRow label="ADHD adjust" value={b.adhdAdjust} maxVal={maxScore} />}
            {b.giftedBonus !== 0 && <ScoreRow label="Gifted bonus" value={b.giftedBonus} maxVal={maxScore} />}
          </div>

          {/* Philosophy scores comparison */}
          {!compact && (
            <details className="mt-1">
              <summary className="text-[10px] text-gray-400 cursor-pointer">Curriculum philosophy scores</summary>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(m.curriculum.philosophyScores)
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([k, v]) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${PHILOSOPHY_COLORS[k as PhilosophyKey]}20`, color: PHILOSOPHY_COLORS[k as PhilosophyKey] }}>
                      {PHILOSOPHY_LABELS[k as PhilosophyKey]?.split(/[\s/]/)[0]} {(v * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, value, maxVal }: { label: string; value: number; maxVal: number }) {
  if (value === 0) return (
    <div className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
      <span className="w-24">{label}</span>
      <span className="font-mono">0</span>
    </div>
  );
  const pct = maxVal > 0 ? Math.abs(value) / maxVal * 100 : 0;
  const isNeg = value < 0;
  return (
    <div className="flex items-center gap-1">
      <span className="w-24 text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[60px]">
        <div className={`h-full rounded-full ${isNeg ? "bg-red-400" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`font-mono text-[10px] ${isNeg ? "text-red-500" : "text-green-600"}`}>
        {isNeg ? "" : "+"}{value.toFixed(3)}
      </span>
    </div>
  );
}
