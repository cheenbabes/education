import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadQuality(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];

  const [feedbackDaily, feedbackTotals, lowRated, recentFeedback, dedup, collisions] = await Promise.all([
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
      { lesson_id: string; lesson_title: string; child_id: string; stars: number; notes: string | null; completed_at: Date }[]
    >(
      `SELECT l.id AS lesson_id, l.title AS lesson_title, c."childId" AS child_id, c."starRating" AS stars, c.notes, c."completedAt" AS completed_at
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
    // contentHash collisions — same JSON produced twice. Almost always an
    // accidental retry or a stuck prompt. Surfaces the top colliding hashes
    // with a sample lesson id so admin can inspect.
    prisma.$queryRawUnsafe<{ hash: string; n: bigint; sample_id: string; first_seen: Date; last_seen: Date }[]>(
      `SELECT "contentHash" AS hash,
              COUNT(*)::bigint AS n,
              (array_agg(id ORDER BY "createdAt"))[1] AS sample_id,
              MIN("createdAt") AS first_seen,
              MAX("createdAt") AS last_seen
         FROM "Lesson"
         ${start ? `WHERE "createdAt" >= $1` : ``}
         GROUP BY "contentHash"
         HAVING COUNT(*) > 1
         ORDER BY n DESC, MAX("createdAt") DESC
         LIMIT 10`,
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
      id: r.lesson_id,
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
    collisions: collisions.map((r) => ({
      hash: r.hash.slice(0, 12),
      count: Number(r.n),
      id: r.sample_id,
      first: toIso(r.first_seen),
      last: toIso(r.last_seen),
    })),
  };
}
