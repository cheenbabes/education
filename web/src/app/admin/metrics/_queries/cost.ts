import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadCost(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];
  const lessonWhere = start ? `WHERE "createdAt" >= $1` : ``;
  const wsWhere = start ? `WHERE "createdAt" >= $1` : ``;

  const dailySpend = await prisma.$queryRawUnsafe<
    { day: Date; lesson_cost: number; worksheet_cost: number }[]
  >(
    `SELECT day,
            COALESCE(SUM(CASE WHEN kind='lesson' THEN cost END), 0)::float AS lesson_cost,
            COALESCE(SUM(CASE WHEN kind='worksheet' THEN cost END), 0)::float AS worksheet_cost
     FROM (
       SELECT date_trunc('day', "createdAt")::date AS day, "generationCostUsd" AS cost, 'lesson' AS kind
       FROM "Lesson" WHERE "generationCostUsd" IS NOT NULL ${start ? `AND "createdAt" >= $1` : ``}
       UNION ALL
       SELECT date_trunc('day', "createdAt")::date, "costUsd", 'worksheet'
       FROM "Worksheet" WHERE "costUsd" IS NOT NULL ${start ? `AND "createdAt" >= $1` : ``}
     ) x
     GROUP BY 1 ORDER BY 1`,
    ...args,
  );

  const agg = await prisma.$queryRawUnsafe<
    { kind: string; total: number; cnt: bigint }[]
  >(
    `SELECT 'lesson' AS kind, COALESCE(SUM("generationCostUsd"),0)::float AS total, COUNT("generationCostUsd")::bigint AS cnt
       FROM "Lesson" ${lessonWhere}
     UNION ALL
     SELECT 'worksheet', COALESCE(SUM("costUsd"),0)::float, COUNT("costUsd")::bigint
       FROM "Worksheet" ${wsWhere}`,
    ...args,
  );

  const activeUsersRow = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(DISTINCT "userId")::bigint AS n FROM "Lesson" ${lessonWhere}`,
    ...args,
  );

  const topUsers = await prisma.$queryRawUnsafe<
    { email: string; lesson_count: bigint; worksheet_count: bigint; total_cost: number }[]
  >(
    `WITH costs AS (
       SELECT "userId",
              COALESCE(SUM("generationCostUsd"),0)::float AS total,
              COUNT("generationCostUsd")::bigint AS n_lessons,
              0::bigint AS n_worksheets
         FROM "Lesson" WHERE "generationCostUsd" IS NOT NULL ${start ? `AND "createdAt" >= $1` : ``}
         GROUP BY "userId"
       UNION ALL
       SELECT "userId",
              COALESCE(SUM("costUsd"),0)::float,
              0::bigint,
              COUNT("costUsd")::bigint
         FROM "Worksheet" WHERE "costUsd" IS NOT NULL ${start ? `AND "createdAt" >= $1` : ``}
         GROUP BY "userId"
     )
     SELECT u.email,
            SUM(c.n_lessons)::bigint AS lesson_count,
            SUM(c.n_worksheets)::bigint AS worksheet_count,
            SUM(c.total)::float AS total_cost
     FROM costs c JOIN "User" u ON u.id = c."userId"
     GROUP BY u.id, u.email
     ORDER BY total_cost DESC
     LIMIT 10`,
    ...args,
  );

  const lessonAgg = agg.find((a) => a.kind === "lesson") ?? { total: 0, cnt: BigInt(0) };
  const wsAgg = agg.find((a) => a.kind === "worksheet") ?? { total: 0, cnt: BigInt(0) };
  const lessonCount = Number(lessonAgg.cnt);
  const wsCount = Number(wsAgg.cnt);
  const totalSpend = lessonAgg.total + wsAgg.total;
  const activeUsers = Number(activeUsersRow[0]?.n ?? BigInt(0));

  return {
    kpis: {
      totalSpend,
      avgPerLesson: lessonCount > 0 ? lessonAgg.total / lessonCount : 0,
      avgPerWorksheet: wsCount > 0 ? wsAgg.total / wsCount : 0,
      costPerActiveUser: activeUsers > 0 ? totalSpend / activeUsers : 0,
    },
    dailySpend: dailySpend.map((r) => ({
      day: toIso(r.day),
      lesson: r.lesson_cost,
      worksheet: r.worksheet_cost,
    })),
    topUsers: topUsers.map((r) => ({
      email: r.email,
      lessons: Number(r.lesson_count),
      worksheets: Number(r.worksheet_count),
      total: r.total_cost,
    })),
  };
}
