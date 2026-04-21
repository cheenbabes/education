import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SAMPLE_LESSONS } from "@/lib/compass/sample-lessons";
import { PHILOSOPHIES, type PhilosophyId } from "@/lib/types";
import { SampleLessonViewTracker, SampleLessonCta } from "./sample-lesson-tracking";

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

export default function SampleLessonPage({ params }: Params) {
  if (!VALID_IDS.has(params.philosophy as PhilosophyId)) notFound();
  const lesson = SAMPLE_LESSONS[params.philosophy as PhilosophyId];

  return (
    <div
      className="watercolor-page hue-results"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Minimal in-page header (the Shell chrome is skipped for focus) */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(249,246,239,0.82)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          href="/compass/results"
          style={{
            color: "var(--accent-primary)",
            fontSize: "0.82rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          ‹ Back to results
        </Link>
        <span
          className="font-cormorant-sc"
          style={{
            fontSize: "0.82rem",
            color: "var(--night)",
            letterSpacing: "0.06em",
          }}
        >
          The Sage&rsquo;s Compass
        </span>
      </header>

      <main
        style={{
          maxWidth: "560px",
          width: "100%",
          margin: "0 auto",
          padding: "1rem 1rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          flex: 1,
        }}
      >
        <SampleLessonViewTracker philosophyId={lesson.philosophyId} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", padding: "0.25rem 0 0.5rem" }}>
          <p
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
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
              fontSize: "1.7rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: "0.1rem 0 0.4rem",
              lineHeight: 1.2,
              letterSpacing: "0.02em",
            }}
          >
            {lesson.title}
          </h1>
          {lesson.teaser && (
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: "0 0 0.4rem", lineHeight: 1.55 }}>
              {lesson.teaser}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "5px",
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
                fontSize: "0.68rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "5px",
                background: "rgba(255,255,255,0.7)",
                color: "var(--text-tertiary)",
                border: "1px solid rgba(0,0,0,0.06)",
                fontWeight: 500,
              }}
            >
              {lesson.grade === "K" ? "Kindergarten" : `Grade ${lesson.grade}`} · {lesson.subject}
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "5px",
                background: "rgba(255,255,255,0.7)",
                color: "var(--text-tertiary)",
                border: "1px solid rgba(0,0,0,0.06)",
                fontWeight: 500,
              }}
            >
              {(() => {
                const total = lesson.sections.reduce((n, s) => n + (s.durationMinutes ?? 0), 0);
                return total > 0 ? `~${total} min` : "~45 min";
              })()}
            </span>
          </div>
          {lesson.theme && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", margin: "0.2rem 0 0", fontStyle: "italic" }}>
              Theme: {lesson.theme}
            </p>
          )}
        </div>

        {lesson.sections.map((section, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(255,255,255,0.78)",
              borderRadius: "12px",
              padding: "0.95rem 1rem",
              borderLeft: "3px solid #82284b",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
              <p
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#82284b",
                  margin: 0,
                }}
              >
                {section.type}
              </p>
              {section.durationMinutes !== undefined && (
                <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>
                  {section.durationMinutes} min
                </span>
              )}
            </div>
            <h3
              className="font-cormorant-sc"
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {section.title}
            </h3>
            {section.instructions.split(/\n\n+/).map((para, pIdx) => (
              <p
                key={pIdx}
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {para}
              </p>
            ))}
            {section.tips && section.tips.length > 0 && (
              <div style={{ marginTop: "0.3rem", padding: "0.5rem 0.6rem", background: "rgba(196,152,61,0.08)", borderRadius: "8px" }}>
                {section.tips.map((tip, tIdx) => (
                  <p key={tIdx} style={{ fontSize: "0.74rem", color: "var(--text-secondary)", margin: tIdx > 0 ? "0.3rem 0 0" : 0, lineHeight: 1.5 }}>
                    <span style={{ color: "#C4983D", fontWeight: 700, marginRight: "0.3rem" }}>Tip:</span>{tip}
                  </p>
                ))}
              </div>
            )}
            {section.philosophyConnection && (
              <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", margin: "0.25rem 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
                {section.philosophyConnection}
              </p>
            )}
          </div>
        ))}

        {lesson.standards && lesson.standards.length > 0 && (
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", padding: "0.3rem 0 0.5rem" }}>
            {lesson.standards.map((code) => (
              <span
                key={code}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.65rem",
                  padding: "0.18rem 0.45rem",
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
      </main>
    </div>
  );
}
