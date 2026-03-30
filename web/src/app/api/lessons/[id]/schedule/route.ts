import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date, userId = "demo-user" } = await req.json();

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const entry = await prisma.calendarEntry.create({
    data: {
      lessonId: params.id,
      userId,
      scheduledDate: new Date(date + "T12:00:00"),
    },
  });

  return NextResponse.json(entry);
}
