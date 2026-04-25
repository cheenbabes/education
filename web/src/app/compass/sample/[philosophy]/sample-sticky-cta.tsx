"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { SAMPLE_CTA_COPY } from "@/lib/compass/sample-cta-copy";

/**
 * Persistent bottom-of-viewport CTA bar for the sample lesson page. Appears
 * once the user scrolls past the header (~220px) so it doesn't obscure the
 * title on first paint, then stays visible as they read.
 *
 * Copy is now a single canonical variant (the prior `sample_cta_copy`
 * multivariate experiment has shipped its winner — see
 * `lib/compass/sample-cta-copy.ts`). The sticky bar and bottom card share
 * the same text so users see one consistent action.
 */
export function SampleStickyCta({
  philosophyId,
  secondary,
  subject,
}: {
  philosophyId: string;
  secondary?: string;
  subject?: string;
}) {
  const copy = SAMPLE_CTA_COPY;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const threshold = 220;
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const params = new URLSearchParams({ philosophy: philosophyId });
  if (secondary) params.set("secondary", secondary);
  if (subject) params.set("subject", subject);
  const href = `/create?${params.toString()}`;

  const onClick = () => {
    track("compass_sample_cta_clicked", {
      philosophy_id: philosophyId,
      secondary: secondary ?? null,
      subject: subject ?? null,
      source: "sample_sticky_bar",
    });
  };

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "0.7rem 1rem 0.85rem",
        background: "rgba(11, 46, 74, 0.96)",
        color: "#F9F6EF",
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.2s ease-out",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 50,
        maxWidth: "100%",
        /* Respect iOS safe area */
        paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div style={{ flex: 1, fontSize: "0.8rem", lineHeight: 1.3, minWidth: 0 }}>
        <strong
          style={{
            display: "block",
            fontWeight: 600,
            color: "#F9F6EF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {copy.stickyTitle}
        </strong>
        <span style={{ color: "rgba(249,246,239,0.65)", fontSize: "0.7rem" }}>
          {copy.stickySub}
        </span>
      </div>
      <a
        href={href}
        onClick={onClick}
        style={{
          background: "#C4983D",
          color: "#0B2E4A",
          padding: "0.6rem 0.95rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          borderRadius: "8px",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Create →
      </a>
    </div>
  );
}
