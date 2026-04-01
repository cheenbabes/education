import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/children/[id] — update a child profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { name, dateOfBirth, gradeLevel, standardsOptIn } = body;

  const child = await prisma.child.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gradeLevel !== undefined && { gradeLevel }),
      ...(standardsOptIn !== undefined && { standardsOptIn }),
      learningNotes: body.learningNotes || null,
    },
  });

  return NextResponse.json(child);
}

// DELETE /api/children/[id] — delete a child profile
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.child.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ deleted: true });
}
