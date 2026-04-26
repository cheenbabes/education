"use client";

import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { ShareButtons } from "@/components/share-buttons";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { track } from "@/lib/analytics";

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
  reading: "Reading",
  writing: "Writing",
  spelling: "Spelling",
  grammar: "Grammar",
  complete: "Complete Language Arts",
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

export function ResultsPageClient() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "var(--hue-results)" }} />}>
      <ResultsPageInner />
    </Suspense>
  );
}

function ResultsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resultId = searchParams.get("id");

  // Result from sessionStorage (set right after quiz completion)
  const sessionResult = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("compass_result");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  }, []);

  // Result loaded from DB when ?id= is provided (e.g. from Account page)
  const [dbResult, setDbResult] = useState<Record<string, unknown> | null>(null);
  const [loadingDb, setLoadingDb] = useState(!!resultId && !sessionResult);

  useEffect(() => {
    if (!resultId || sessionResult) return; // session takes priority when fresh
    fetch(`/api/compass/results/${resultId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setDbResult(d); })
      .catch(() => {})
      .finally(() => setLoadingDb(false));
  }, [resultId, sessionResult]);

  // All hooks must be declared before any early returns
  const [matchOutput, setMatchOutput] = useState<MatchOutput | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Support shared view via ?a=archetypeId&s=secondaryId
  const sharedArchetypeId = searchParams.get("a");
  const sharedSecondaryId = searchParams.get("s");
  const sharedData = sharedArchetypeId && ARCHETYPES.find((a) => a.id === sharedArchetypeId)
    ? {
        archetype: sharedArchetypeId,
        secondaryArchetype: sharedSecondaryId || null,
        dimensions: { structure: 50, modality: 50, subjectApproach: 50, direction: 50, social: 50 },
        philosophies: {},
        part2Preferences: {},
      }
    : null;
  const isSharedView = !sessionResult && !dbResult && !!sharedData;

  const rawData = loadingDb ? null : (sessionResult || dbResult || sharedData || DEMO_RESULT);
  const data = rawData ? {
    ...rawData,
    dimensions: (rawData as Record<string, unknown>).dimensions || (rawData as Record<string, unknown>).dimensionScores,
    philosophies: (rawData as Record<string, unknown>).philosophies || (rawData as Record<string, unknown>).philosophyBlend,
  } : null;

  const philosophies = (data?.philosophies ?? {}) as Record<PhilosophyKey, number>;

  const fetchMatches = useCallback(async () => {
    if (!data) return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      const normalizedPhilosophies: Record<string, number> = {};
      for (const [key, value] of Object.entries(philosophies)) {
        normalizedPhilosophies[key] = (value as number) / 100;
      }
      const prefs = (data as Record<string, unknown>).part2Preferences
        ? mapPart2Preferences((data as Record<string, unknown>).part2Preferences as Record<string, string | string[]>)
        : {};
      const res = await fetch("/api/compass/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ philosophyBlend: normalizedPhilosophies, part2Preferences: prefs }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setMatchOutput(await res.json());
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "Failed to load recommendations");
    } finally {
      setMatchLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    // Don't fetch curriculum matches until Part 2 is complete
    const part2Done = data &&
      Object.keys(((data as Record<string, unknown>).part2Preferences as Record<string, unknown>) ?? {}).length > 0;
    if (part2Done) fetchMatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data]);

  // Fire a single results_viewed event once we have data to render.
  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    const part2Done =
      Object.keys((d.part2Preferences as Record<string, unknown>) ?? {}).length > 0;
    track("compass_results_viewed", {
      archetype: d.archetype as string | undefined,
      secondary_archetype: (d.secondaryArchetype as string | undefined) || null,
      is_partial: !part2Done,
      is_shared_view: isSharedView,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data]);

  // Early return after all hooks
  if (loadingDb || !data) {
    return (
      <Shell hue="results">
        <div className="flex items-center justify-center py-20">
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading your results…</p>
        </div>
      </Shell>
    );
  }

  const isPartialResult = dbResult && !sessionResult &&
    Object.keys(((dbResult as Record<string, unknown>).part2Preferences as Record<string, unknown>) ?? {}).length === 0;

  const d = data as Record<string, unknown>;
  const archetype = ARCHETYPES.find((a) => a.id === d.archetype) || ARCHETYPES[0];
  const secondaryArchetype = d.secondaryArchetype
    ? ARCHETYPES.find((a) => a.id === d.secondaryArchetype) || null
    : null;
  const dimensions = d.dimensions as DimensionScores;
  const structureSplit = d.structureFlowSplit as { hasSplit?: boolean; message?: string } | undefined;

  const philosophyData = (Object.keys(philosophies) as PhilosophyKey[])
    .filter((key) => philosophies[key] > 0)
    .sort((a, b) => philosophies[b] - philosophies[a])
    .map((key) => ({
      name: PHILOSOPHY_LABELS[key],
      value: philosophies[key],
      color: PHILOSOPHY_COLORS[key],
    }));

  const top3 = philosophyData.slice(0, 3);

  // Top philosophy (used as a tracking property when users click the redesigned
  // CTAs — gives funnel queries a way to segment by archetype-blend top slot).
  const sortedBlendKeys = Object.entries(philosophies)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([key]) => key);
  const topBlendKey = sortedBlendKeys[0] ?? null;
  const secondaryBlendKey = sortedBlendKeys[1] ?? null;

  return (
    <Shell hue="results">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cormorant-sc text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            {isSharedView ? "Sage\u2019s Compass" : "Your Education Compass"}
          </h1>
          {!isSharedView && (
            <Link
              href="/compass/quiz"
              className="text-sm hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Retake assessment
            </Link>
          )}
        </div>

        {/* Part 2 nudge — shown when viewing a Part 1-only result */}
        {isPartialResult && !isSharedView && (
          <div style={{
            background: "rgba(196,152,61,0.08)",
            border: "1px solid rgba(196,152,61,0.3)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#9a7530", marginBottom: "0.2rem" }}>
                Curriculum recommendations are based on your philosophy profile only
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Complete Part 2 to refine matches by subject, prep level, budget, and learning needs.
              </p>
            </div>
            <Link href="/compass/quiz" style={{
              fontSize: "0.8rem", fontWeight: 600, padding: "0.45rem 1rem",
              borderRadius: "8px", background: "#082f4e", color: "#F9F6EF",
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              Complete Part 2 →
            </Link>
          </div>
        )}

        {/* Archetype — frost card with character image. Floats a small vertical
            share strip in the top-right corner; embeds the "Why X?" details
            accordion at the bottom so the dimension/philosophy breakdown lives
            with the archetype rather than as a sibling card. */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
            position: "relative",
          }}
        >
          {/* Floating vertical share strip, top-right */}
          <div
            style={{
              position: "absolute",
              top: "0.85rem",
              right: "0.85rem",
              zIndex: 2,
            }}
          >
            <ShareButtons
              archetypeId={archetype.id}
              archetypeName={archetype.name}
              secondaryId={secondaryArchetype?.id ?? null}
              secondaryName={secondaryArchetype?.name ?? null}
              shareText={
                secondaryArchetype
                  ? getComboText(archetype.id, secondaryArchetype.id).shareText
                  : archetype.description.split(".")[0] + "."
              }
              archetypeColor={archetype.color}
              variant="vertical"
            />
          </div>

          <div className="text-center space-y-3">
            {/* Primary archetype illustration. The share-icon strip is
                absolutely-positioned in the top-right corner, so flex
                `justify-center` centers the figure relative to the card —
                but visually it reads as off-center because the share strip
                pulls weight to the right. Mirror the share strip's footprint
                with matching left padding so the figure sits in the optical
                center of the visible content area. */}
            <div
              className="flex items-end justify-center overflow-hidden"
              style={{ paddingLeft: "3.5rem", paddingRight: "3.5rem" }}
            >
              <Image
                src={archetype.resultsImagePath}
                alt={archetype.name}
                width={220}
                height={220}
                className="object-contain max-w-[55vw] sm:max-w-none"
                style={{ height: "auto", maxHeight: "220px", width: "auto" }}
              />
            </div>

            <h2
              className="font-cormorant-sc text-3xl font-semibold mt-6"
              style={{ color: archetype.color }}
            >
              You&apos;re {archetype.name}
            </h2>
            {secondaryArchetype && (
              <p
                className="text-sm font-semibold"
                style={{ color: secondaryArchetype.color, marginTop: "0.15rem" }}
              >
                with {secondaryArchetype.name} tendencies
              </p>
            )}
          </div>

          {/* Description paragraph. When there's a secondary archetype, its
              tool floats at the start of the paragraph so the prose wraps
              around the icon — like a leading drop-cap rather than its own
              column. The text fills the line beside the tool and continues
              below it once the float clears, keeping the secondary identity
              visually attached to the description without taking dedicated
              vertical space. */}
          <div className="mx-auto" style={{ maxWidth: "520px" }}>
            <p
              className="font-cormorant"
              style={{
                fontSize: "1rem",
                fontStyle: "italic",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: 0,
                textAlign: secondaryArchetype ? "left" : "center",
              }}
            >
              {secondaryArchetype && (
                <Image
                  src={secondaryArchetype.toolPath}
                  alt={secondaryArchetype.name}
                  width={88}
                  height={88}
                  className="object-contain"
                  style={{
                    float: "left",
                    height: "auto",
                    maxHeight: "88px",
                    width: "auto",
                    marginRight: "0.15rem",
                    marginTop: 0,
                    marginBottom: 0,
                    // Shape from the alpha channel — text wraps around the
                    // actual watering-can silhouette instead of the PNG's
                    // rectangular bounding box (which has lots of transparent
                    // padding). shapeMargin adds a small breathing gap so
                    // letters don't kiss the icon's edge.
                    shapeOutside: `url(${secondaryArchetype.toolPath})`,
                    shapeMargin: "0.4rem",
                  }}
                />
              )}
              {archetype.description}
            </p>
          </div>

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

          {/* "Why X?" accordion, embedded inside the archetype card */}
          {!isSharedView && (
            <details
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "12px",
              }}
            >
              <summary
                style={{
                  padding: "0.9rem 1rem",
                  cursor: "pointer",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)" }}>
                    Why {archetype.name}?
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                    Dimension breakdown · philosophy blend
                  </span>
                </div>
                <span style={{ fontSize: "0.9rem", color: "var(--text-tertiary)" }}>⌄</span>
              </summary>
              <div style={{ padding: "0.25rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Primary CTA — public 8-lesson gallery (anon-friendly conversion page).
            The "Match with curricula" follow-up now lives at the bottom of the
            curriculum accordion below, so we don't double-stack two big buttons. */}
        {!isSharedView && !isPartialResult && (
          <Link
            href="/compass/lessons"
            onClick={() =>
              track("compass_sample_cta_clicked", {
                source: "results_primary_button",
                top_blend_key: topBlendKey ?? null,
                secondary_blend_key: secondaryBlendKey ?? null,
              })
            }
            style={{
              background: "var(--night)",
              color: "var(--parchment)",
              borderRadius: "14px",
              padding: "1.05rem 1.25rem",
              fontSize: "1rem",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
              display: "block",
              lineHeight: 1.2,
            }}
          >
            Lessons for your teaching style &rarr;
          </Link>
        )}

        {/* Shared-view CTA */}
        {isSharedView && (
          <div
            className="rounded-xl p-6 text-center space-y-3"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "12px",
            }}
          >
            <p style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600 }}>
              Discover your teaching archetype
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto" }}>
              Take the free Sage&apos;s Compass assessment to find out which of 8 teaching archetypes fits your teaching style.
            </p>
            <Link
              href="/compass/quiz"
              style={{
                display: "inline-block",
                background: "var(--night)",
                color: "var(--parchment)",
                borderRadius: "10px",
                padding: "0.65rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Take the Free Quiz &rarr;
            </Link>
          </div>
        )}

        {!isSharedView && <>
        {/* Gate curriculum section on Part 2 completion */}
        {isPartialResult ? (
          <div style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "16px",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}>
            <div className="font-cormorant-sc" style={{ fontSize: "1.25rem", color: "var(--ink)", marginBottom: "0.75rem" }}>
              Curriculum Recommendations
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto 1.5rem", lineHeight: 1.65 }}>
              To recommend the right curricula, we need to know your subject priorities, grade levels, budget, and learning needs. That&apos;s what Part 2 is for — it only takes a few minutes.
            </p>
            <button
              onClick={() => {
                // Save current result to sessionStorage so the quiz can skip Part 1
                try {
                  sessionStorage.setItem("compass_result", JSON.stringify({
                    archetype: d.archetype,
                    secondaryArchetype: d.secondaryArchetype || null,
                    dimensions: dimensions,
                    philosophies: philosophies,
                    structureFlowSplit: d.structureFlowSplit,
                    part2Preferences: {},
                  }));
                } catch { /* ignore */ }
                router.push("/compass/quiz?skipToP2=true");
              }}
              style={{
                background: "#082f4e", color: "#F9F6EF",
                borderRadius: "10px", padding: "0.7rem 1.75rem",
                fontSize: "0.9rem", fontWeight: 600, border: "none",
                cursor: "pointer",
              }}
            >
              Complete Part 2 to See Your Recommendations →
            </button>
          </div>
        ) : (
          <>
        {/* Curriculum note */}
        <p className="text-xs italic" style={{ color: "var(--text-tertiary)" }}>
          Below are curriculum recommendations for your foundational subjects. Many published curricula lean toward classical structure — we&apos;ve found the best matches for your philosophy.
        </p>

        {/* Curriculum Recommendations — collapsed into an accordion. Warnings
            and the fallback banner now live INSIDE the accordion (above the
            results) so they no longer compete with the page-level CTAs. */}
        <details
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "12px",
          }}
        >
          <summary
            style={{
              padding: "0.9rem 1rem",
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--ink)" }}>
                {(() => {
                  const count = matchOutput
                    ? Object.values(matchOutput.bySubject).reduce((n, arr) => n + arr.length, 0)
                    : 0;
                  return count > 0 ? `Your ${count} curriculum matches` : "Your curriculum matches";
                })()}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                {(() => {
                  if (!matchOutput) return "Matched to your philosophy and practical needs";
                  const topNames = Object.values(matchOutput.bySubject)
                    .flat()
                    .slice(0, 3)
                    .map((m) => m.curriculum.name);
                  return topNames.length > 0 ? `${topNames.join(" · ")}${topNames.length >= 3 ? " + more" : ""}` : "Matched to your philosophy and practical needs";
                })()}
              </span>
            </div>
            <span style={{ fontSize: "0.9rem", color: "var(--text-tertiary)" }}>⌄</span>
          </summary>
          <div className="space-y-4" style={{ padding: "0.5rem 1rem 1rem" }}>

          {/* Warnings (moved inside accordion) */}
          {matchOutput?.warnings && matchOutput.warnings.length > 0 && (
            <div className="space-y-3">
              {matchOutput.warnings.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: "12px",
                    borderTop: "3px solid #D97706",
                    borderRight: "1px solid rgba(217,119,6,0.15)",
                    borderBottom: "1px solid rgba(217,119,6,0.15)",
                    borderLeft: "1px solid rgba(217,119,6,0.15)",
                    padding: "1rem 1.25rem",
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    boxShadow: "0 4px 16px rgba(217,119,6,0.1), 0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {w.message}
                </div>
              ))}
            </div>
          )}

          {/* Fallback banner (moved inside accordion) */}
          {matchOutput?.fallbackBanner && (
            <div style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: "12px",
              borderTop: "3px solid #D97706",
              borderRight: "1px solid rgba(217,119,6,0.15)",
              borderBottom: "1px solid rgba(217,119,6,0.15)",
              borderLeft: "1px solid rgba(217,119,6,0.15)",
              padding: "1rem 1.25rem",
              fontSize: "0.85rem",
              color: "var(--ink)",
              boxShadow: "0 4px 16px rgba(217,119,6,0.1), 0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {matchOutput.fallbackBanner}
            </div>
          )}

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
                  retaking the assessment
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

          {/* See-all entry into the full curriculum browser. Lives inside the
              accordion so it only renders when the user has actually opened
              the curriculum panel. No signup wall — /curriculum is public. */}
          {matchOutput && Object.keys(matchOutput.bySubject).length > 0 && (
            <div className="pt-2">
              <Link
                href="/curriculum"
                onClick={() =>
                  track("compass_see_all_curricula_clicked", {
                    source: "results_curriculum_accordion",
                    top_blend_key: topBlendKey ?? null,
                    secondary_blend_key: secondaryBlendKey ?? null,
                  })
                }
                style={{
                  background: "rgba(255,255,255,0.72)",
                  color: "var(--ink)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                  padding: "0.85rem 1.1rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  display: "block",
                  lineHeight: 1.2,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                See all curricula matches &rarr;
              </Link>
            </div>
          )}
          </div>
        </details>

        {/* Suggest a curriculum */}
        <p className="text-center">
          <Link
            href="/contact?subject=curriculum-suggestion"
            className="hover:underline"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-tertiary)",
              textDecoration: "none",
            }}
          >
            Missing your favorite curriculum? Let us know &rarr;
          </Link>
        </p>

        {/* Bottom CTA removed — primary CTA is now the sample-lesson card at the top */}
          </>
        )}
        </>}
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
