import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadQuality(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];

  const [feedbackDaily, feedbackTotals, lowRated, recentFeedback, dedup] = await Promise.all([
    prisma.$queryRawUnsafe<{ day: Date; category: string; count: bigint }[]>(
      `SELECT date_trunc('day', "createdAt")::date AS day, category, COUNT(*)::bigint AS count
         FROM "Feedback" ${start ? `WHERE "createdAt" >= $1` : ``}
         GROUP BY 1, 2 ORDER BY 1`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ category: string; count: bigint }[]>(
      `SELECT category, COUNT(*)::bigint AS count FROM "Feedback"
         ${start ? `WHERE "createdAt" >= $1` : ``}
         GROUP BY category`,
      ...args,
    ),
    prisma.$queryRawUnsafe<
      { lesson_title: string; child_id: string; stars: number; notes: string | null; completed_at: Date }[]
    >(
      `SELECT l.title AS lesson_title, c."childId" AS child_id, c."starRating" AS stars, c.notes, c."completedAt" AS completed_at
         FROM "Completion" c JOIN "Lesson" l ON l.id = c."lessonId"
         WHERE c."starRating" <= 2 ${start ? `AND c."completedAt" >= $1` : ``}
         ORDER BY c."completedAt" DESC LIMIT 20`,
      ...args,
    ),
    prisma.$queryRawUnsafe<
      { email: string; category: string; message: string; created_at: Date }[]
    >(
      `SELECT email, category, message, "createdAt" AS created_at FROM "Feedback"
         ORDER BY "createdAt" DESC LIMIT 20`,
    ),
    prisma.$queryRawUnsafe<{ total: bigint; distinct_hashes: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total, COUNT(DISTINCT "contentHash")::bigint AS distinct_hashes
         FROM "Lesson" ${start ? `WHERE "createdAt" >= $1` : ``}`,
      ...args,
    ),
  ]);

  const d = dedup[0] ?? { total: BigInt(0), distinct_hashes: BigInt(0) };
  const total = Number(d.total);
  const distinctHashes = Number(d.distinct_hashes);
  const dupes = total - distinctHashes;
  const dedupPct = total > 0 ? Math.round((dupes / total) * 100) : 0;

  // Pivot feedback-daily into chart series
  const byDay = new Map<string, { day: string; bug: number; feature: number; general: number }>();
  for (const r of feedbackDaily) {
    const key = toIso(r.day);
    const row = byDay.get(key) ?? { day: key, bug: 0, feature: 0, general: 0 };
    if (r.category === "bug") row.bug = Number(r.count);
    else if (r.category === "feature") row.feature = Number(r.count);
    else row.general = Number(r.count);
    byDay.set(key, row);
  }

  return {
    kpis: {
      lowRatedCount: lowRated.length,
      totalFeedback: feedbackTotals.reduce((s, r) => s + Number(r.count), 0),
      dedupPct,
      dupes,
    },
    feedbackByDay: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    lowRated: lowRated.map((r) => ({
      lesson: r.lesson_title,
      stars: r.stars,
      notes: r.notes ?? "—",
      when: toIso(r.completed_at),
    })),
    recentFeedback: recentFeedback.map((r) => ({
      email: r.email,
      category: r.category,
      message: r.message.slice(0, 120) + (r.message.length > 120 ? "…" : ""),
      when: toIso(r.created_at),
    })),
  };
}
