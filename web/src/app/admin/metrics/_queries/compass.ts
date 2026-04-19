import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export async function loadCompass(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];
  const where = start ? `WHERE "createdAt" >= $1` : ``;

  const [totals, archetypes, daily] = await Promise.all([
    prisma.$queryRawUnsafe<
      { total: bigint; with_email: bigint; with_account: bigint; unique_sessions: bigint }[]
    >(
      `SELECT COUNT(*)::bigint AS total,
              COUNT("email")::bigint AS with_email,
              COUNT("accountId")::bigint AS with_account,
              COUNT(DISTINCT "sessionId")::bigint AS unique_sessions
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

  const t = totals[0] ?? { total: BigInt(0), with_email: BigInt(0), with_account: BigInt(0), unique_sessions: BigInt(0) };
  const total = Number(t.total);
  const withEmail = Number(t.with_email);
  const withAccount = Number(t.with_account);
  const uniqueSessions = Number(t.unique_sessions);
  const topArchetype = archetypes[0]?.archetype ?? "—";

  const anon = total - withAccount;

  return {
    kpis: {
      totalSubmissions: total,
      uniqueSessions,
      withEmail,
      withAccount,
      anon,
      emailCapturePct: total > 0 ? Math.round((withEmail / total) * 100) : 0,
      accountConversionPct: total > 0 ? Math.round((withAccount / total) * 100) : 0,
      topArchetype,
    },
    archetypes: archetypes.map((r) => ({ label: r.archetype, value: Number(r.count) })),
    daily: daily.map((r) => ({ day: toIso(r.day), value: Number(r.value) })),
  };
}
