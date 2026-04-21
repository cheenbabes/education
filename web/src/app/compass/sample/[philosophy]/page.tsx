import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { SAMPLE_LESSONS } from "@/lib/compass/sample-lessons";
import { PHILOSOPHIES, type PhilosophyId } from "@/lib/types";
import { SampleLessonViewTracker, SampleLessonCta } from "./sample-lesson-tracking";
import { LessonSectionsDisplay } from "@/components/lesson-sections-display";
import { PHILOSOPHY_COLORS, resolvePhilosophyKey } from "@/lib/compass/scoring";

const VALID_IDS = new Set(PHILOSOPHIES.map((p) => p.id));

interface Params {
  params: { philosophy: string };
}

export function generateMetadata({ params }: Params): Metadata {
  if (!VALID_IDS.has(params.philosophy as PhilosophyId)) return {};
  const lesson = SAMPLE_LESSONS[params.philosophy as PhilosophyId];
  return {
    title: `${lesson.title} · ${lesson.philosophyLabel} sample lesson · Sage's Compass`,
    description: `A sample ${lesson.philosophyLabel} lesson for ${lesson.grade === "K" ? "Kindergarten" : `Grade ${lesson.grade}`} — ${lesson.subject}. See what a lesson in this style looks like before creating your own.`,
  };
}

const pillBase: React.CSSProperties = {
  fontSize: "0.72rem",
  padding: "0.22rem 0.6rem",
  borderRadius: "6px",
  fontWeight: 500,
};

export default function SampleLessonPage({ params }: Params) {
  if (!VALID_IDS.has(params.philosophy as PhilosophyId)) notFound();
  const lesson = SAMPLE_LESSONS[params.philosophy as PhilosophyId];
  const totalMin = lesson.sections.reduce((n, s) => n + (s.duration_minutes ?? 0), 0);

  return (
    <Shell hue="results">
      {/* Keep the reading column ~3xl wide for comfortable line length on desktop
          while the Shell <main> provides the responsive side padding. */}
      <div className="mx-auto max-w-3xl space-y-6">
        <SampleLessonViewTracker philosophyId={lesson.philosophyId} />

        <Link
          href="/compass/results"
          className="inline-flex items-center text-sm hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          ‹ Back to results
        </Link>

        <header className="space-y-2">
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              margin: 0,
            }}
          >
            Sample lesson
          </p>
          <h1
            className="font-cormorant-sc"
            style={{
              fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "0.02em",
            }}
          >
            {lesson.title}
          </h1>
          {lesson.teaser && (
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55, maxWidth: "52ch" }}>
              {lesson.teaser}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span
              style={{
                ...pillBase,
                background: "rgba(176,122,138,0.15)",
                color: "#82284b",
                border: "1px solid rgba(176,122,138,0.3)",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {lesson.philosophyLabel}
            </span>
            <span
              style={{
                ...pillBase,
                background: "rgba(255,255,255,0.7)",
                color: "var(--text-tertiary)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {lesson.grade === "K" ? "Kindergarten" : `Grade ${lesson.grade}`} · {lesson.subject}
            </span>
            <span
              style={{
                ...pillBase,
                background: "rgba(255,255,255,0.7)",
                color: "var(--text-tertiary)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              ~{totalMin > 0 ? totalMin : 45} min
            </span>
          </div>
          {lesson.theme && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", margin: "0.25rem 0 0", fontStyle: "italic" }}>
              Theme: {lesson.theme}
            </p>
          )}
        </header>

        <LessonSectionsDisplay
          sections={lesson.sections}
          philosophyColor={PHILOSOPHY_COLORS[resolvePhilosophyKey(lesson.philosophyId)] ?? "#6E6E9E"}
          initialAllOpen
        />

        {lesson.standards && lesson.standards.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {lesson.standards.map((code) => (
              <span
                key={code}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.68rem",
                  padding: "0.18rem 0.5rem",
                  background: "rgba(110,110,158,0.1)",
                  color: "var(--accent-primary)",
                  borderRadius: "4px",
                  border: "1px solid rgba(110,110,158,0.2)",
                }}
              >
                {code}
              </span>
            ))}
          </div>
        )}

        <SampleLessonCta philosophyId={lesson.philosophyId} />
      </div>
    </Shell>
  );
}
