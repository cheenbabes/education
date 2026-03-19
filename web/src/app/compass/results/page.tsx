"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import {
  DIMENSION_LABELS,
  PHILOSOPHY_LABELS,
  PHILOSOPHY_COLORS,
  PhilosophyKey,
  DimensionScores,
} from "@/lib/compass/scoring";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { getComboText } from "@/lib/compass/combo-text";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

interface MatchWarning {
  type: string;
  message: string;
}

interface MatchOutput {
  bySubject: Record<string, MatchResult[]>;
  warnings: MatchWarning[];
}

const SUBJECT_LABELS: Record<string, string> = {
  literacy: "Literacy / Language Arts",
  math: "Math",
  science: "Science",
  social_studies: "Social Studies",
};

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

function mapPart2Preferences(raw: Record<string, string | string[]>) {
  return {
    subjects: raw.p2_subjects as string[] | undefined,
    integrated: raw.p2_organization as string | undefined,
    prepLevel: raw.p2_prep_time as string | undefined,
    religiousPreference: raw.p2_religious as string | undefined,
    faithDepth: raw.p2_faith_depth as string | undefined,
    budget: raw.p2_budget as string | undefined,
    grades: raw.p2_grades as string[] | undefined,
    setting: raw.p2_setting as string | undefined,
    screenTime: raw.p2_screen_time as string | undefined,
    learningNeeds: raw.p2_learning_needs as string[] | undefined,
  };
}

