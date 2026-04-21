/**
 * Shared card recipes for the dashboard surface. Both `/dashboard` (paid) and
 * the compass view use these so the two tiers read as the same app. This is
 * the "Option 3 hybrid" visual approved 2026-04-21 — each card keeps its own
 * tint/border character but all share one soft shadow and meet at a uniform
 * ~0.62 opacity for the neutral Lessons card.
 */
export const SHARED_SHADOW = "0 3px 14px rgba(11,46,74,0.06)";

/** Night-blue gradient hero used for the quota / lessons-this-month card. */
export const quotaHeroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(11,46,74,0.10), rgba(110,110,158,0.14))",
  border: "1px solid rgba(11,46,74,0.14)",
  borderRadius: "14px",
  padding: "1.1rem 1.2rem",
  boxShadow: SHARED_SHADOW,
};

/** Burgundy-tinted strip used for the archetype identity row. */
export const archetypeStripStyle: React.CSSProperties = {
  background: "rgba(130,40,75,0.09)",
  border: "1px solid rgba(130,40,75,0.18)",
  borderRadius: "10px",
  padding: "0.7rem 0.9rem",
  boxShadow: SHARED_SHADOW,
};

/** Lavender-tinted invite strip shown in place of archetype for users who
 *  haven't taken the quiz yet. */
export const archetypeInviteStyle: React.CSSProperties = {
  background: "rgba(110,110,158,0.09)",
  border: "1px solid rgba(110,110,158,0.22)",
  borderRadius: "10px",
  padding: "0.7rem 0.9rem",
  boxShadow: SHARED_SHADOW,
};

/** Neutral frost card — the workhorse body surface (lessons library, children
 *  list, calendar container). Softer opacity so the hue bleeds through. */
export const frostCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.62)",
  border: "1px solid rgba(255,255,255,0.55)",
  borderRadius: "12px",
  padding: "0.95rem 1rem",
  boxShadow: SHARED_SHADOW,
};

/** Dashed night-blue card used for upsell / "what you'd unlock" content. */
export const upsellCardStyle: React.CSSProperties = {
  background: "rgba(11,46,74,0.06)",
  border: "1px dashed rgba(11,46,74,0.24)",
  borderRadius: "12px",
  padding: "1rem 1.1rem",
  boxShadow: SHARED_SHADOW,
};

/** Small accent-gold "locked / upgrade" chip used next to actions. */
export const upgradeChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  fontSize: "0.62rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "0.2rem 0.5rem",
  borderRadius: "5px",
  background: "rgba(196,152,61,0.12)",
  color: "#B08A2E",
  border: "1px solid rgba(196,152,61,0.35)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};
