"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { SAMPLE_CTA_COPY } from "@/lib/compass/sample-cta-copy";

/**
 * Fires compass_sample_lesson_viewed once on mount. Rendered as a zero-height
 * client component inside the otherwise-server-rendered sample lesson page.
 */
export function SampleLessonViewTracker({ philosophyId }: { philosophyId: string }) {
  useEffect(() => {
    track("compass_sample_lesson_viewed", { philosophy_id: philosophyId });
  }, [philosophyId]);
  return null;
}

/**
 * Bottom CTA for the sample lesson. Fires compass_sample_cta_clicked and
 * navigates to /create with the philosophy pre-filled. Rendered inline at
 * the end of the lesson content — plays well at both mobile and desktop
 * widths without stickiness quirks.
 *
 * Copy is now a single canonical variant — the prior `sample_cta_copy`
 * multivariate experiment has been concluded and the winning copy lives in
 * `lib/compass/sample-cta-copy.ts`. The same copy is used by the sticky
 * bar so the user sees one consistent action everywhere.
 */
export function SampleLessonCta({
  philosophyId,
  secondary,
  subject,
}: {
  philosophyId: string;
  secondary?: string;
  subject?: string;
}) {
  const copy = SAMPLE_CTA_COPY;

  const params = new URLSearchParams({ philosophy: philosophyId });
  if (secondary) params.set("secondary", secondary);
  if (subject) params.set("subject", subject);
  const href = `/create?${params.toString()}`;
  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem 1.1rem 1.1rem",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.5)",
        borderRadius: "14px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        textAlign: "center",
      }}
    >
      <a
        href={href}
        onClick={() =>
          track("compass_sample_cta_clicked", {
            philosophy_id: philosophyId,
            secondary: secondary ?? null,
            subject: subject ?? null,
            source: "sample_page_bottom_cta",
          })
        }
        style={{
          background: "#0B2E4A",
          color: "#F9F6EF",
          borderRadius: "12px",
          padding: "0.85rem 1rem",
          fontSize: "0.95rem",
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        {copy.button}
      </a>
      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>
        {copy.sub}
      </p>
    </div>
  );
}
