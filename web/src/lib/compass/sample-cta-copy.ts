/**
 * Copy variants for the sample-lesson → create CTA.
 *
 * Served by the PostHog feature flag `sample_cta_copy` (multivariate). All
 * three call-to-action surfaces on the sample lesson page (sticky bottom bar
 * + bottom card) read from the same variant so one user sees one copy
 * everywhere.
 *
 * The variant is fired as a `copy_variant` prop on every
 * `compass_sample_cta_clicked` event so funnels can segment by variant.
 */

export const SAMPLE_CTA_FLAG_KEY = "sample_cta_copy" as const;

export type SampleCtaVariant = "current" | "casual" | "value_forward";

export interface SampleCtaCopy {
  /** Primary button label on bottom card + short label on sticky bar. */
  button: string;
  /** Sub-label shown under the bottom card button. */
  sub: string;
  /** Heading text on the sticky bar. Short — must fit alongside a button on mobile. */
  stickyTitle: string;
  /** Sub text on the sticky bar. Shorter than `sub`. */
  stickySub: string;
}

export const SAMPLE_CTA_COPY: Record<SampleCtaVariant, SampleCtaCopy> = {
  current: {
    button: "Create one for your own child →",
    sub: "Pre-filled with your philosophy · 3 free lessons per month",
    stickyTitle: "Make this kind of lesson for your child",
    stickySub: "Free · 90 seconds",
  },
  casual: {
    button: "I want one like this for my kid",
    sub: "Free · takes 90 seconds · no credit card",
    stickyTitle: "Want one like this for your kid?",
    stickySub: "Free · 90 seconds",
  },
  value_forward: {
    button: "Generate my child's version — free",
    sub: "Any subject · any grade · pre-filled from your quiz",
    stickyTitle: "Generate your child's version — free",
    stickySub: "Pre-filled from your quiz",
  },
};

/**
 * Resolve a raw feature-flag value into a known variant, defaulting to
 * `current` (the control) for: flag not loaded yet, flag off, unknown key.
 */
export function resolveSampleCtaVariant(raw: unknown): SampleCtaVariant {
  if (typeof raw !== "string") return "current";
  if (raw === "casual" || raw === "value_forward" || raw === "current") return raw;
  return "current";
}
