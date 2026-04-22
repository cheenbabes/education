import { prisma } from "@/lib/prisma";
import type { Range } from "../_lib/range";
import { rangeStart } from "../_lib/range";

// Common English stopwords stripped from the "top seed words" chart so we see
// the concrete topics users typed — not connective tissue like "the" or "and".
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "about", "from", "into", "your",
  "their", "our", "what", "how", "why", "when", "where", "which", "while",
  "they", "them", "these", "those", "are", "was", "were", "has", "have", "had",
  "its", "but", "not", "can", "too", "out", "any", "all", "some", "one", "two",
  "three", "very", "also", "much", "may", "his", "her", "more", "most", "will",
  "just", "like", "get", "got", "use", "using", "make", "let", "see", "who",
  "you", "yours", "mine", "mine", "about", "because", "other", "then", "than",
]);

type RawLessonRow = {
  id: string;
  when: Date;
  user_email: string | null;
  child: string | null;
  philosophy: string;
  subject_names: string[];
  interest: string | null;
  sections: number | null;
  duration: number | null;
  standards: number | null;
  cost: number | null;
  stars: number | null;
};

export async function loadLessons(range: Range) {
  const start = rangeStart(range);
  const args = start ? [start] : [];
  const whereClause = start ? `WHERE l."createdAt" >= $1` : ``;

  const [
    recent,
    topSeeds,
    seedLengths,
    kpis,
    phConn,
    expensive,
  ] = await Promise.all([
    // Recent lessons detail — 50 most recent in range, joined to user + first
    // child for the at-a-glance table. Sections / duration / standards are
    // pulled from the content JSON so we can surface lesson shape without a
    // separate column on the Lesson table.
    prisma.$queryRawUnsafe<RawLessonRow[]>(
      `SELECT
         l.id,
         l."createdAt" AS "when",
         u.email AS user_email,
         (
           SELECT c.name || ' (G' || c."gradeLevel" || ')'
           FROM "LessonChild" lc
           JOIN "Child" c ON c.id = lc."childId"
           WHERE lc."lessonId" = l.id
           ORDER BY c.name
           LIMIT 1
         ) AS child,
         l.philosophy,
         l."subjectNames" AS subject_names,
         l.interest,
         jsonb_array_length(COALESCE(l.content->'lesson_sections', '[]'::jsonb))::int AS sections,
         (
           SELECT COALESCE(SUM(NULLIF(s->>'duration_minutes','')::int), 0)::int
           FROM jsonb_array_elements(COALESCE(l.content->'lesson_sections', '[]'::jsonb)) AS s
         ) AS duration,
         jsonb_array_length(COALESCE(l.content->'standards_addressed', '[]'::jsonb))::int AS standards,
         l."generationCostUsd" AS cost,
         (SELECT AVG("starRating")::float FROM "Completion" WHERE "lessonId" = l.id) AS stars
       FROM "Lesson" l
       LEFT JOIN "User" u ON u.id = l."userId"
       ${whereClause}
       ORDER BY l."createdAt" DESC
       LIMIT 50`,
      ...args,
    ),
    // Top seed words — tokenize `interest`, strip stopwords + short tokens.
    // Stop-list lives in JS so we filter after retrieval (keeps SQL simple).
    prisma.$queryRawUnsafe<{ word: string; count: bigint }[]>(
      `SELECT lower(trim(regexp_replace(word, '[^a-zA-Z]', '', 'g'))) AS word, COUNT(*)::bigint AS count
         FROM (
           SELECT regexp_split_to_table(interest, '\\s+') AS word
           FROM "Lesson" l
           ${start ? `WHERE l."createdAt" >= $1 AND l.interest IS NOT NULL` : `WHERE l.interest IS NOT NULL`}
         ) t
         WHERE length(trim(regexp_replace(word, '[^a-zA-Z]', '', 'g'))) >= 3
         GROUP BY 1
         ORDER BY count DESC
         LIMIT 80`,
      ...args,
    ),
    // Seed length distribution — buckets the `interest` string by char count.
    // "empty" is explicitly called out because it signals failed UX (user
    // hit generate without typing anything).
    prisma.$queryRawUnsafe<{ bucket: string; count: bigint; sort_order: number }[]>(
      `SELECT bucket, COUNT(*)::bigint AS count, MIN(ord) AS sort_order
         FROM (
           SELECT CASE
             WHEN interest IS NULL OR length(trim(interest)) = 0 THEN 'empty'
             WHEN length(interest) <= 10 THEN '1-10'
             WHEN length(interest) <= 30 THEN '11-30'
             WHEN length(interest) <= 60 THEN '31-60'
             WHEN length(interest) <= 120 THEN '61-120'
             ELSE '120+'
           END AS bucket,
           CASE
             WHEN interest IS NULL OR length(trim(interest)) = 0 THEN 0
             WHEN length(interest) <= 10 THEN 1
             WHEN length(interest) <= 30 THEN 2
             WHEN length(interest) <= 60 THEN 3
             WHEN length(interest) <= 120 THEN 4
             ELSE 5
           END AS ord
         FROM "Lesson" l
         ${whereClause}
         ) t
         GROUP BY bucket
         ORDER BY sort_order`,
      ...args,
    ),
    // Structural-quality KPIs — averages across every lesson's content JSON.
    prisma.$queryRawUnsafe<{
      avg_sections: number | null;
      avg_duration: number | null;
      avg_standards: number | null;
      avg_cost: number | null;
      empty_seeds: bigint;
      total: bigint;
    }[]>(
      `SELECT
         AVG(jsonb_array_length(COALESCE(l.content->'lesson_sections','[]'::jsonb)))::float AS avg_sections,
         AVG((
           SELECT COALESCE(SUM(NULLIF(s->>'duration_minutes','')::int),0)
             FROM jsonb_array_elements(COALESCE(l.content->'lesson_sections','[]'::jsonb)) AS s
         ))::float AS avg_duration,
         AVG(jsonb_array_length(COALESCE(l.content->'standards_addressed','[]'::jsonb)))::float AS avg_standards,
         AVG(l."generationCostUsd")::float AS avg_cost,
         COUNT(*) FILTER (WHERE l.interest IS NULL OR length(trim(l.interest)) < 3)::bigint AS empty_seeds,
         COUNT(*)::bigint AS total
       FROM "Lesson" l
       ${whereClause}`,
      ...args,
    ),
    // % of lessons where at least one section has a philosophy_connection.
    // A signal that the philosophy prompt is actually being honored.
    prisma.$queryRawUnsafe<{ with_conn: bigint; total: bigint }[]>(
      `SELECT
         COUNT(*) FILTER (WHERE EXISTS(
           SELECT 1 FROM jsonb_array_elements(COALESCE(l.content->'lesson_sections','[]'::jsonb)) AS s
           WHERE COALESCE(s->>'philosophy_connection','') <> ''
         ))::bigint AS with_conn,
         COUNT(*)::bigint AS total
       FROM "Lesson" l
       ${whereClause}`,
      ...args,
    ),
    // Most expensive lessons in range — for outlier inspection.
    prisma.$queryRawUnsafe<{
      id: string;
      when: Date;
      user_email: string | null;
      philosophy: string;
      interest: string | null;
      cost: number;
    }[]>(
      `SELECT l.id, l."createdAt" AS "when", u.email AS user_email,
              l.philosophy, l.interest, l."generationCostUsd"::float AS cost
         FROM "Lesson" l
         LEFT JOIN "User" u ON u.id = l."userId"
         WHERE l."generationCostUsd" IS NOT NULL ${start ? `AND l."createdAt" >= $1` : ``}
         ORDER BY l."generationCostUsd" DESC
         LIMIT 10`,
      ...args,
    ),
  ]);

  const k = kpis[0] ?? {
    avg_sections: 0,
    avg_duration: 0,
    avg_standards: 0,
    avg_cost: 0,
    empty_seeds: BigInt(0),
    total: BigInt(0),
  };
  const ph = phConn[0] ?? { with_conn: BigInt(0), total: BigInt(0) };
  const totalLessons = Number(k.total);
  const totalPh = Number(ph.total);

  // Stopword-filter the top seeds in JS (simpler than maintaining a list in SQL).
  const filteredSeeds = topSeeds
    .filter((r) => r.word && !STOPWORDS.has(r.word))
    .slice(0, 25);

  return {
    kpis: {
      total: totalLessons,
      avgSections: round1(k.avg_sections),
      avgDurationMin: Math.round(k.avg_duration ?? 0),
      avgStandards: round1(k.avg_standards),
      avgCostUsd: k.avg_cost ?? 0,
      emptySeeds: Number(k.empty_seeds),
      emptySeedsPct: totalLessons > 0 ? Math.round((Number(k.empty_seeds) / totalLessons) * 100) : 0,
      phConnPct: totalPh > 0 ? Math.round((Number(ph.with_conn) / totalPh) * 100) : 0,
    },
    recent: recent.map((r) => ({
      id: r.id,
      when: fmtDateTime(r.when),
      email: r.user_email ?? "—",
      child: r.child ?? "—",
      philosophy: shortPhil(r.philosophy),
      subjects: (r.subject_names ?? []).join(", ") || "—",
      seed: r.interest ?? "—",
      sections: r.sections ?? 0,
      duration: r.duration ?? 0,
      standards: r.standards ?? 0,
      cost: r.cost,
      stars: r.stars === null ? null : round1(r.stars),
    })),
    topSeeds: filteredSeeds.map((r) => ({ label: r.word, value: Number(r.count) })),
    seedLengths: seedLengths.map((r) => ({ label: r.bucket, value: Number(r.count) })),
    expensive: expensive.map((r) => ({
      id: r.id,
      when: fmtDate(r.when),
      email: r.user_email ?? "—",
      philosophy: shortPhil(r.philosophy),
      seed: r.interest ?? "—",
      cost: r.cost,
    })),
  };
}

function round1(n: number | null | undefined): number {
  if (n === null || n === undefined || Number.isNaN(n)) return 0;
  return Math.round(n * 10) / 10;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtDateTime(d: Date): string {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

// Slugs like "charlotte-mason" are verbose in a table. The mapping keeps the
// display readable without re-hitting the DB for labels.
const PHIL_LABEL: Record<string, string> = {
  "charlotte-mason": "Charlotte Mason",
  "classical": "Classical",
  "montessori-inspired": "Montessori",
  "waldorf-adjacent": "Waldorf",
  "place-nature-based": "Place/Nature",
  "project-based-learning": "Project-based",
  "unschooling": "Unschooling",
  "adaptive": "Adaptive",
};

function shortPhil(p: string): string {
  return PHIL_LABEL[p] ?? p;
}
