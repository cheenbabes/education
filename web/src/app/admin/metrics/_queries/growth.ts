import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

export type DailyRow = { day: string; value: number };

async function dailyCount(
  table: "User" | "Lesson" | "CompassResult",
  column: "createdAt",
  start: Date | null,
): Promise<DailyRow[]> {
  const whereClause = start ? `WHERE "${column}" >= $1` : "";
  const args = start ? [start] : [];
  const rows = await prisma.$queryRawUnsafe<{ day: Date; value: bigint }[]>(
    `SELECT date_trunc('day', "${column}")::date AS day, COUNT(*)::bigint AS value
     FROM "${table}"
     ${whereClause}
     GROUP BY 1 ORDER BY 1`,
    ...args,
  );
  return rows.map((r) => ({ day: toIso(r.day), value: Number(r.value) }));
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function loadGrowth(range: Range) {
  const start = rangeStart(range);
  const prior = start ? priorWindow(start) : null;

  const [
    totalUsers,
    totalLessons,
    totalQuizzes,
    usersInRange,
    lessonsInRange,
    quizzesInRange,
    usersPrior,
    lessonsPrior,
    newUsersDaily,
    newLessonsDaily,
    newQuizzesDaily,
    cumulativeUsers,
    dau,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.compassResult.count(),
    start ? prisma.user.count({ where: { createdAt: { gte: start } } }) : prisma.user.count(),
    start ? prisma.lesson.count({ where: { createdAt: { gte: start } } }) : prisma.lesson.count(),
    start
      ? prisma.compassResult.count({ where: { createdAt: { gte: start } } })
      : prisma.compassResult.count(),
    prior
      ? prisma.user.count({ where: { createdAt: { gte: prior.start, lt: prior.end } } })
      : Promise.resolve(0),
    prior
      ? prisma.lesson.count({ where: { createdAt: { gte: prior.start, lt: prior.end } } })
      : Promise.resolve(0),
    dailyCount("User", "createdAt", start),
    dailyCount("Lesson", "createdAt", start),
    dailyCount("CompassResult", "createdAt", start),
    cumulativeUsersQuery(start),
    dauQuery(start),
  ]);

  return {
    kpis: {
      totalUsers,
      totalLessons,
      totalQuizzes,
      usersInRange,
      lessonsInRange,
      quizzesInRange,
      usersDeltaPct: deltaPct(usersInRange, usersPrior),
      lessonsDeltaPct: deltaPct(lessonsInRange, lessonsPrior),
    },
    newUsersDaily,
    newLessonsDaily,
    newQuizzesDaily,
    cumulativeUsers,
    dau,
  };
}

function deltaPct(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? null : 0;
  return Math.round(((current - prior) / prior) * 100);
}

function priorWindow(start: Date): { start: Date; end: Date } {
  const now = new Date();
  const spanMs = now.getTime() - start.getTime();
  const priorEnd = new Date(start);
  const priorStart = new Date(start.getTime() - spanMs);
  return { start: priorStart, end: priorEnd };
}

async function cumulativeUsersQuery(start: Date | null): Promise<DailyRow[]> {
  // Cumulative total users at end of each day (across all time, but display window = range)
  const rows = await prisma.$queryRawUnsafe<{ day: Date; value: bigint }[]>(
    start
      ? `WITH daily AS (
           SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::bigint AS c FROM "User" GROUP BY 1
         )
         SELECT day, SUM(c) OVER (ORDER BY day)::bigint AS value FROM daily WHERE day >= $1 ORDER BY day`
      : `WITH daily AS (
           SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::bigint AS c FROM "User" GROUP BY 1
         )
         SELECT day, SUM(c) OVER (ORDER BY day)::bigint AS value FROM daily ORDER BY day`,
    ...(start ? [start] : []),
  );
  return rows.map((r) => ({ day: toIso(r.day), value: Number(r.value) }));
}

async function dauQuery(start: Date | null): Promise<DailyRow[]> {
  const rows = await prisma.$queryRawUnsafe<{ day: Date; value: bigint }[]>(
    start
      ? `SELECT date_trunc('day', "createdAt")::date AS day, COUNT(DISTINCT "userId")::bigint AS value
         FROM "Lesson" WHERE "createdAt" >= $1 GROUP BY 1 ORDER BY 1`
      : `SELECT date_trunc('day', "createdAt")::date AS day, COUNT(DISTINCT "userId")::bigint AS value
         FROM "Lesson" GROUP BY 1 ORDER BY 1`,
    ...(start ? [start] : []),
  );
  return rows.map((r) => ({ day: toIso(r.day), value: Number(r.value) }));
}
