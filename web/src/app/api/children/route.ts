import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/children — list children for a user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-create User record on first API call
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@clerk.placeholder` },
  });

  const children = await prisma.child.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(children);
}

// POST /api/children — create a child profile
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, dateOfBirth, gradeLevel, standardsOptIn = true } = body;

  const child = await prisma.child.create({
    data: {
      userId,
      name,
      dateOfBirth: new Date(dateOfBirth),
      gradeLevel,
      standardsOptIn,
    },
  });

  return NextResponse.json(child);
}
