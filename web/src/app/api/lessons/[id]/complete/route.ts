import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/lessons/[id]/complete — rate and complete a lesson for a child
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { childId, starRating, notes } = await req.json();

  const completion = await prisma.completion.upsert({
    where: {
      lessonId_childId: {
        lessonId: params.id,
        childId,
      },
    },
    create: {
      lessonId: params.id,
      childId,
      starRating,
      notes: notes || null,
    },
    update: {
      starRating,
      notes: notes || null,
    },
  });

  return NextResponse.json(completion);
}
