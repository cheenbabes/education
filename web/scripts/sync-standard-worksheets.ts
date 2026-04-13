import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL ?? "http://127.0.0.1:8000";
const WORKSHEET_VARIANTS = [
  { worksheetNum: 1, worksheetType: "identify" },
  { worksheetNum: 2, worksheetType: "practice" },
  { worksheetNum: 3, worksheetType: "extend" },
] as const;

interface CanonicalCluster {
  cluster_key: string;
  canonical_name: string;
  grade: string;
  subject: string;
  sample_descriptions?: string[];
}

interface GeneratedWorksheetResponse {
  context: string;
  problems: unknown[];
  answer_key: Array<{ problemId: number; answer: string }>;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    dryRun: boolean;
    limit: number | null;
    clusterKey: string | null;
    grade: string | null;
    subject: string | null;
    concurrency: number;
  } = {
    dryRun: false,
    limit: null,
    clusterKey: null,
    grade: null,
    subject: null,
    concurrency: 6,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--limit") {
      options.limit = Number(args[index + 1] ?? "0") || null;
      index += 1;
      continue;
    }
    if (arg === "--cluster-key") {
      options.clusterKey = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--grade") {
      options.grade = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--subject") {
      options.subject = args[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--concurrency") {
      options.concurrency = Math.max(
        1,
        Number(args[index + 1] ?? String(options.concurrency)) ||
          options.concurrency,
      );
      index += 1;
    }
  }

  return options;
}

function loadCanonicalClusters() {
  const canonicalPath = path.resolve(
    process.cwd(),
    "../kg-service/data/canonical_clusters.json",
  );
  return JSON.parse(
    fs.readFileSync(canonicalPath, "utf8"),
  ) as CanonicalCluster[];
}

function dedupeCanonicalClusters(clusters: CanonicalCluster[]) {
  const deduped = new Map<string, CanonicalCluster>();
  const duplicateKeys = new Set<string>();

  for (const cluster of clusters) {
    const existing = deduped.get(cluster.cluster_key);
    if (!existing) {
      deduped.set(cluster.cluster_key, cluster);
      continue;
    }

    duplicateKeys.add(cluster.cluster_key);
    deduped.set(cluster.cluster_key, {
      ...existing,
      sample_descriptions: Array.from(
        new Set([
          ...(existing.sample_descriptions ?? []),
          ...(cluster.sample_descriptions ?? []),
        ]),
      ).slice(0, 5),
    });
  }

  if (duplicateKeys.size > 0) {
    console.warn(
      `Deduped ${duplicateKeys.size} canonical cluster keys: ${Array.from(
        duplicateKeys,
      ).join(", ")}`,
    );
  }

  return Array.from(deduped.values());
}

function loadStandardToClusterMap() {
  const mappingPath = path.resolve(
    process.cwd(),
    "../kg-service/data/standard_to_cluster.json",
  );
  return JSON.parse(
    fs.readFileSync(mappingPath, "utf8"),
  ) as Record<string, string>;
}

function buildStandardCodesByCluster(standardToCluster: Record<string, string>) {
  const byCluster = new Map<string, string[]>();

  for (const [standardCode, clusterKey] of Object.entries(standardToCluster)) {
    const existing = byCluster.get(clusterKey) ?? [];
    existing.push(standardCode);
    byCluster.set(clusterKey, existing);
  }

  return byCluster;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;

  const stringValue =
    typeof value === "string" ? value : JSON.stringify(value);
  return `'${stringValue.replace(/'/g, "''")}'`;
}

