import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadCompass(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];
  const where = start ? `WHERE "createdAt" >= $1` : ``;

  const [totals, archetypes, daily] = await Promise.all([
    prisma.$queryRawUnsafe<{ total: bigint; converted: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total, COUNT("accountId")::bigint AS converted
         FROM "CompassResult" ${where}`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ archetype: string; count: bigint }[]>(
      `SELECT archetype, COUNT(*)::bigint AS count
         FROM "CompassResult" ${where}
         GROUP BY archetype ORDER BY count DESC`,
      ...args,
    ),
    prisma.$queryRawUnsafe<{ day: Date; value: bigint }[]>(
      `SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::bigint AS value
         FROM "CompassResult" ${where} GROUP BY 1 ORDER BY 1`,
      ...args,
    ),
  ]);

  const t = totals[0] ?? { total: BigInt(0), converted: BigInt(0) };
  const total = Number(t.total);
  const converted = Number(t.converted);
  const topArchetype = archetypes[0]?.archetype ?? "—";

  return {
    kpis: {
      totalQuizzes: total,
      conversionPct: total > 0 ? Math.round((converted / total) * 100) : 0,
      topArchetype,
    },
    archetypes: archetypes.map((r) => ({ label: r.archetype, value: Number(r.count) })),
    daily: daily.map((r) => ({ day: toIso(r.day), value: Number(r.value) })),
    funnel: { total, converted, unconverted: total - converted },
  };
}
