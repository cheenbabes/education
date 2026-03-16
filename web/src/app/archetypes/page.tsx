"use client";

import { Shell } from "@/components/shell";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { DIMENSION_LABELS, PHILOSOPHY_LABELS, PHILOSOPHY_COLORS, PhilosophyKey } from "@/lib/compass/scoring";

export default function ArchetypesPage() {
  return (
    <Shell>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Education Compass Archetypes
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          There are {ARCHETYPES.length} archetypes. Each represents a distinct
          teaching style based on your philosophy blend and dimension scores. Take the
          quiz to discover yours.
        </p>

        {/* Archetype cards */}
        <div className="space-y-4">
          {ARCHETYPES.map((a) => {
            // Sort philosophies by weight for this archetype
            const sortedPhils = (Object.entries(a.philosophyProfile) as [PhilosophyKey, number][])
              .filter(([, v]) => v >= 0.1)
              .sort((x, y) => y[1] - x[1]);

            return (
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

                {/* Philosophy affinity */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Philosophy affinity
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedPhils.map(([phil, weight]) => (
                      <span
                        key={phil}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${PHILOSOPHY_COLORS[phil]}20`,
                          color: PHILOSOPHY_COLORS[phil],
                          border: `1px solid ${PHILOSOPHY_COLORS[phil]}40`,
                        }}
                      >
                        {PHILOSOPHY_LABELS[phil]} ({Math.round(weight * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dimension tendencies */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Dimension tendencies
                  </p>
                  {(
                    Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>
                  ).map((dim) => {
                    const value = a.dimensionTendencies[dim];
                    const hasValue = value !== undefined;
                    return (
                      <div key={dim} className="space-y-0.5">
                        <div className={`flex justify-between text-xs ${hasValue ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"}`}>
                          <span>{DIMENSION_LABELS[dim].left}</span>
                          <span className={hasValue ? "font-medium text-gray-600 dark:text-gray-300" : ""}>
                            {DIMENSION_LABELS[dim].name}
                          </span>
                          <span>{DIMENSION_LABELS[dim].right}</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          {hasValue && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 dark:bg-gray-200 rounded-full"
                              style={{ left: `calc(${value}% - 6px)` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
