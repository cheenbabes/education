"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

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
 * Sticky bottom CTA. Fires compass_sample_cta_clicked and navigates to
 * /create with the philosophy pre-filled.
 */
export function SampleLessonCta({ philosophyId }: { philosophyId: string }) {
  const href = `/create?philosophy=${encodeURIComponent(philosophyId)}`;
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        marginLeft: "-1rem",
        marginRight: "-1rem",
        padding: "0.75rem 1rem 1.25rem",
        background: "linear-gradient(to top, var(--parchment) 75%, rgba(249,246,239,0.5))",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <a
        href={href}
        onClick={() => track("compass_sample_cta_clicked", { philosophy_id: philosophyId })}
        style={{
          background: "#0B2E4A",
          color: "#F9F6EF",
          borderRadius: "12px",
          padding: "0.85rem 1rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        Create one for your own child →
      </a>
      <p style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", textAlign: "center", margin: 0 }}>
        Pre-filled with your philosophy · 3 free lessons per month
      </p>
    </div>
  );
}
