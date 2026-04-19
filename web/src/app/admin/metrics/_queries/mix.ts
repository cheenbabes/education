import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

export async function loadMix(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];
  const lessonWhere = start ? `WHERE "createdAt" >= $1` : ``;

  const [philosophy, subjects, grades, multiSubj, states] = await Promise.all([
    prisma.$queryRawUnsafe<{ philosophy: string; count: bigint }[]>(
      `SELECT philosophy, COUNT(*)::bigint AS count FROM "Lesson" ${lessonWhere}
         GROUP BY philosophy ORDER BY count DESC`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ subject: string; count: bigint }[]>(
      `SELECT unnest("subjectNames") AS subject, COUNT(*)::bigint AS count
         FROM "Lesson" ${lessonWhere}
         GROUP BY 1 ORDER BY count DESC LIMIT 15`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ grade: string; count: bigint }[]>(
      `SELECT "gradeLevel" AS grade, COUNT(*)::bigint AS count
         FROM "Child" GROUP BY 1
         ORDER BY CASE "gradeLevel" WHEN 'K' THEN 0 ELSE "gradeLevel"::int END`,
    ),
    prisma.$queryRawUnsafe<{ total: bigint; multi: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total,
              COUNT(*) FILTER (WHERE "multiSubjectOptimized")::bigint AS multi
         FROM "Lesson" ${lessonWhere}`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ state: string | null; count: bigint }[]>(
      `SELECT COALESCE(state, '—') AS state, COUNT(*)::bigint AS count
         FROM "User" GROUP BY 1 ORDER BY count DESC LIMIT 15`,
    ),
  ]);

  const ms = multiSubj[0] ?? { total: BigInt(0), multi: BigInt(0) };
  const total = Number(ms.total);
  const multi = Number(ms.multi);

  return {
    philosophy: philosophy.map((r) => ({ label: r.philosophy, value: Number(r.count) })),
    subjects: subjects.map((r) => ({ label: r.subject, value: Number(r.count) })),
    grades: grades.map((r) => ({ label: r.grade, value: Number(r.count) })),
    multiSubjectPct: total > 0 ? Math.round((multi / total) * 100) : 0,
    totalLessonsInRange: total,
    states: states.map((r) => ({ label: r.state ?? "—", value: Number(r.count) })),
  };
}
