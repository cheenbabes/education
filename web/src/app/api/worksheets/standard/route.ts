import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isWorksheetsEnabled } from "@/lib/featureFlags";

export async function POST(req: NextRequest) {
  if (!(await isWorksheetsEnabled("system"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const ws = await prisma.standardWorksheet.upsert({
    where: {
      clusterKey_worksheetNum: {
        clusterKey: body.clusterKey,
        worksheetNum: body.worksheetNum,
      },
    },
    update: {
      clusterTitle: body.clusterTitle,
      grade: body.grade,
      subject: body.subject,
      worksheetType: body.worksheetType,
      title: body.title,
      standardCodes: body.standardCodes ?? [],
      content: body.content,
    },
    create: {
      clusterKey:    body.clusterKey,
      clusterTitle:  body.clusterTitle,
      grade:         body.grade,
      subject:       body.subject,
      worksheetNum:  body.worksheetNum,
      worksheetType: body.worksheetType,
      title:         body.title,
      standardCodes: body.standardCodes ?? [],
      content:       body.content,
    },
  });
  return NextResponse.json(ws, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!(await isWorksheetsEnabled("system"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const clusterKey = searchParams.get("clusterKey");
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");

  const worksheets = await prisma.standardWorksheet.findMany({
    where: {
      ...(clusterKey && { clusterKey }),
      ...(grade && { grade }),
      ...(subject && { subject }),
    },
    orderBy: [{ grade: "asc" }, { worksheetNum: "asc" }],
  });
  return NextResponse.json(worksheets);
}
