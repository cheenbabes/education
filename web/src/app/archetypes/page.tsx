"use client";

import { Shell } from "@/components/shell";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { DIMENSION_LABELS } from "@/lib/compass/scoring";

export default function ArchetypesPage() {
  return (
    <Shell>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Education Compass Archetypes
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          There are {ARCHETYPES.length} archetypes. Each represents a distinct
          teaching style based on where you fall across five dimensions. Take the
          quiz to discover yours.
        </p>

        {/* Dimensions reference */}
        <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-2">
          <h2 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            The Five Dimensions
          </h2>
          {(
            Object.keys(DIMENSION_LABELS) as Array<
              keyof typeof DIMENSION_LABELS
            >
          ).map((dim) => (
            <div
              key={dim}
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300 w-32">
                {DIMENSION_LABELS[dim].name}
              </span>
              <span>{DIMENSION_LABELS[dim].left}</span>
              <span className="text-gray-300 dark:text-gray-600">
                &harr;
              </span>
              <span>{DIMENSION_LABELS[dim].right}</span>
            </div>
          ))}
        </div>

        {/* Archetype cards */}
        <div className="space-y-4">
          {ARCHETYPES.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {a.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {a.description}
                  </p>
                </div>
              </div>

              {/* All 5 dimension bars */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Dimension profile
                </p>
                {(
                  Object.keys(DIMENSION_LABELS) as Array<
                    keyof typeof DIMENSION_LABELS
                  >
                ).map((dim) => {
                  const range = a.match[dim];
                  const hasRange = !!range;
                  return (
                    <div key={dim} className="space-y-0.5">
                      <div className={`flex justify-between text-xs ${hasRange ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"}`}>
                        <span>{DIMENSION_LABELS[dim].left}</span>
                        <span className={hasRange ? "font-medium text-gray-600 dark:text-gray-300" : ""}>
                          {DIMENSION_LABELS[dim].name}
                        </span>
                        <span>{DIMENSION_LABELS[dim].right}</span>
                      </div>
                      <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {hasRange && (
                          <div
                            className="absolute h-full bg-gray-900 dark:bg-gray-200 rounded-full"
                            style={{
                              left: `${range[0]}%`,
                              width: `${range[1] - range[0]}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 dark:text-gray-500 italic pt-1">
                  Highlighted ranges are the dimensions that define this archetype. Empty bars mean any value is fine.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