async function generateWorksheet(
  cluster: CanonicalCluster,
  standardCodes: string[],
  worksheetType: string,
) {
  const res = await fetch(`${KG_SERVICE_URL}/generate-standard-worksheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cluster_key: cluster.cluster_key,
      cluster_title: cluster.canonical_name,
      grade: cluster.grade,
      subject: cluster.subject,
      worksheet_type: worksheetType,
      standard_codes: standardCodes,
      standard_descriptions: cluster.sample_descriptions ?? [],
      num_problems: 6,
    }),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    throw new Error(
      `KG service ${res.status}: ${await res.text()}`,
    );
  }

  return (await res.json()) as GeneratedWorksheetResponse;
}

async function writeSqlDump(outputPath: string) {
  const worksheets = await prisma.standardWorksheet.findMany({
    orderBy: [{ clusterKey: "asc" }, { worksheetNum: "asc" }],
  });

  const lines = [
    `-- StandardWorksheet dump — ${worksheets.length} rows — ${new Date()
      .toISOString()
      .slice(0, 10)}`,
    "-- Usage: psql $DATABASE_URL < standard_worksheets_insert.sql",
    'ALTER TABLE "StandardWorksheet" DISABLE TRIGGER ALL;',
  ];

  for (const worksheet of worksheets) {
    lines.push(
      `INSERT INTO "StandardWorksheet" ("id", "clusterKey", "clusterTitle", "grade", "subject", "worksheetNum", "worksheetType", "title", "standardCodes", "content", "createdAt") VALUES (${sqlLiteral(
        worksheet.id,
      )}, ${sqlLiteral(worksheet.clusterKey)}, ${sqlLiteral(
        worksheet.clusterTitle,
      )}, ${sqlLiteral(worksheet.grade)}, ${sqlLiteral(
        worksheet.subject,
      )}, ${sqlLiteral(worksheet.worksheetNum)}, ${sqlLiteral(
        worksheet.worksheetType,
      )}, ${sqlLiteral(worksheet.title)}, ${sqlLiteral(
        worksheet.standardCodes,
      )}, ${sqlLiteral(worksheet.content)}, ${sqlLiteral(
        worksheet.createdAt,
      )}) ON CONFLICT ("clusterKey", "worksheetNum") DO NOTHING;`,
    );
  }

  lines.push('ALTER TABLE "StandardWorksheet" ENABLE TRIGGER ALL;');
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
}

async function runInBatches<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

async function main() {
  const options = parseArgs();
  const canonicalClusters = dedupeCanonicalClusters(loadCanonicalClusters());
  const standardToCluster = loadStandardToClusterMap();
  const standardCodesByCluster = buildStandardCodesByCluster(standardToCluster);

  const allCanonicalClusters = canonicalClusters.filter(
    (cluster) => standardCodesByCluster.has(cluster.cluster_key),
  );
  let clusters = allCanonicalClusters;

  if (options.clusterKey) {
    clusters = clusters.filter((cluster) => cluster.cluster_key === options.clusterKey);
  }
  if (options.grade) {
    clusters = clusters.filter((cluster) => cluster.grade === options.grade);
  }
  if (options.subject) {
    clusters = clusters.filter((cluster) => cluster.subject === options.subject);
  }
  if (options.limit) {
    clusters = clusters.slice(0, options.limit);
  }

  const canonicalKeys = new Set(
    allCanonicalClusters.map((cluster) => cluster.cluster_key),
  );
  const existingWorksheets = await prisma.standardWorksheet.findMany({
    select: {
      id: true,
      clusterKey: true,
      worksheetNum: true,
      clusterTitle: true,
      grade: true,
      subject: true,
      worksheetType: true,
      title: true,
      standardCodes: true,
      content: true,
    },
  });

  const existingByKey = new Map(
    existingWorksheets.map((worksheet) => [
      `${worksheet.clusterKey}:${worksheet.worksheetNum}`,
      worksheet,
    ]),
  );

  const staleClusterKeys = Array.from(
    new Set(
      existingWorksheets
        .map((worksheet) => worksheet.clusterKey)
        .filter((clusterKey) => !canonicalKeys.has(clusterKey)),
    ),
  );

  console.log(
    JSON.stringify(
      {
        canonicalClusters: clusters.length,
        expectedRows: clusters.length * 3,
        existingRows: existingWorksheets.length,
        staleClusters: staleClusterKeys.length,
        dryRun: options.dryRun,
      },
      null,
      2,
    ),
  );

  if (staleClusterKeys.length > 0) {
    console.log(`Pruning ${staleClusterKeys.length} stale cluster keys...`);
    if (!options.dryRun) {
      await prisma.standardWorksheet.deleteMany({
        where: {
          clusterKey: { in: staleClusterKeys },
        },
      });
    }
  }

  let repairedRows = 0;
  for (const cluster of clusters) {
    const standardCodes = standardCodesByCluster.get(cluster.cluster_key) ?? [];

    for (const variant of WORKSHEET_VARIANTS) {
      const existing = existingByKey.get(
        `${cluster.cluster_key}:${variant.worksheetNum}`,
      );
      if (!existing) continue;

      const targetTitle = `${cluster.canonical_name} — ${variant.worksheetType[0].toUpperCase()}${variant.worksheetType.slice(1)}`;
      const needsUpdate =
        existing.clusterTitle !== cluster.canonical_name ||
        existing.grade !== cluster.grade ||
        existing.subject !== cluster.subject ||
        existing.worksheetType !== variant.worksheetType ||
        existing.title !== targetTitle ||
        JSON.stringify(existing.standardCodes) !== JSON.stringify(standardCodes);

      if (!needsUpdate) continue;

      repairedRows += 1;
      console.log(`Repairing metadata for ${cluster.cluster_key} #${variant.worksheetNum}`);
      if (!options.dryRun) {
        await prisma.standardWorksheet.update({
          where: { id: existing.id },
          data: {
            clusterTitle: cluster.canonical_name,
            grade: cluster.grade,
            subject: cluster.subject,
            worksheetType: variant.worksheetType,
            title: targetTitle,
            standardCodes,
          },
        });
      }
    }
  }

  let generatedRows = 0;
  const failures: Array<{ clusterKey: string; worksheetNum: number; error: string }> = [];
  const generationJobs: Array<{
    cluster: CanonicalCluster;
    standardCodes: string[];
    worksheetNum: number;
    worksheetType: string;
  }> = [];

  for (const cluster of clusters) {
    const standardCodes = standardCodesByCluster.get(cluster.cluster_key) ?? [];

    for (const variant of WORKSHEET_VARIANTS) {
      const key = `${cluster.cluster_key}:${variant.worksheetNum}`;
      if (existingByKey.has(key)) continue;

      generatedRows += 1;
      generationJobs.push({
        cluster,
        standardCodes,
        worksheetNum: variant.worksheetNum,
        worksheetType: variant.worksheetType,
      });
    }
  }

  if (!options.dryRun && generationJobs.length > 0) {
    console.log(
      `Generating ${generationJobs.length} missing worksheet rows with concurrency ${options.concurrency}...`,
    );

    await runInBatches(
      generationJobs,
      options.concurrency,
      async ({ cluster, standardCodes, worksheetNum, worksheetType }) => {
        console.log(
          `Generating ${cluster.cluster_key} #${worksheetNum} (${worksheetType})`,
        );

        try {
          const generated = await generateWorksheet(
            cluster,
            standardCodes,
            worksheetType,
          );

          await prisma.standardWorksheet.create({
            data: {
              clusterKey: cluster.cluster_key,
              clusterTitle: cluster.canonical_name,
              grade: cluster.grade,
              subject: cluster.subject,
              worksheetNum,
              worksheetType,
              title: `${cluster.canonical_name} — ${worksheetType[0].toUpperCase()}${worksheetType.slice(1)}`,
              standardCodes,
              content: {
                context: generated.context,
                problems: generated.problems,
                answerKey: generated.answer_key,
              },
            },
          });
        } catch (err) {
          failures.push({
            clusterKey: cluster.cluster_key,
            worksheetNum,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    );
  }

  if (!options.dryRun) {
    const outputPath = path.resolve(
      process.cwd(),
      "../kg-service/data/standard_worksheets_insert.sql",
    );
    await writeSqlDump(outputPath);
    console.log(`Wrote SQL dump to ${outputPath}`);
  }

  const finalCount = await prisma.standardWorksheet.count();
  console.log(
    JSON.stringify(
      {
        repairedRows,
        generatedRows,
        failures,
        finalCount,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
