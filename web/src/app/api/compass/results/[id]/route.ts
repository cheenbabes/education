import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/compass/results/:id — fetch compass result by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await prisma.compassResult.findUnique({
    where: { id },
    include: {
      curriculumPicks: {
        include: { curriculum: true },
      },
    },
  });

  if (!result) {
    return NextResponse.json({ error: "Compass result not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
