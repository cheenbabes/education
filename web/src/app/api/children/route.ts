import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { getTier, getLimits } from "@/lib/tier";

// GET /api/children — list children for a user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getOrCreateUser(userId);

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

  // Enforce tier child limit
  const { tier } = await getTier(userId);
  const { children: limit } = getLimits(tier);
  const current = await prisma.child.count({ where: { userId } });
  if (current >= limit) {
    return NextResponse.json(
      { error: "child_limit", tier, limit, current },
      { status: 429 },
    );
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
      learningNotes: body.learningNotes || null,
    },
  });

  return NextResponse.json(child);
}
