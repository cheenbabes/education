export type Range = "today" | "7d" | "30d" | "90d" | "all";

export const RANGES: Range[] = ["today", "7d", "30d", "90d", "all"];

export function parseRange(v: string | undefined): Range {
  if (v === "today" || v === "7d" || v === "30d" || v === "90d" || v === "all") return v;
  return "30d";
}

export function rangeStart(r: Range): Date | null {
  if (r === "all") return null;
  const d = new Date();
  if (r === "today") {
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  const days = { "7d": 7, "30d": 30, "90d": 90 }[r];
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function rangeLabel(r: Range): string {
  return {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    all: "All time",
  }[r];
}
