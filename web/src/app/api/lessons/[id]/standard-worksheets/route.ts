import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isWorksheetsEnabled } from "@/lib/featureFlags";
import { prisma } from "@/lib/prisma";
import { routeLogger } from "@/lib/logger";
import {
  getClusterKeysForStandards,
  getStandardCodesForCluster,
} from "@/lib/standardWorksheetLibrary";

interface LessonStandardEntry {
  code: string;
  description_plain?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("GET /api/lessons/[id]/standard-worksheets", userId);

  if (!(await isWorksheetsEnabled(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      title: true,
      subjects: true,
      content: true,
      lessonChildren: {
        select: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      completions: {
        select: {
          childId: true,
        },
      },
    },
  });

  if (!lesson || lesson.userId !== userId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const lessonContent = lesson.content as Record<string, unknown>;
  const standardsAddressed =
    (lessonContent.standards_addressed as LessonStandardEntry[] | undefined) ?? [];

  const lessonStandardEntries = standardsAddressed
    .map((entry) => ({
      code: entry.code,
      descriptionPlain: entry.description_plain ?? null,
    }))
    .filter((entry): entry is { code: string; descriptionPlain: string | null } =>
      Boolean(entry.code),
    );

  const lessonStandardCodes = Array.from(
    new Set(
      lessonStandardEntries.length > 0
        ? lessonStandardEntries.map((entry) => entry.code)
        : lesson.subjects,
    ),
  );
  const lessonCodeSet = new Set(lessonStandardCodes);
  const standardsByCode = new Map(
    lessonStandardEntries.map((entry) => [entry.code, entry.descriptionPlain]),
  );
  const fallbackMatches = getClusterKeysForStandards(lessonStandardCodes);

  const whereClauses = [];
  if (lessonStandardCodes.length > 0) {
    whereClauses.push({ standardCodes: { hasSome: lessonStandardCodes } });
  }
  if (fallbackMatches.size > 0) {
    whereClauses.push({ clusterKey: { in: Array.from(fallbackMatches.keys()) } });
  }

  const worksheets =
    whereClauses.length > 0
      ? await prisma.standardWorksheet.findMany({
          where: { OR: whereClauses },
          orderBy: [
            { subject: "asc" },
            { grade: "asc" },
            { clusterTitle: "asc" },
            { worksheetNum: "asc" },
          ],
        })
      : [];

  const worksheetIds = worksheets.map((worksheet) => worksheet.id);
  const accesses =
    worksheetIds.length > 0
      ? await prisma.standardWorksheetAccess.findMany({
          where: {
            userId,
            standardWorksheetId: { in: worksheetIds },
          },
          orderBy: { createdAt: "desc" },
          select: {
            standardWorksheetId: true,
            createdAt: true,
          },
        })
      : [];

  const lastOpenedAtByWorksheetId = new Map<string, string>();
  for (const access of accesses) {
    if (!lastOpenedAtByWorksheetId.has(access.standardWorksheetId)) {
      lastOpenedAtByWorksheetId.set(
        access.standardWorksheetId,
        access.createdAt.toISOString(),
      );
    }
  }

  const groups = new Map<
    string,
    {
      clusterKey: string;
      clusterTitle: string;
      grade: string;
      subject: string;
      standardCodes: string[];
      matchedStandards: Array<{ code: string; descriptionPlain: string | null }>;
      worksheets: Array<{
        id: string;
        title: string;
        worksheetNum: number;
        worksheetType: string;
        lastOpenedAt: string | null;
      }>;
    }
  >();

  for (const worksheet of worksheets) {
    const clusterStandardCodes =
      worksheet.standardCodes.length > 0
        ? worksheet.standardCodes
        : getStandardCodesForCluster(worksheet.clusterKey);
    const matchedStandardCodes = Array.from(
      new Set([
        ...clusterStandardCodes.filter((code) => lessonCodeSet.has(code)),
        ...(fallbackMatches.get(worksheet.clusterKey) ?? []),
      ]),
    );

    if (matchedStandardCodes.length === 0) continue;

    if (!groups.has(worksheet.clusterKey)) {
      groups.set(worksheet.clusterKey, {
        clusterKey: worksheet.clusterKey,
        clusterTitle: worksheet.clusterTitle,
        grade: worksheet.grade,
        subject: worksheet.subject,
        standardCodes: clusterStandardCodes,
        matchedStandards: matchedStandardCodes.map((code) => ({
          code,
          descriptionPlain: standardsByCode.get(code) ?? null,
        })),
        worksheets: [],
      });
    }

    groups.get(worksheet.clusterKey)?.worksheets.push({
      id: worksheet.id,
      title: worksheet.title,
      worksheetNum: worksheet.worksheetNum,
      worksheetType: worksheet.worksheetType,
      lastOpenedAt: lastOpenedAtByWorksheetId.get(worksheet.id) ?? null,
    });
  }

  const completedChildIds = Array.from(
    new Set(lesson.completions.map((completion) => completion.childId)),
  );
  const totalChildren = lesson.lessonChildren.length;
  const isUnlocked = totalChildren === 0 || completedChildIds.length > 0;

  const response = {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    isUnlocked,
    lockReason: isUnlocked
      ? null
      : "Complete this lesson for at least one child to unlock worksheets.",
    completion: {
      completedChildren: completedChildIds.length,
      totalChildren,
    },
    standards: lessonStandardCodes.map((code) => ({
      code,
      descriptionPlain: standardsByCode.get(code) ?? null,
    })),
    worksheetGroups: Array.from(groups.values()),
  };

  log.info(
    {
      lessonId: lesson.id,
      matchedClusters: response.worksheetGroups.length,
      matchedWorksheets: worksheets.length,
      unlocked: isUnlocked,
    },
    "served lesson standard worksheets",
  );

  return NextResponse.json(response);
}
