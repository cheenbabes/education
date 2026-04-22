import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadEngagement(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];

  const [lessonCount, completionAgg, favoriteCount, scheduledCount] = await Promise.all([
    prisma.lesson.count(start ? { where: { createdAt: { gte: start } } } : undefined),
    prisma.$queryRawUnsafe<
      { total: bigint; avg_stars: number | null }[]
    >(
      `SELECT COUNT(*)::bigint AS total, AVG("starRating")::float AS avg_stars
         FROM "Completion" ${start ? `WHERE "completedAt" >= $1` : ``}`,
      ...args,
    ),
    prisma.lesson.count({
      where: start ? { favorite: true, createdAt: { gte: start } } : { favorite: true },
    }),
    prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT COUNT(DISTINCT "lessonId")::bigint AS n FROM "CalendarEntry" c
         JOIN "Lesson" l ON l.id = c."lessonId"
         ${start ? `WHERE l."createdAt" >= $1` : ``}`,
      ...args,
    ),
  ]);

  const completed = Number(completionAgg[0]?.total ?? BigInt(0));
  const avgStars = completionAgg[0]?.avg_stars ?? 0;

  const dailyCompletions = await prisma.$queryRawUnsafe<{ day: Date; value: bigint }[]>(
    `SELECT date_trunc('day', "completedAt")::date AS day, COUNT(*)::bigint AS value
       FROM "Completion" ${start ? `WHERE "completedAt" >= $1` : ``}
       GROUP BY 1 ORDER BY 1`,
    ...args,
  );

  const starDist = await prisma.$queryRawUnsafe<{ stars: number; count: bigint }[]>(
    `SELECT "starRating" AS stars, COUNT(*)::bigint AS count
       FROM "Completion" ${start ? `WHERE "completedAt" >= $1` : ``}
       GROUP BY 1 ORDER BY 1`,
    ...args,
  );

  const perUserBuckets = await prisma.$queryRawUnsafe<{ bucket: string; sort: number; users: bigint }[]>(
    `WITH counts AS (
       SELECT "userId", COUNT(*)::int AS n FROM "Lesson"
         ${start ? `WHERE "createdAt" >= $1` : ``} GROUP BY "userId"
     ),
     bucketed AS (
       SELECT CASE
                WHEN n = 1 THEN '1'
                WHEN n BETWEEN 2 AND 3 THEN '2-3'
                WHEN n BETWEEN 4 AND 6 THEN '4-6'
                WHEN n BETWEEN 7 AND 15 THEN '7-15'
                ELSE '16+'
              END AS bucket,
              CASE
                WHEN n = 1 THEN 1
                WHEN n BETWEEN 2 AND 3 THEN 2
                WHEN n BETWEEN 4 AND 6 THEN 3
                WHEN n BETWEEN 7 AND 15 THEN 4
                ELSE 5
              END AS sort
       FROM counts
     )
     SELECT bucket, MIN(sort)::int AS sort, COUNT(*)::bigint AS users
       FROM bucketed GROUP BY bucket ORDER BY MIN(sort)`,
    ...args,
  );

  // Lifecycle: time from signup to first lesson, and from lesson creation to
  // first completion. Uses percentile_cont for a continuous median so a small
  // sample doesn't produce integer-only estimates.
  const [firstLessonStats, firstCompletionStats, activationStats] = await Promise.all([
    prisma.$queryRawUnsafe<{
      median_hours: number | null;
      p90_hours: number | null;
      n: bigint;
    }[]>(
      `WITH first_lesson AS (
         SELECT "userId", MIN("createdAt") AS first_at
           FROM "Lesson" GROUP BY "userId"
       )
       SELECT
         percentile_cont(0.5) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (fl.first_at - u."createdAt"))/3600
         )::float AS median_hours,
         percentile_cont(0.9) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (fl.first_at - u."createdAt"))/3600
         )::float AS p90_hours,
         COUNT(*)::bigint AS n
       FROM "User" u
       JOIN first_lesson fl ON fl."userId" = u.id
       WHERE fl.first_at >= u."createdAt"
         ${start ? `AND u."createdAt" >= $1` : ``}`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ median_hours: number | null; n: bigint }[]>(
      `WITH first_completion AS (
         SELECT "lessonId", MIN("completedAt") AS first_at
           FROM "Completion" GROUP BY "lessonId"
       )
       SELECT
         percentile_cont(0.5) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (fc.first_at - l."createdAt"))/3600
         )::float AS median_hours,
         COUNT(*)::bigint AS n
       FROM "Lesson" l
       JOIN first_completion fc ON fc."lessonId" = l.id
       WHERE fc.first_at >= l."createdAt"
         ${start ? `AND l."createdAt" >= $1` : ``}`,
      ...args,
    ),
    // Activation = users who created at least 2 lessons / users who created at
    // least 1. Honors the selected range for new-cohort analysis.
    prisma.$queryRawUnsafe<{ with_one: bigint; with_two: bigint }[]>(
      `WITH counts AS (
         SELECT "userId", COUNT(*)::int AS n FROM "Lesson"
           ${start ? `WHERE "createdAt" >= $1` : ``} GROUP BY "userId"
       )
       SELECT
         COUNT(*) FILTER (WHERE n >= 1)::bigint AS with_one,
         COUNT(*) FILTER (WHERE n >= 2)::bigint AS with_two
         FROM counts`,
      ...args,
    ),
  ]);

  const fl = firstLessonStats[0] ?? { median_hours: null, p90_hours: null, n: BigInt(0) };
  const fc = firstCompletionStats[0] ?? { median_hours: null, n: BigInt(0) };
  const act = activationStats[0] ?? { with_one: BigInt(0), with_two: BigInt(0) };
  const one = Number(act.with_one);
  const two = Number(act.with_two);

  return {
    kpis: {
      completionRate: lessonCount > 0 ? Math.round((completed / lessonCount) * 100) : 0,
      avgStars: Number(avgStars.toFixed(2)),
      favoritesRate: lessonCount > 0 ? Math.round((favoriteCount / lessonCount) * 100) : 0,
      scheduledRate: lessonCount > 0 ? Math.round((Number(scheduledCount[0]?.n ?? BigInt(0)) / lessonCount) * 100) : 0,
      timeToFirstLesson: fmtHours(fl.median_hours),
      timeToFirstLessonP90: fmtHours(fl.p90_hours),
      timeToFirstLessonN: Number(fl.n),
      timeToFirstCompletion: fmtHours(fc.median_hours),
      timeToFirstCompletionN: Number(fc.n),
      activationRate: one > 0 ? Math.round((two / one) * 100) : 0,
      activatedUsers: two,
      oneLessonUsers: one,
    },
    dailyCompletions: dailyCompletions.map((r) => ({ day: toIso(r.day), value: Number(r.value) })),
    starDist: [1, 2, 3, 4, 5].map((s) => {
      const found = starDist.find((r) => r.stars === s);
      return { label: `${s}★`, value: found ? Number(found.count) : 0 };
    }),
    perUserBuckets: perUserBuckets.map((r) => ({ label: r.bucket, value: Number(r.users) })),
  };
}

function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined || Number.isNaN(h)) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
