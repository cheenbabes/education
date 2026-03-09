import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/lessons/[id] — fetch a single lesson by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      lessonChildren: { include: { child: true } },
      completions: { include: { child: true } },
      calendarEntries: true,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  return NextResponse.json(lesson);
}
