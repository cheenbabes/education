/**
 * Shared UI helpers for the /standards pages. Keeps compass-tier and paid-tier
 * views rendering subject chips in matching colors without duplicating tables.
 */

const SUBJECT_CODE_COLORS: Record<string, { bg: string; color: string }> = {
  math: { bg: "rgba(37,99,235,0.1)", color: "#2563EB" },
  ela: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  english: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  language: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  literacy: { bg: "rgba(124,58,237,0.1)", color: "#7C3AED" },
  science: { bg: "rgba(5,150,105,0.1)", color: "#059669" },
  social: { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
  history: { bg: "rgba(217,119,6,0.1)", color: "#D97706" },
};

/**
 * Returns `{ bg, color }` for the subject-color code pill used on standard
 * rows. Falls back to a neutral lavender when the subject isn't recognised.
 */
export function subjectTone(subject?: string | null): { bg: string; color: string } {
  if (!subject) return { bg: "rgba(110,110,158,0.1)", color: "#6E6E9E" };
  const key = subject.toLowerCase();
  for (const [match, tone] of Object.entries(SUBJECT_CODE_COLORS)) {
    if (key.includes(match)) return tone;
  }
  return { bg: "rgba(110,110,158,0.1)", color: "#6E6E9E" };
}
