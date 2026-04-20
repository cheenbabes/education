export type Range = "today" | "7d" | "30d" | "90d" | "all";

export const RANGES: Range[] = ["today", "7d", "30d", "90d", "all"];

// All day boundaries are anchored to America/New_York (EST/EDT) so
// "today" matches what a human on the East Coast sees.
const ANALYTICS_TZ = "America/New_York";

export function parseRange(v: string | undefined): Range {
  if (v === "today" || v === "7d" || v === "30d" || v === "90d" || v === "all") return v;
  return "30d";
}

export function rangeStart(r: Range): Date | null {
  if (r === "all") return null;
  const days = r === "today" ? 0 : { "7d": 7, "30d": 30, "90d": 90 }[r];
  return startOfDayInTZDaysAgo(ANALYTICS_TZ, days);
}

export function rangeLabel(r: Range): string {
  return {
    today: "Today (ET)",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    all: "All time",
  }[r];
}

// Returns the UTC Date that corresponds to "00:00 in `tz` on (today - daysAgo)".
// Works across DST transitions by probing the zone offset at a safe hour (noon UTC).
function startOfDayInTZDaysAgo(tz: string, daysAgo: number): Date {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(ymd.find((p) => p.type === "year")!.value);
  const m = Number(ymd.find((p) => p.type === "month")!.value);
  const d = Number(ymd.find((p) => p.type === "day")!.value) - daysAgo;

  // Use noon UTC on the target date to avoid DST ambiguity (no missing/doubled hours),
  // then subtract however many hours that represents in `tz` to land on local midnight.
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const hourInTz = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hourCycle: "h23",
    }).format(utcNoon),
  );
  return new Date(utcNoon.getTime() - hourInTz * 60 * 60 * 1000);
}
