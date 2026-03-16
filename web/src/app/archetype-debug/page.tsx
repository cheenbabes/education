"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { PHILOSOPHY_LABELS, PHILOSOPHY_COLORS, PhilosophyKey } from "@/lib/compass/scoring";
import { getAllCombos } from "@/lib/compass/combo-text";

const allCombos = getAllCombos();

export default function ArchetypeDebugPage() {
  const [filterPrimary, setFilterPrimary] = useState<string>("all");
  const [filterSecondary, setFilterSecondary] = useState<string>("all");

  const filtered = allCombos.filter((c) => {
    if (filterPrimary !== "all" && c.primaryId !== filterPrimary) return false;
    if (filterSecondary !== "all" && c.secondaryId !== filterSecondary) return false;
    return true;
  });

  // Group by primary
  const grouped: Record<string, typeof allCombos> = {};
  for (const c of filtered) {
    if (!grouped[c.primaryId]) grouped[c.primaryId] = [];
    grouped[c.primaryId].push(c);
  }

  return (
    <Shell>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Archetype Combo Debug
          </h1>
          <span className="text-sm text-gray-500">
            {filtered.length} of {allCombos.length} combos
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          All {allCombos.length} possible primary + secondary archetype combinations with shareable text.
          Review each one to make sure the description sounds accurate and compelling.
        </p>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Primary</label>
            <select
              value={filterPrimary}
              onChange={(e) => setFilterPrimary(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All ({allCombos.length})</option>
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name} ({allCombos.filter((c) => c.primaryId === a.id).length})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Secondary</label>
            <select
              value={filterSecondary}
              onChange={(e) => setFilterSecondary(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All</option>
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Combo cards grouped by primary */}
        {Object.entries(grouped).map(([primaryId, combos]) => {
          const primary = ARCHETYPES.find((a) => a.id === primaryId)!;
          const sortedPhils = (Object.entries(primary.philosophyProfile) as [PhilosophyKey, number][])
            .filter(([, v]) => v >= 0.1)
            .sort((a, b) => b[1] - a[1]);

          return (
            <div key={primaryId} className="space-y-3">
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <span className="text-2xl">{primary.icon}</span>
                <div>
                  <h2 className="font-medium text-gray-900 dark:text-gray-100">{primary.name} as Primary</h2>
                  <div className="flex gap-1 mt-0.5">
                    {sortedPhils.map(([phil, weight]) => (
                      <span
                        key={phil}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${PHILOSOPHY_COLORS[phil]}20`,
                          color: PHILOSOPHY_COLORS[phil],
                        }}
                      >
                        {PHILOSOPHY_LABELS[phil]?.split(/[\s/]/)[0]} {Math.round(weight * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {combos.map((combo) => {
                const secondary = ARCHETYPES.find((a) => a.id === combo.secondaryId)!;
                return (
                  <div
                    key={combo.secondaryId}
                    className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{primary.icon}</span>
                      <span className="text-xs text-gray-400">+</span>
                      <span className="text-lg">{secondary.icon}</span>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {primary.name} <span className="text-gray-400 font-normal">with</span> {secondary.name} <span className="text-gray-400 font-normal">tendencies</span>
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {combo.text.shareText}
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                        &quot;I took the Education Compass quiz and I&apos;m {primary.name} with {secondary.name} tendencies! {combo.text.shareText}&quot;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
