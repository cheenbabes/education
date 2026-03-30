"use client";

import Image from "next/image";
import { Shell } from "@/components/shell";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { DIMENSION_LABELS, PHILOSOPHY_LABELS, PHILOSOPHY_COLORS, PhilosophyKey } from "@/lib/compass/scoring";

export default function ArchetypesPage() {
  return (
    <Shell hue="archetypes">
      <div className="max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1
            className="font-cormorant-sc text-3xl font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Education Compass Archetypes
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            There are {ARCHETYPES.length} archetypes. Each represents a distinct
            teaching style based on your philosophy blend and dimension scores. Take the
            quiz to discover yours.
          </p>
        </div>

        {/* 2-column grid (1-col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARCHETYPES.map((a) => {
            // These archetypes need to be flipped to face away from the text
            const FLIP_IDS = new Set(["the-guide", "the-explorer", "the-cultivator"]);
            const imageTransform = FLIP_IDS.has(a.id) ? "scaleX(-1)" : undefined;

            // Sort philosophies by weight for this archetype
            const sortedPhils = (Object.entries(a.philosophyProfile) as [PhilosophyKey, number][])
              .filter(([, v]) => v >= 0.1)
              .sort((x, y) => y[1] - x[1]);

            return (
              <div
                key={a.id}
                className="relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: "12px",
                  borderLeft: `4px solid ${a.color}`,
                }}
              >
                {/* Top row: text left, character + tool right */}
                <div className="flex items-start gap-3 p-4">
                  {/* Text column */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3
                      className="font-cormorant-sc text-xl font-semibold leading-tight"
                      style={{ color: a.color }}
                    >
                      {a.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {a.description}
                    </p>
                  </div>

                  {/* Character image */}
                  <div className="relative flex-shrink-0 self-start">
                    <Image
                      src={a.imagePath}
                      alt={a.name}
                      width={160}
                      height={160}
                      className="object-contain"
                      style={{ transform: imageTransform, objectFit: 'cover', objectPosition: 'top', height: "160px", width: "auto" }}
                    />
                  </div>
                </div>

                {/* Philosophy affinity pills */}
                <div
                  className="px-4 pb-4 space-y-2"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "0.75rem", marginTop: "0.25rem" }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Philosophy affinity
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedPhils.map(([phil, weight]) => (
                      <span
                        key={phil}
                        className="text-xs font-medium"
                        style={{
                          background: "rgba(255,255,255,0.68)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.45)",
                          borderRadius: "6px",
                          fontSize: "0.7rem",
                          padding: "0.25rem 0.6rem",
                          color: PHILOSOPHY_COLORS[phil],
                        }}
                      >
                        {PHILOSOPHY_LABELS[phil]} ({Math.round(weight * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dimension tendencies */}
                <div className="px-4 pb-4 space-y-1.5">
                  <p
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Dimension tendencies
                  </p>
                  {(
                    Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>
                  ).map((dim) => {
                    const value = a.dimensionTendencies[dim] ?? 50;
                    return (
                      <div key={dim} className="space-y-0.5">
                        <div
                          className="flex justify-between text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span>{DIMENSION_LABELS[dim].left}</span>
                          <span className="font-medium" style={{ color: "var(--ink)" }}>
                            {DIMENSION_LABELS[dim].name}
                          </span>
                          <span>{DIMENSION_LABELS[dim].right}</span>
                        </div>
                        <div
                          className="relative h-2 rounded-full"
                          style={{ background: "rgba(0,0,0,0.06)" }}
                        >
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                            style={{
                              left: `calc(${value}% - 6px)`,
                              background: a.color,
                            }}
                          />
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
