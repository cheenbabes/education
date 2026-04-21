"use client";

import { useState } from "react";

/**
 * Shared renderer for lesson sections — used by both /lessons/[id] and the
 * Compass sample-lesson page (/compass/sample/[philosophy]). Keeps the two
 * surfaces visually identical: same chevron, same tips/extensions cards,
 * same philosophy-connection block, same indoor/outdoor pill colors.
 *
 * Accepts the DB-shaped section format (snake_case keys) directly so the
 * /lessons/[id] page can hand over its existing state with no adapter.
 * The sample page maps its camelCase SampleLessonSection → this shape
 * before calling.
 */
export interface LessonSectionInput {
  title: string;
  duration_minutes?: number;
  indoor_outdoor?: string;
  instructions: string;
  philosophy_connection?: string;
  tips?: string[];
  extensions?: string[];
  type?: string;
}

interface LessonSectionsDisplayProps {
  sections: LessonSectionInput[];
  philosophyColor: string;
  /** Defaults to all sections open on first render. */
  initialAllOpen?: boolean;
}

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const frostPillBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "6px",
  fontSize: "0.7rem",
  padding: "0.25rem 0.6rem",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
};

const IO_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  outdoor: { color: "#3D7E5A", bg: "rgba(61,126,90,0.12)", icon: "🌿" },
  indoor: { color: "#5A7FA0", bg: "rgba(90,127,160,0.12)", icon: "🏠" },
  both: { color: "#7D6B9E", bg: "rgba(125,107,158,0.12)", icon: "✨" },
};

function ChevronToggle({ open }: { open: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        color: "#5A5A5A",
        fontSize: "0.75rem",
        fontWeight: 500,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function StructuredInstructions({ text }: { text: string }) {
  const lines = text.split(/\n+/).filter((l) => l.trim());

  if (lines.length <= 1) {
    return <p style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>{text}</p>;
  }

  const hasNumberedSteps = lines.some((l) => /^\d+[.)]\s/.test(l.trim()));

  if (hasNumberedSteps) {
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const stepMatch = line.trim().match(/^(\d+)[.)]\s*(.*)/);
          if (stepMatch) {
            return (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span
                  style={{
                    ...frostPillBase,
                    background: "rgba(11,46,74,0.06)",
                    border: "1px solid rgba(11,46,74,0.12)",
                    color: "#0B2E4A",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    minWidth: "1.5rem",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "0.15rem",
                  }}
                >
                  {stepMatch[1]}
                </span>
                <p style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7, flex: 1 }}>{stepMatch[2]}</p>
              </div>
            );
          }
          return (
            <p key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} style={{ fontSize: "0.875rem", color: "#5A5A5A", lineHeight: 1.7 }}>
          {line}
        </p>
      ))}
    </div>
  );
}

export function LessonSectionsDisplay({
  sections,
  philosophyColor,
  initialAllOpen = true,
}: LessonSectionsDisplayProps) {
  const [openStates, setOpenStates] = useState<Record<number, boolean>>(() => {
    if (!initialAllOpen) return {};
    return Object.fromEntries(sections.map((_, i) => [i, true]));
  });

  const toggle = (i: number) =>
    setOpenStates((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const io = IO_CONFIG[section.indoor_outdoor || "both"] || IO_CONFIG.both;
        const open = !!openStates[i];

        return (
          <div key={i} style={{ ...frostCard, borderLeft: `3px solid ${io.color}30` }}>
            <div
              className="flex items-center justify-between"
              style={{ cursor: "pointer" }}
              onClick={() => toggle(i)}
            >
              <div className="flex items-center gap-2">
                <ChevronToggle open={open} />
                <h4
                  className="font-cormorant-sc"
                  style={{ fontSize: "0.85rem", letterSpacing: "0.04em", color: "#0B2E4A", margin: 0 }}
                >
                  {section.title}
                </h4>
              </div>
              <div className="flex gap-1.5">
                {section.duration_minutes !== undefined && (
                  <span style={{ ...frostPillBase, color: "#5A5A5A" }}>
                    {section.duration_minutes} min
                  </span>
                )}
                {section.indoor_outdoor && (
                  <span
                    style={{
                      ...frostPillBase,
                      color: io.color,
                      background: io.bg,
                      border: `1px solid ${io.color}25`,
                    }}
                  >
                    {io.icon} {section.indoor_outdoor}
                  </span>
                )}
              </div>
            </div>

            {open && (
              <div style={{ marginTop: "0.75rem" }}>
                <StructuredInstructions text={section.instructions} />

                {section.philosophy_connection && (
                  <div
                    style={{
                      borderLeft: `3px solid ${philosophyColor}40`,
                      borderRadius: "0 8px 8px 0",
                      padding: "0.6rem 1rem",
                      marginTop: "0.75rem",
                      fontSize: "0.8rem",
                      color: "#767676",
                      fontStyle: "italic",
                      background: `${philosophyColor}08`,
                    }}
                  >
                    {section.philosophy_connection}
                  </div>
                )}

                {section.tips && section.tips.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      background: "rgba(196,152,61,0.06)",
                      borderRadius: "8px",
                      borderLeft: "3px solid rgba(196,152,61,0.3)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        color: "#B08A2E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Tips
                    </p>
                    <div className="space-y-1">
                      {section.tips.map((tip, j) => (
                        <p key={j} style={{ fontSize: "0.8rem", color: "#5A5A5A", lineHeight: 1.5 }}>
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {section.extensions && section.extensions.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.6rem 0.75rem",
                      background: "rgba(90,127,160,0.06)",
                      borderRadius: "8px",
                      borderLeft: "3px solid rgba(90,127,160,0.3)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        color: "#5A7FA0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Extensions
                    </p>
                    <ul style={{ listStyle: "disc", paddingLeft: "1.25rem" }} className="space-y-0.5">
                      {section.extensions.map((ext, j) => (
                        <li key={j} style={{ fontSize: "0.8rem", color: "#5A5A5A", lineHeight: 1.5 }}>
                          {ext}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
