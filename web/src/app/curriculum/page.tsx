"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import {
  PHILOSOPHY_LABELS,
  PHILOSOPHY_COLORS,
  PhilosophyKey,
} from "@/lib/compass/scoring";
import { ARCHETYPES } from "@/lib/compass/archetypes";

interface MatchResult {
  curriculum: {
    id: string;
    name: string;
    publisher: string;
    description: string;
    subjects: string[];
    gradeRange: string;
    prepLevel: string;
    religiousType: string;
    faithDepth: string;
    priceRange: string;
    qualityScore: number;
    affiliateUrl: string | null;
    notes: string | null;
  };
  totalScore: number;
  philosophyFitScore: number;
  fitLabel: "strong" | "good" | "partial";
  matchReason: string;
}

interface MatchOutput {
  bySubject: Record<string, MatchResult[]>;
  warnings: Array<{ type: string; message: string }>;
  fallbackBanner?: string;
}

const SUBJECT_OPTIONS = [
  { value: "literacy", label: "Literacy / Language Arts" },
  { value: "math", label: "Math" },
  { value: "science", label: "Science" },
  { value: "social_studies", label: "Social Studies" },
];

const SUBJECT_LABELS: Record<string, string> = Object.fromEntries(
  SUBJECT_OPTIONS.map((s) => [s.value, s.label]),
);

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

const BUDGET_OPTIONS = [
  { value: "not-a-factor", label: "Not a factor" },
  { value: "under-50", label: "Under $50" },
  { value: "50-150", label: "$50-150" },
  { value: "150-300", label: "$150-300" },
  { value: "over-300", label: "Over $300" },
];

const ALL_GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const LEARNING_NEEDS_OPTIONS = [
  { value: "dyslexia", label: "Dyslexia" },
  { value: "adhd", label: "ADHD" },
  { value: "gifted", label: "Gifted" },
];

const FIT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strong: { bg: "bg-green-50", text: "text-green-700", label: "Strong Match" },
  good: { bg: "bg-blue-50", text: "text-blue-700", label: "Good Match" },
  partial: { bg: "bg-amber-50", text: "text-amber-700", label: "Close Fit" },
};

const PREP_STYLES: Record<string, { color: string }> = {
  "open-and-go": { color: "#059669" },
  light: { color: "#2563eb" },
  moderate: { color: "#d97706" },
  heavy: { color: "#dc2626" },
};

function formatSubjectList(subjects: string[]): string {
  const labels = subjects.map((s) => SUBJECT_LABELS[s] ?? s);
  if (labels.length <= 2) return labels.join(" & ");
  return labels.slice(0, -1).join(", ") + " & " + labels[labels.length - 1];
}

function extractPrefs(raw: Record<string, unknown>) {
  const p2 = (raw.part2Preferences ?? {}) as Record<string, string | string[]>;
  return {
    subjects: (p2.p2_subjects as string[]) ?? ["literacy", "math"],
    prepLevel: (p2.p2_prep_time as string) ?? "light",
    religious: (p2.p2_religious as string) ?? "no-preference",
    screen: (p2.p2_screen_time as string) ?? "minimal",
    budget: (p2.p2_budget as string) ?? "not-a-factor",
    grades: (p2.p2_grades as string[]) ?? ["K", "1", "2", "3"],
    setting: (p2.p2_setting as string) ?? "home",
    learningNeeds: ((p2.p2_learning_needs as string[]) ?? []).filter((n) => n !== "none"),
  };
}

// frost card style helper
const frost = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
};

export default function CurriculumPage() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "var(--hue-results)" }} />}>
      <CurriculumPageInner />
    </Suspense>
  );
}

