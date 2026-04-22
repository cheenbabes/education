"use client";

import { useEffect, useState } from "react";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { track } from "@/lib/analytics";
import {
  SAMPLE_CTA_COPY,
  SAMPLE_CTA_FLAG_KEY,
  resolveSampleCtaVariant,
} from "@/lib/compass/sample-cta-copy";

/**
 * Persistent bottom-of-viewport CTA bar for the sample lesson page. Appears
 * once the user scrolls past the header (~220px) so it doesn't obscure the
 * title on first paint, then stays visible as they read.
 *
 * Copy is driven by the `sample_cta_copy` feature flag (multivariate) so the
 * sticky bar stays in sync with the bottom CTA card — one user sees one
 * variant everywhere. The resolved variant is attached to every click event
 * as `copy_variant` so funnels can segment.
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
  const variantRaw = useFeatureFlagVariantKey(SAMPLE_CTA_FLAG_KEY);
  const variant = resolveSampleCtaVariant(variantRaw);
  const copy = SAMPLE_CTA_COPY[variant];

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
      copy_variant: variant,
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
