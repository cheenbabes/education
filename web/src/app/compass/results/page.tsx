"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  fallbackBanner?: string;
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

type LiteracyComponent = "reading" | "writing" | "spelling" | "grammar" | "complete";

const LITERACY_COMPONENTS: Record<string, LiteracyComponent[]> = {
  "All About Reading": ["reading"],
  "Logic of English Foundations": ["reading", "spelling", "grammar"],
  "The Good and the Beautiful Language Arts": ["complete"],
  "The Good and the Beautiful": ["complete"],
  "Sonlight Language Arts": ["writing", "grammar"],
  "Sonlight": ["complete"],
  "IEW Structure and Style": ["writing"],
  "All About Spelling": ["spelling"],
  "Spelling Power": ["spelling"],
  "Explode the Code": ["reading", "spelling"],
  "Brave Writer": ["writing"],
  "Memoria Press Language Arts": ["grammar"],
  "Learning Language Arts Through Literature": ["complete"],
  "BookShark Language Arts": ["complete"],
  "BookShark": ["complete"],
};

const LITERACY_COMPONENT_LABELS: Record<LiteracyComponent, string> = {
  reading: "R",
  writing: "W",
  spelling: "S",
  grammar: "G",
  complete: "Complete LA",
};

const LITERACY_COMPONENT_COLORS: Record<LiteracyComponent, string> = {
  reading: "bg-sky-100 text-sky-700",
  writing: "bg-violet-100 text-violet-700",
  spelling: "bg-rose-100 text-rose-700",
  grammar: "bg-orange-100 text-orange-700",
  complete: "bg-teal-100 text-teal-700",
};

