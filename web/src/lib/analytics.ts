import posthog from "posthog-js";

/**
 * Canonical event names. Keep these stable — dashboards / funnels key off them.
 * Group by flow with a prefix so PostHog autocomplete stays useful.
 */
export type AnalyticsEvent =
  // Compass quiz funnel
  | "compass_quiz_started"
  | "compass_part1_completed"
  | "compass_gate_shown"
  | "compass_gate_signup_clicked"
  | "compass_gate_signin_clicked"
  | "compass_part2_started"
  | "compass_part2_completed"
  | "compass_results_viewed"
  | "compass_results_create_clicked"
  // Lesson creation + engagement
  | "lesson_create_viewed"
  | "lesson_create_started"
  | "lesson_create_succeeded"
  | "lesson_create_failed"
  | "lesson_completion_recorded"
  | "paywall_hit"
  // Monetization
  | "pricing_viewed"
  | "checkout_started"
  | "checkout_completed"
  // Acquisition / onboarding
  | "signup_completed"
  | "homepage_primary_cta_clicked"
  | "child_added"
  // Pricing discoverability
  | "nav_pricing_clicked"
  | "nav_upgrade_clicked"
  | "paywall_cta_clicked";

type EventProps = Record<string, string | number | boolean | null | undefined | string[]>;

/**
 * Capture a named event. No-ops if PostHog isn't initialized (SSR, missing key,
 * adblock). Failures are swallowed so analytics can never break the UI.
 */
export function track(event: AnalyticsEvent, props?: EventProps): void {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    /* never let analytics break the app */
  }
}
