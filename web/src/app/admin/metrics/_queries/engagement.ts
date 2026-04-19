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

  return {
    kpis: {
      completionRate: lessonCount > 0 ? Math.round((completed / lessonCount) * 100) : 0,
      avgStars: Number(avgStars.toFixed(2)),
      favoritesRate: lessonCount > 0 ? Math.round((favoriteCount / lessonCount) * 100) : 0,
      scheduledRate: lessonCount > 0 ? Math.round((Number(scheduledCount[0]?.n ?? BigInt(0)) / lessonCount) * 100) : 0,
    },
    dailyCompletions: dailyCompletions.map((r) => ({ day: toIso(r.day), value: Number(r.value) })),
    starDist: [1, 2, 3, 4, 5].map((s) => {
      const found = starDist.find((r) => r.stars === s);
      return { label: `${s}★`, value: found ? Number(found.count) : 0 };
    }),
    perUserBuckets: perUserBuckets.map((r) => ({ label: r.bucket, value: Number(r.users) })),
  };
}