function formatSubjectList(subjects: string[]): string {
  const labels = subjects.map((s) => SUBJECT_LABELS[s] ?? s);
  if (labels.length <= 2) return labels.join(" & ");
  return labels.slice(0, -1).join(", ") + " & " + labels[labels.length - 1];
}

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
    <Shell hue="results">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant-sc text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            Your Education Compass
          </h1>
          <Link
            href="/compass/quiz"
            className="text-sm hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Retake quiz
          </Link>
        </div>

        {/* Archetype — frost card with character image */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
          }}
        >
          <div className="text-center space-y-3">
            {/* Character image with tool icon overlay */}
            <div className="relative inline-block mx-auto">
              <Image
                src={archetype.imagePath}
                alt={archetype.name}
                width={220}
                height={220}
                className="object-contain"
                style={{ height: "220px", width: "auto" }}
              />
              {/* Tool icon offset lower-right */}
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                <Image
                  src={archetype.toolPath}
                  alt=""
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-md"
                  style={{ height: "80px", width: "auto" }}
                />
              </div>
            </div>

            <h2
              className="font-cormorant-sc text-3xl font-semibold mt-6"
              style={{ color: archetype.color }}
            >
              You&apos;re {archetype.name}
            </h2>
            {secondaryArchetype && (
              <p className="text-sm font-medium" style={{ color: secondaryArchetype.color }}>
                with {secondaryArchetype.name} tendencies
              </p>
            )}
          </div>

          <p className="text-sm leading-relaxed font-cormorant" style={{ color: "var(--text-secondary)" }}>
            {archetype.description}
          </p>

          {secondaryArchetype && (
            <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  With {secondaryArchetype.name} tendencies,
                </span>{" "}
                {getComboText(archetype.id, secondaryArchetype.id).shareText.charAt(0).toLowerCase() + getComboText(archetype.id, secondaryArchetype.id).shareText.slice(1)}
              </p>
            </div>
          )}
        </div>

        {/* Dimension bars */}
        <div
          className="rounded-xl p-4 space-y-5"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
          }}
        >
          <h3 className="font-cormorant-sc font-semibold" style={{ color: "var(--ink)" }}>
            Your Five Dimensions
          </h3>
          {(
            Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>
          ).map((dim) => (
            <div key={dim} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>
                  {DIMENSION_LABELS[dim].left}
                </span>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {DIMENSION_LABELS[dim].name}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {DIMENSION_LABELS[dim].right}
                </span>
              </div>
              <div
                className="relative h-3 rounded-full"
                style={{ background: "rgba(0,0,0,0.06)" }}
              >
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${dimensions[dim]}% - 8px)`,
                    background: "var(--accent-primary)",
                  }}
                />
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${dimensions[dim]}%`,
                    background: "var(--accent-primary-dim)",
                  }}
                />
              </div>
              {dim === "structure" && structureSplit?.hasSplit && structureSplit.message && (
                <p className="text-xs italic" style={{ color: "#d97706" }}>
                  {structureSplit.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Philosophy blend */}
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
          }}
        >
          <h3 className="font-cormorant-sc font-semibold" style={{ color: "var(--ink)" }}>
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
                    contentStyle={{ borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {top3.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Frost pill for top philosophies */}
                  <span
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium"
                    style={{
                      background: "rgba(255,255,255,0.68)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.45)",
                      borderRadius: "6px",
                      color: item.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {item.value}%
                  </span>
                </div>
              ))}
              {philosophyData.length > 3 && (
                <div
                  className="space-y-1 pt-1 mt-1"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {philosophyData.slice(3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {item.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p
            className="text-xs text-center italic font-cormorant"
            style={{ color: "var(--text-tertiary)" }}
          >
            Most educators are a blend — your compass reflects your natural tendencies, not a rigid category.
          </p>
        </div>

        {/* Archetype-specific app pitch */}
        <div
          className="rounded-xl p-6 space-y-3"
          style={{ background: "var(--night)", borderRadius: "10px" }}
        >
          <h3
            className="font-cormorant-sc text-lg font-semibold"
            style={{ color: "var(--parchment)" }}
          >
            {archetype.appPitch.headline}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(249,246,239,0.75)" }}
          >
            {archetype.appPitch.body}
          </p>
          <Link
            href="/generate"
            className="inline-block text-sm font-medium hover:opacity-90 transition-opacity"
            style={{
              background: "var(--parchment)",
              color: "var(--night)",
              borderRadius: "10px",
              padding: "0.6rem 1.4rem",
            }}
          >
            {archetype.appPitch.cta} &rarr;
          </Link>
        </div>

        {/* Curriculum note */}
        <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
          Below are curriculum recommendations for your foundational subjects. Many published curricula lean toward classical structure — we&apos;ve found the best matches for your philosophy.
        </p>

        {/* Warnings */}
        {matchOutput?.warnings && matchOutput.warnings.length > 0 && (
          <div className="space-y-3">
            {matchOutput.warnings.map((w, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 text-sm ${
                  w.type === "dyslexia-recommendation"
                    ? "bg-blue-50 border border-blue-200 text-blue-800"
                    : w.type === "adhd-recommendation"
                      ? "bg-purple-50 border border-purple-200 text-purple-800"
                      : "bg-amber-50 border border-amber-200 text-amber-800"
                }`}
              >
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Fallback banner */}
        {matchOutput?.fallbackBanner && (
          <div className="rounded-xl p-4 text-sm bg-amber-50 border border-amber-200 text-amber-800">
            {matchOutput.fallbackBanner}
          </div>
        )}

        {/* Curriculum Recommendations */}
        <div className="space-y-4">
          <h3
            className="font-cormorant-sc text-lg font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Curriculum Recommendations
          </h3>

          {matchLoading && (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "12px",
              }}
            >
              <div
                className="inline-block w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mb-2"
                style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
              />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Finding your best curriculum matches...
              </p>
            </div>
          )}

          {matchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {matchError}
            </div>
          )}

          {matchOutput && Object.keys(matchOutput.bySubject).length === 0 && !matchLoading && (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "12px",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No curriculum matches found for your filters. Try adjusting your preferences or{" "}
                <Link href="/compass/quiz" className="hover:underline" style={{ color: "var(--accent-primary)" }}>
                  retaking the quiz
                </Link>.
              </p>
            </div>
          )}

          {matchOutput &&
            Object.entries(matchOutput.bySubject).map(([subject, results]) => (
              <div key={subject} className="space-y-3">
                <h4
                  className="font-cormorant-sc font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {SUBJECT_LABELS[subject] || subject}
                </h4>

                <div className="space-y-2">
                  {results.map((match, idx) => {
                    const c = match.curriculum;
                    const fit = FIT_STYLES[match.fitLabel] || FIT_STYLES.partial;
                    const prepStyle = PREP_STYLES[c.prepLevel] || { color: "#6b7280" };

                    return (
                      <div
                        key={c.id}
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
                              <h5
                                className="font-medium text-sm"
                                style={{ color: "var(--ink)" }}
                              >
                                {idx + 1}. {c.name}
                              </h5>
                              {idx === 0 && (
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
                            style={{
                              background: "rgba(0,0,0,0.05)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {c.religiousType === "christian"
                              ? `Christian (${c.faithDepth})`
                              : c.religiousType.charAt(0).toUpperCase() + c.religiousType.slice(1)}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(0,0,0,0.05)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {c.gradeRange}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(0,0,0,0.05)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {c.priceRange}
                          </span>
                        </div>

                        {c.subjects.length > 1 && (
                          <p className="text-xs text-indigo-600 mt-1.5">
                            Covers {formatSubjectList(c.subjects)} — may need to be purchased as a complete package. Check the publisher&apos;s site.
                          </p>
                        )}

                        {c.notes && (
                          <details className="mt-2">
                            <summary
                              className="text-xs cursor-pointer"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Details
                            </summary>
                            <p
                              className="text-xs mt-1 leading-relaxed"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.notes}
                            </p>
                          </details>
                        )}

                        {subject === "literacy" && LITERACY_COMPONENTS[c.name] && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {LITERACY_COMPONENTS[c.name].map((component) => (
                              <span
                                key={component}
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${LITERACY_COMPONENT_COLORS[component]}`}
                                title={LITERACY_COMPONENT_LABELS[component]}
                              >
                                {LITERACY_COMPONENT_LABELS[component]}
                              </span>
                            ))}
                          </div>
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
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="rounded-xl p-4 text-center space-y-2"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Ready to start building lessons that match your {archetype.name} style?
          </p>
          <Link
            href="/generate"
            className="inline-block text-sm font-medium hover:opacity-90 transition-opacity"
            style={{
              background: "var(--night)",
              color: "var(--parchment)",
              borderRadius: "10px",
              padding: "0.6rem 1.4rem",
            }}
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
    adaptive: 5,
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
