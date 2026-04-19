export type Range = "7d" | "30d" | "90d" | "all";

export const RANGES: Range[] = ["7d", "30d", "90d", "all"];

export function parseRange(v: string | undefined): Range {
  if (v === "7d" || v === "30d" || v === "90d" || v === "all") return v;
  return "30d";
}

export function rangeStart(r: Range): Date | null {
  if (r === "all") return null;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[r];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function rangeLabel(r: Range): string {
  return { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", all: "All time" }[r];
}
