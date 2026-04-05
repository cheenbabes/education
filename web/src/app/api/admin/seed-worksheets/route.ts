import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY — remove after data migration is complete
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { worksheets } = await req.json();
  let created = 0;
  for (const ws of worksheets) {
    await prisma.standardWorksheet.upsert({
      where: { clusterKey_worksheetNum: { clusterKey: ws.clusterKey, worksheetNum: ws.worksheetNum } },
      update: {},
      create: {
        id: ws.id,
        clusterKey: ws.clusterKey,
        clusterTitle: ws.clusterTitle,
        grade: ws.grade,
        subject: ws.subject,
        worksheetNum: ws.worksheetNum,
        worksheetType: ws.worksheetType,
        title: ws.title,
        standardCodes: ws.standardCodes,
        content: ws.content,
        createdAt: ws.createdAt ? new Date(ws.createdAt) : new Date(),
      },
    });
    created++;
  }
  return NextResponse.json({ created, total: worksheets.length });
}