function CurriculumPageInner() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");

  const sessionResult = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("compass_result");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  }, []);

  const [dbResult, setDbResult] = useState<Record<string, unknown> | null>(null);
  const [loadingDb, setLoadingDb] = useState(!sessionResult);

  useEffect(() => {
    if (sessionResult) { setLoadingDb(false); return; }
    if (resultId) {
      fetch(`/api/compass/results/${resultId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setDbResult(d); })
        .catch(() => {})
        .finally(() => setLoadingDb(false));
      return;
    }
    fetch("/api/user/archetype")
      .then((r) => (r.ok ? r.json() : null))
      .then((userArch) => {
        if (!userArch?.resultId) { setLoadingDb(false); return; }
        return fetch(`/api/compass/results/${userArch.resultId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d) setDbResult(d); });
      })
      .catch(() => {})
      .finally(() => setLoadingDb(false));
  }, [resultId, sessionResult]);

  // --- Filter state (initialized once data loads) ---
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(["literacy", "math"]);
  const [prepLevel, setPrepLevel] = useState("light");
  const [religious, setReligious] = useState("no-preference");
  const [screen, setScreen] = useState("minimal");
  const [budget, setBudget] = useState("not-a-factor");
  const [grades, setGrades] = useState<string[]>(["K", "1", "2", "3"]);
  const [learningNeeds, setLearningNeeds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [matchOutput, setMatchOutput] = useState<MatchOutput | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const rawData = loadingDb ? null : (sessionResult || dbResult);
  const data = rawData
    ? {
        ...rawData,
        philosophies: (rawData as Record<string, unknown>).philosophies || (rawData as Record<string, unknown>).philosophyBlend,
      }
    : null;

  const philosophies = (data?.philosophies ?? {}) as Record<PhilosophyKey, number>;

  const archetype = data
    ? ARCHETYPES.find((a) => a.id === (data as Record<string, unknown>).archetype) || null
    : null;

  // Initialize filters from saved Part 2 preferences
  useEffect(() => {
    if (!data || filtersInitialized) return;
    const prefs = extractPrefs(data as Record<string, unknown>);
    setSubjects(prefs.subjects);
    setPrepLevel(prefs.prepLevel);
    setReligious(prefs.religious);
    setScreen(prefs.screen);
    setBudget(prefs.budget);
    setGrades(prefs.grades);
    setLearningNeeds(prefs.learningNeeds);
    setFiltersInitialized(true);
  }, [data, filtersInitialized]);

  const runMatch = useCallback(async () => {
    if (!data) return;
    setMatchLoading(true);
    setActiveSubject(null);
    try {
      const normalizedPhilosophies: Record<string, number> = {};
      for (const [key, value] of Object.entries(philosophies)) {
        normalizedPhilosophies[key] = (value as number) / 100;
      }
      const res = await fetch("/api/compass/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          philosophyBlend: normalizedPhilosophies,
          part2Preferences: {
            subjects,
            prepLevel,
            religiousPreference: religious,
            screenTime: screen,
            budget,
            grades,
            learningNeeds: learningNeeds.length > 0 ? learningNeeds : undefined,
            setting: "home",
          },
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setMatchOutput(await res.json());
    } catch (e) {
      console.error("Match error:", e);
    } finally {
      setMatchLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, subjects, prepLevel, religious, screen, budget, grades, learningNeeds]);

  // Auto-run on first load once filters are initialized
  useEffect(() => {
    if (filtersInitialized) runMatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersInitialized]);

  // No quiz data
  if (!loadingDb && !data) {
    return (
      <Shell hue="results">
        <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
          <h1 className="font-cormorant-sc text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            Curriculum Browser
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto", lineHeight: 1.7 }}>
            To see personalized curriculum recommendations, take the Compass Quiz first. It only takes about 5 minutes.
          </p>
          <Link
            href="/compass/quiz"
            className="inline-block text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: "var(--night)", color: "var(--parchment)", borderRadius: "10px", padding: "0.7rem 1.6rem" }}
          >
            Take the Compass Quiz &rarr;
          </Link>
        </div>
      </Shell>
    );
  }

  const resultSubjects = matchOutput ? Object.keys(matchOutput.bySubject) : [];
  const visibleSubjects = activeSubject ? [activeSubject] : resultSubjects;

  const topPhilosophies = (Object.keys(philosophies) as PhilosophyKey[])
    .filter((key) => philosophies[key] > 0)
    .sort((a, b) => philosophies[b] - philosophies[a])
    .slice(0, 4);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <Shell hue="results">
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="font-cormorant-sc text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            Curriculum Browser
          </h1>
          <Link href="/compass/results" className="text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
            &larr; Back to results
          </Link>
        </div>

        {/* Philosophy context */}
        {archetype && (
          <div className="rounded-xl p-4" style={frost}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Showing recommendations for your{" "}
              <span className="font-medium" style={{ color: archetype.color }}>{archetype.name}</span>{" "}
              philosophy blend:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topPhilosophies.map((key) => (
                <span
                  key={key}
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: `${PHILOSOPHY_COLORS[key]}15`,
                    color: PHILOSOPHY_COLORS[key],
                    border: `1px solid ${PHILOSOPHY_COLORS[key]}30`,
                  }}
                >
                  {PHILOSOPHY_LABELS[key]} {philosophies[key]}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters panel */}
        <div className="rounded-xl" style={frost}>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between p-4"
            style={{ color: "var(--ink)" }}
          >
            <span className="text-sm font-medium">
              Filters
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} &middot; Grades {grades.join(", ")} &middot; {PREP_OPTIONS.find((o) => o.value === prepLevel)?.label}
              </span>
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {filtersOpen ? "Hide" : "Show"}
            </span>
          </button>

          {filtersOpen && (
            <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Subjects */}
              <div className="pt-3">
                <label className="text-xs font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSubjects(toggleArray(subjects, s.value))}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={
                        subjects.includes(s.value)
                          ? { background: "var(--night)", color: "var(--parchment)" }
                          : { background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grades */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Grades</label>
                <div className="flex flex-wrap gap-1">
                  {ALL_GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrades(toggleArray(grades, g))}
                      className="text-xs w-8 h-7 rounded font-medium transition-colors"
                      style={
                        grades.includes(g)
                          ? { background: "var(--night)", color: "var(--parchment)" }
                          : { background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)" }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdowns row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FilterSelect label="Prep time" value={prepLevel} onChange={setPrepLevel} options={PREP_OPTIONS} />
                <FilterSelect label="Religious" value={religious} onChange={setReligious} options={RELIGIOUS_OPTIONS} />
                <FilterSelect label="Screen time" value={screen} onChange={setScreen} options={SCREEN_OPTIONS} />
                <FilterSelect label="Budget" value={budget} onChange={setBudget} options={BUDGET_OPTIONS} />
              </div>

              {/* Learning needs */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Learning needs</label>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_NEEDS_OPTIONS.map((n) => (
                    <button
                      key={n.value}
                      onClick={() => setLearningNeeds(toggleArray(learningNeeds, n.value))}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={
                        learningNeeds.includes(n.value)
                          ? { background: "var(--night)", color: "var(--parchment)" }
                          : { background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }
                      }
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={runMatch}
                disabled={matchLoading || subjects.length === 0}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--night)", color: "var(--parchment)" }}
              >
                {matchLoading ? "Matching..." : "Update Results"}
              </button>
            </div>
          )}
        </div>

        {/* Subject tabs */}
        {resultSubjects.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubject(null)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={
                activeSubject === null
                  ? { background: "var(--night)", color: "var(--parchment)" }
                  : { background: "rgba(255,255,255,0.6)", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }
              }
            >
              All Subjects
            </button>
            {resultSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={
                  activeSubject === subject
                    ? { background: "var(--night)", color: "var(--parchment)" }
                    : { background: "rgba(255,255,255,0.6)", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }
                }
              >
                {SUBJECT_LABELS[subject] || subject}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {matchLoading && (
          <div className="rounded-xl p-8 text-center" style={frost}>
            <div
              className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mb-2"
              style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Finding your best curriculum matches...
            </p>
          </div>
        )}

        {/* Warnings */}
        {matchOutput?.warnings && matchOutput.warnings.length > 0 && (
          <div className="space-y-3">
            {matchOutput.warnings.map((w, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(24px)",
                  borderRadius: "12px",
                  borderTop: "3px solid #D97706",
                  border: "1px solid rgba(217,119,6,0.15)",
                  padding: "1rem 1.25rem",
                  fontSize: "0.85rem",
                  color: "var(--ink)",
                }}
              >
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Curriculum cards by subject */}
        {matchOutput &&
          visibleSubjects.map((subject) => {
            const results = matchOutput.bySubject[subject];
            if (!results) return null;
            return (
              <div key={subject} className="space-y-3">
                <h3 className="font-cormorant-sc font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {SUBJECT_LABELS[subject] || subject}
                </h3>
                <div className="space-y-2">
                  {results.map((match, idx) => (
                    <CurriculumCard key={match.curriculum.id} match={match} rank={idx + 1} />
                  ))}
                </div>
              </div>
            );
          })}

        {matchOutput && Object.keys(matchOutput.bySubject).length === 0 && !matchLoading && (
          <div className="rounded-xl p-6 text-center" style={frost}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No curriculum matches found for your filters. Try adjusting your preferences above.
            </p>
          </div>
        )}

        {/* Suggest a curriculum */}
        <p className="text-center">
          <Link
            href="/contact?subject=curriculum-suggestion"
            className="hover:underline"
            style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", textDecoration: "none" }}
          >
            Missing your favorite curriculum? Let us know &rarr;
          </Link>
        </p>

        {/* Bottom CTA */}
        <div className="rounded-xl p-4 text-center space-y-2" style={frost}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Ready to start building lessons?
          </p>
          <Link
            href="/create"
            className="inline-block text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: "var(--night)", color: "var(--parchment)", borderRadius: "10px", padding: "0.6rem 1.4rem" }}
          >
            Create Adaptive Lessons &rarr;
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-lg px-2.5 py-2 appearance-none"
        style={{
          background: "rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.08)",
          color: "var(--ink)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function CurriculumCard({ match, rank }: { match: MatchResult; rank: number }) {
  const c = match.curriculum;
  const fit = FIT_STYLES[match.fitLabel] || FIT_STYLES.partial;
  const prepStyle = PREP_STYLES[c.prepLevel] || { color: "#6b7280" };

  return (
    <div
      className="p-4"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.5)",
        borderRadius: "12px",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              {rank}. {c.name}
            </h5>
            {rank === 1 && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                Best Fit
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded ${fit.bg} ${fit.text}`}>
              {fit.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {c.publisher}
          </p>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {c.description}
          </p>
          <p className="text-xs mt-1 italic" style={{ color: "var(--text-tertiary)" }}>
            {match.matchReason}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {c.subjects.length > 1 && (
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium">
            All-in-One Bundle
          </span>
        )}
        <span
          className="text-xs px-2 py-0.5 rounded cursor-help"
          style={{
            backgroundColor: `${prepStyle.color}15`,
            color: prepStyle.color,
            border: `1px solid ${prepStyle.color}30`,
          }}
          title="Prep level is based on community reviews and publisher descriptions."
        >
          {c.prepLevel}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}
        >
          {c.religiousType === "christian"
            ? `Christian (${c.faithDepth})`
            : c.religiousType.charAt(0).toUpperCase() + c.religiousType.slice(1)}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}
        >
          {c.gradeRange}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}
        >
          {c.priceRange}
        </span>
      </div>

      {c.subjects.length > 1 && (
        <p className="text-xs text-indigo-600 mt-1.5">
          Covers {formatSubjectList(c.subjects)} — may need to be purchased as a complete package.
        </p>
      )}

      {c.notes && (
        <details className="mt-2">
          <summary className="text-xs cursor-pointer" style={{ color: "var(--text-tertiary)" }}>
            Details
          </summary>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {c.notes}
          </p>
        </details>
      )}

      {c.affiliateUrl && (
        <a
          href={c.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-medium hover:opacity-90 transition-opacity"
          style={{
            background: "var(--night)",
            color: "var(--parchment)",
            borderRadius: "10px",
            padding: "0.6rem 1.4rem",
          }}
        >
          Learn More &rarr;
        </a>
      )}
    </div>
  );
}
