import { renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { WorksheetPdf } from "@/components/pdf/WorksheetPdf";
import { isWorksheetsEnabled } from "@/lib/featureFlags";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { routeLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStandardWorksheetQuotaStatus } from "@/lib/standardWorksheetQuota";
import { renderVisual } from "@/lib/worksheetSvg";

export const dynamic = "force-dynamic";

function buildFilename(clusterKey: string, worksheetNum: number) {
  return `${clusterKey}-worksheet-${worksheetNum}.pdf`;
}

function extractSvgDimensions(svg: string) {
  const widthMatch = svg.match(/width="([\d.]+)"/);
  const heightMatch = svg.match(/height="([\d.]+)"/);

  return {
    width: widthMatch ? Number(widthMatch[1]) : 360,
    height: heightMatch ? Number(heightMatch[1]) : 160,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("GET /api/worksheets/standard/[id]/pdf", userId);

  if (!(await isWorksheetsEnabled(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await getOrCreateUser(userId);

  const worksheet = await prisma.standardWorksheet.findUnique({
    where: { id: params.id },
  });
  if (!worksheet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");

  let recordedLessonId: string | null = null;
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!lesson || lesson.userId !== userId) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    recordedLessonId = lesson.id;
  }

  const quota = await getStandardWorksheetQuotaStatus(userId);
  if (quota.limit <= 0) {
    return NextResponse.json(
      {
        error: "upgrade_required",
        limit: quota.limit,
        used: quota.used,
      },
      { status: 402 },
    );
  }

  if (quota.used >= quota.limit) {
    return NextResponse.json(
      {
        error: "worksheet_limit",
        limit: quota.limit,
        used: quota.used,
      },
      { status: 429 },
    );
  }

  const content = worksheet.content as unknown as Parameters<
    typeof WorksheetPdf
  >[0]["content"];
  const contentWithVisuals = {
    ...content,
    problems: await Promise.all(
      content.problems.map(async (problem) => {
        if (!problem.visual) return problem;

        const svg = renderVisual(problem.visual.type, problem.visual.params);
        if (!svg) return problem;

        try {
          const png = await sharp(Buffer.from(svg, "utf8")).png().toBuffer();
          const { width, height } = extractSvgDimensions(svg);
          const scale = Math.min(1, 360 / width, 140 / height);

          return {
            ...problem,
            visualImageSrc: `data:image/png;base64,${png.toString("base64")}`,
            visualImageWidth: Math.round(width * scale),
            visualImageHeight: Math.round(height * scale),
          };
        } catch (err) {
          log.warn(
            {
              err,
              worksheetId: worksheet.id,
              problemId: problem.id,
              visualType: problem.visual.type,
            },
            "failed to rasterize worksheet visual",
          );
          return problem;
        }
      }),
    ),
  };
  const pdfBuffer = await renderToBuffer(
    WorksheetPdf({
      title: worksheet.title,
      clusterTitle: worksheet.clusterTitle,
      grade: worksheet.grade,
      subject: worksheet.subject,
      worksheetNum: worksheet.worksheetNum,
      worksheetType: worksheet.worksheetType,
      standardCodes: worksheet.standardCodes,
      content: contentWithVisuals,
    }),
  );

  await prisma.standardWorksheetAccess.create({
    data: {
      userId,
      standardWorksheetId: worksheet.id,
      lessonId: recordedLessonId,
    },
  });

  const filename = buildFilename(worksheet.clusterKey, worksheet.worksheetNum);

  log.info(
    {
      worksheetId: worksheet.id,
      lessonId: recordedLessonId,
      used: quota.used + 1,
      limit: quota.limit,
    },
    "served standard worksheet pdf",
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