export default function ResultsPage() {
  const result = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("compass_result");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const data = result || DEMO_RESULT;

  const archetype =
    ARCHETYPES.find((a) => a.id === data.archetype) || ARCHETYPES[0];
  const secondaryArchetype = data.secondaryArchetype
    ? ARCHETYPES.find((a) => a.id === data.secondaryArchetype) || null
    : null;
  const dimensions: DimensionScores = data.dimensions || data.dimensionScores;
  const philosophies: Record<PhilosophyKey, number> =
    data.philosophies || data.philosophyBlend;
  const structureSplit = data.structureFlowSplit;

  // Curriculum matching state
  const [matchOutput, setMatchOutput] = useState<MatchOutput | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setMatchLoading(true);
    setMatchError(null);
    try {
      // Convert philosophy percentages (0-100) to weights (0-1) for the matching API
      const normalizedPhilosophies: Record<string, number> = {};
      for (const [key, value] of Object.entries(philosophies)) {
        normalizedPhilosophies[key] = (value as number) / 100;
      }

      const prefs = data.part2Preferences
        ? mapPart2Preferences(data.part2Preferences)
        : {};

      const res = await fetch("/api/compass/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          philosophyBlend: normalizedPhilosophies,
          part2Preferences: prefs,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const output: MatchOutput = await res.json();
      setMatchOutput(output);
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "Failed to load recommendations");
    } finally {
      setMatchLoading(false);
    }
  }, [philosophies, data.part2Preferences]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const philosophyData = (Object.keys(philosophies) as PhilosophyKey[])
    .filter((key) => philosophies[key] > 0)
    .sort((a, b) => philosophies[b] - philosophies[a])
    .map((key) => ({
      name: PHILOSOPHY_LABELS[key],
      value: philosophies[key],
      color: PHILOSOPHY_COLORS[key],
    }));

  const top3 = philosophyData.slice(0, 3);

  return (
    <Shell>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Your Education Compass
          </h1>
          <Link
            href="/compass/quiz"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Retake quiz
          </Link>
        </div>

        {/* Archetype */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-4xl">{archetype.icon}</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              You&apos;re {archetype.name}
            </h2>
            {secondaryArchetype && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                with {secondaryArchetype.name} tendencies
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {archetype.description}
          </p>
          {secondaryArchetype && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  With {secondaryArchetype.name} tendencies,
                </span>{" "}
                {getComboText(archetype.id, secondaryArchetype.id).shareText.charAt(0).toLowerCase() + getComboText(archetype.id, secondaryArchetype.id).shareText.slice(1)}
              </p>
            </div>
          )}
        </div>

        {/* Dimension bars */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-5">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Your Five Dimensions
          </h3>
          {(
            Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>
          ).map((dim) => (
            <div key={dim} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {DIMENSION_LABELS[dim].left}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {DIMENSION_LABELS[dim].name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {DIMENSION_LABELS[dim].right}
                </span>
              </div>
              <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 dark:bg-gray-100 rounded-full border-2 border-white dark:border-gray-900 shadow transition-all duration-700 ease-out"
                  style={{ left: `calc(${dimensions[dim]}% - 8px)` }}
                />
                <div
                  className="h-full bg-gray-300 dark:bg-gray-700 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${dimensions[dim]}%` }}
                />
              </div>
              {dim === "structure" && structureSplit?.hasSplit && structureSplit.message && (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  {structureSplit.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Philosophy blend */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Your Philosophy Blend
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={philosophyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {philosophyData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {top3.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{item.value}%</span>
                </div>
              ))}
              {philosophyData.length > 3 && (
                <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                  {philosophyData.slice(3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.value}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">
            Most educators are a blend — your compass reflects your natural tendencies, not a rigid category.
          </p>
        </div>

        {/* Archetype-specific app pitch — elevated above curriculum */}
        <div className="bg-gray-900 dark:bg-gray-100 rounded p-6 space-y-3">
          <h3 className="text-lg font-bold text-white dark:text-gray-900">
            {archetype.appPitch.headline}
          </h3>
          <p className="text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
            {archetype.appPitch.body}
          </p>
          <Link
            href="/generate"
            className="inline-block px-5 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {archetype.appPitch.cta} &rarr;
          </Link>
        </div>

        {/* Curriculum note */}
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Below are curriculum recommendations for your foundational subjects. Many published curricula lean toward classical structure — we&apos;ve found the best matches for your philosophy.
        </p>

        {/* Warnings */}
        {matchOutput?.warnings && matchOutput.warnings.length > 0 && (
          <div className="space-y-3">
            {matchOutput.warnings.map((w, idx) => (
              <div
                key={idx}
                className={`rounded p-4 text-sm ${
                  w.type === "dyslexia-recommendation"
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                    : w.type === "adhd-recommendation"
                      ? "bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200"
                      : "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                }`}
              >
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Curriculum Recommendations */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-lg">
            Curriculum Recommendations
          </h3>

          {matchLoading && (
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Finding your best curriculum matches...</p>
            </div>
          )}

          {matchError && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
              {matchError}
            </div>
          )}

          {matchOutput && Object.keys(matchOutput.bySubject).length === 0 && !matchLoading && (
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No curriculum matches found for your filters. Try adjusting your preferences or{" "}
                <Link href="/compass/quiz" className="text-blue-600 hover:underline">retaking the quiz</Link>.
              </p>
            </div>
          )}

          {matchOutput &&
            Object.entries(matchOutput.bySubject).map(([subject, results]) => (
              <div key={subject} className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  {SUBJECT_LABELS[subject] || subject}
                </h4>

                {/* Comparison table */}
                <div className="space-y-2">
                  {results.map((match, idx) => {
                    const c = match.curriculum;
                    const fit = FIT_STYLES[match.fitLabel] || FIT_STYLES.partial;
                    const prepStyle = PREP_STYLES[c.prepLevel] || { color: "#6b7280" };

                    return (
                      <div
                        key={c.id}
                        className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {idx + 1}. {c.name}
                              </h5>
                              {idx === 0 && (
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                                  Best Fit
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${fit.bg} ${fit.text}`}>
                                {fit.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {c.publisher}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {c.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {match.matchReason}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${prepStyle.color}15`,
                              color: prepStyle.color,
                              border: `1px solid ${prepStyle.color}30`,
                            }}
                          >
                            {c.prepLevel}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {c.religiousType === "christian"
                              ? `Christian (${c.faithDepth})`
                              : c.religiousType.charAt(0).toUpperCase() + c.religiousType.slice(1)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {c.gradeRange}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {c.priceRange}
                          </span>
                        </div>

                        {c.notes && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                              Details
                            </summary>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {c.notes}
                            </p>
                          </details>
                        )}

                        {c.affiliateUrl && (
                          <a
                            href={c.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-xs px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-200"
                          >
                            Learn More &rarr;
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Bottom CTA — reinforces the archetype pitch */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ready to start building lessons that match your {archetype.name} style?
          </p>
          <Link
            href="/generate"
            className="inline-block px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {archetype.appPitch.cta} &rarr;
          </Link>
        </div>
      </div>
    </Shell>
  );
}

const DEMO_RESULT = {
  archetype: "the-explorer",
  secondaryArchetype: "the-naturalist",
  dimensions: {
    structure: 65,
    modality: 35,
    subjectApproach: 40,
    direction: 72,
    social: 48,
  },
  philosophies: {
    montessori: 25,
    waldorf: 8,
    project_based: 22,
    place_nature: 15,
    classical: 5,
    charlotte_mason: 8,
    unschooling: 12,
    eclectic_flexible: 5,
  },
  structureFlowSplit: {
    hasSplit: false,
    foundationalScore: 50,
    exploratoryScore: 50,
    message: "",
  },
  part2Preferences: {
    p2_subjects: ["literacy", "math"],
    p2_organization: "separate",
    p2_prep_time: "light",
    p2_religious: "secular",
    p2_budget: "not_a_factor",
    p2_grades: ["2", "4"],
    p2_setting: "home",
    p2_screen_time: "minimal",
    p2_learning_needs: ["none"],
  },
};
