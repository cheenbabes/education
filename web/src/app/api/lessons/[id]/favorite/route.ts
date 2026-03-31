import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// POST /api/lessons/[id]/favorite — toggle favorite status
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: { favorite: !lesson.favorite },
    select: { id: true, favorite: true },
  });

  return NextResponse.json(updated);
}
