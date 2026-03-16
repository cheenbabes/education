"use client";

import { useMemo } from "react";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
  const dimensions: DimensionScores = data.dimensions || data.dimensionScores;
  const philosophies: Record<PhilosophyKey, number> =
    data.philosophies || data.philosophyBlend;
  const structureSplit = data.structureFlowSplit;

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
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-6 text-center space-y-3">
          <p className="text-4xl">{archetype.icon}</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {archetype.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {archetype.description}
          </p>
        </div>

        {/* Dimension bars */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-5">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Your Five Dimensions
          </h3>
          {(
            Object.keys(DIMENSION_LABELS) as Array<
              keyof typeof DIMENSION_LABELS
            >
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
                  style={{
                    left: `calc(${dimensions[dim]}% - 8px)`,
                  }}
                />
                <div
                  className="h-full bg-gray-300 dark:bg-gray-700 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${dimensions[dim]}%` }}
                />
              </div>
              {dim === "structure" &&
                structureSplit?.hasSplit &&
                structureSplit.message && (
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {item.value}%
                  </span>
                </div>
              ))}
              {philosophyData.length > 3 && (
                <div className="space-y-1">
                  {philosophyData.slice(3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.name} ({item.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">
            Most educators are a blend — your compass reflects your natural
            tendencies, not a rigid category.
          </p>
        </div>

        {/* Curriculum disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">A note about curriculum and philosophy:</span>{" "}
            By design, many published curricula lean toward classical structure.
            We&apos;ll find the curricula that best match your philosophy — but if
            your compass points toward flexible, adaptive, or child-led approaches,
            a boxed curriculum may not fully capture your style.{" "}
            <Link href="/generate" className="font-medium underline">
              Explore our emergent and adaptive lesson planner
            </Link>{" "}
            for responsive, interest-driven lessons built around your child&apos;s curiosity.
          </p>
        </div>

        {/* Curriculum Recommendations placeholder */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Curriculum Recommendations
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalized curriculum recommendations coming soon. We&apos;re
              building a curated database of vetted curricula matched to your
              philosophy and practical needs.
            </p>
          </div>
        </div>

        {/* EduApp pitch */}
        <div className="bg-gray-900 dark:bg-gray-100 rounded p-6 text-center space-y-3">
          <h3 className="text-lg font-bold text-white dark:text-gray-900">
            Build Interest-Driven Lessons
          </h3>
          <p className="text-sm text-gray-300 dark:text-gray-600 max-w-lg mx-auto">
            Have your foundational curriculum for literacy and math? Use EduApp
            to create interest-driven lessons for everything else — science,
            social studies, art, and whatever your child is curious about today.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Try EduApp Free
          </Link>
        </div>
      </div>
    </Shell>
  );
}

const DEMO_RESULT = {
  archetype: "the-explorer",
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
};
