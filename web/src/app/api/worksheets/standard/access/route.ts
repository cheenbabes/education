import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isWorksheetsEnabled } from "@/lib/featureFlags";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isWorksheetsEnabled(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : null;
  const take =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.min(limit, 100)
      : undefined;

  const accesses = await prisma.standardWorksheetAccess.findMany({
    where: { userId },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
      standardWorksheet: {
        select: {
          id: true,
          title: true,
          clusterKey: true,
          clusterTitle: true,
          grade: true,
          subject: true,
          worksheetNum: true,
          worksheetType: true,
          standardCodes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });

  return NextResponse.json(
    accesses.map((access) => ({
      id: access.id,
      openedAt: access.createdAt.toISOString(),
      lesson: access.lesson,
      standardWorksheet: access.standardWorksheet,
    })),
  );
}
