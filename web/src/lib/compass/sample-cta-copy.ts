/**
 * Canonical copy for the sample-lesson → create CTA.
 *
 * Previously a multivariate feature-flag experiment (`sample_cta_copy` with
 * `current` / `casual` / `value_forward` variants). The experiment is now
 * concluded — we standardized on one calm, on-brand variant matching the
 * Cormorant typography and the rest of the site. No more "kid" / "homeschooler"
 * informality, and the button copy aligns with the site-wide "Create a Lesson"
 * convention so the funnel reads as one coherent action.
 *
 * The same copy is used by both surfaces on the sample lesson page (sticky
 * bottom bar + bottom card), so what the user sees stays consistent as they
 * scroll.
 */

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

export const SAMPLE_CTA_COPY: SampleCtaCopy = {
  button: "Create a Lesson for my Teaching Style →",
  sub: "Pre-filled with your philosophy · free to try, no card required",
  stickyTitle: "Create a lesson in your teaching style",
  stickySub: "Free · about 90 seconds",
};
