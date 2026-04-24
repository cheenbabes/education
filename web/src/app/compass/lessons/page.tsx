import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { SAMPLE_LESSONS } from "@/lib/compass/sample-lessons";
import { PHILOSOPHIES, type PhilosophyId } from "@/lib/types";
import { PHILOSOPHY_COLORS, resolvePhilosophyKey } from "@/lib/compass/scoring";
import { LessonsGalleryTracker } from "./gallery-tracking";

export const metadata: Metadata = {
  title: "Sample Lessons · Sage's Compass",
  description:
    "See what a real homeschool lesson looks like in each of the eight teaching philosophies. Read a full sample, then create one tailored to your own child.",
};

const ORDER: PhilosophyId[] = [
  "charlotte-mason",
  "classical",
  "montessori-inspired",
  "waldorf-adjacent",
  "place-nature-based",
  "project-based-learning",
  "unschooling",
  "adaptive",
];

const PHILOSOPHY_DESCRIPTIONS: Record<PhilosophyId, string> = Object.fromEntries(
  PHILOSOPHIES.map((p) => [p.id, p.description]),
) as Record<PhilosophyId, string>;

function gradeLabel(grade: string): string {
  return grade === "K" ? "Kindergarten" : `Grade ${grade}`;
}

export default function SampleLessonsGalleryPage() {
  return (
    <Shell hue="results">
      <LessonsGalleryTracker />
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-3">
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
            Lessons for every teaching style
          </p>
          <h1
            className="font-cormorant-sc"
            style={{
              fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "0.02em",
            }}
          >
            See a real lesson in your style
          </h1>
          <p
            className="font-cormorant"
            style={{
              fontSize: "1.05rem",
              fontStyle: "italic",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Eight sample lessons — one per teaching philosophy — written for real
            homeschoolers. Read one in full, then create your own for your child.
          </p>

          <div className="pt-2">
            <Link
              href="/create"
              data-track="lessons_gallery_create_clicked"
              data-source="hero"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--night)",
                color: "var(--parchment)",
                borderRadius: "12px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create your own lesson &rarr;
            </Link>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-tertiary)",
                marginTop: "0.55rem",
                fontStyle: "italic",
              }}
            >
              Free to try — no card required.
            </p>
          </div>
        </header>

        {/* Gallery grid */}
        <section
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {ORDER.map((id) => {
            const lesson = SAMPLE_LESSONS[id];
            if (!lesson) return null;
            const philosophyKey = resolvePhilosophyKey(id);
            const accent = philosophyKey ? PHILOSOPHY_COLORS[philosophyKey] : "var(--accent-primary)";
            return (
              <Link
                key={id}
                href={`/compass/sample/${id}`}
                data-track="lessons_gallery_card_clicked"
                data-philosophy-id={id}
                className="group block transition-transform hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: "14px",
                  padding: "1.1rem 1.15rem",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.55rem",
                  height: "100%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: accent,
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: accent,
                      flexShrink: 0,
                    }}
                  />
                  {lesson.philosophyLabel}
                </div>

                <h2
                  className="font-cormorant-sc"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    margin: 0,
                    lineHeight: 1.25,
                    letterSpacing: "0.02em",
                  }}
                >
                  {lesson.title}
                </h2>

                {lesson.teaser && (
                  <p
                    style={{
                      fontSize: "0.82rem",
                      lineHeight: 1.5,
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    {lesson.teaser}
                  </p>
                )}

                <p
                  style={{
                    fontSize: "0.72rem",
                    fontStyle: "italic",
                    color: "var(--text-tertiary)",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {PHILOSOPHY_DESCRIPTIONS[id]}
                </p>

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    fontSize: "0.72rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <span>
                    {gradeLabel(lesson.grade)} · {lesson.subject}
                  </span>
                  <span
                    className="transition-transform group-hover:translate-x-0.5"
                    style={{ color: accent, fontWeight: 600 }}
                  >
                    Read &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        {/* Bottom CTA */}
        <section
          className="text-center space-y-3"
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "16px",
            padding: "1.75rem 1.5rem",
          }}
        >
          <h2
            className="font-cormorant-sc"
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Ready to build one for your own child?
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.55,
            }}
          >
            Pick the subject, philosophy, and your child&rsquo;s grade. We&rsquo;ll
            generate a complete lesson plan in about 90 seconds.
          </p>
          <div className="pt-1">
            <Link
              href="/create"
              data-track="lessons_gallery_create_clicked"
              data-source="bottom"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--night)",
                color: "var(--parchment)",
                borderRadius: "12px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create your own lesson &rarr;
            </Link>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", margin: 0 }}>
            Haven&rsquo;t found your style yet?{" "}
            <Link
              href="/compass/quiz"
              style={{ color: "var(--accent-primary)", textDecoration: "underline" }}
            >
              Take the free Sage&rsquo;s Compass quiz
            </Link>
            .
          </p>
        </section>
      </div>
    </Shell>
  );
}
