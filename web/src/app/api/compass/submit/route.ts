import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// POST /api/compass/submit — save compass quiz results
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    archetype,
    secondaryArchetype,
    dimensionScores,
    philosophyBlend,
    part2Preferences,
    quizAnswers, // { part1: {q1: 2, ...}, part2: {p2_subjects: [...], ...} }
  } = body;

  if (!archetype || !dimensionScores || !philosophyBlend) {
    return NextResponse.json(
      { error: "Missing required fields: archetype, dimensionScores, philosophyBlend" },
      { status: 400 },
    );
  }

  // Ensure user exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@clerk.placeholder` },
  });

  const result = await prisma.compassResult.create({
    data: {
      email: userId, // placeholder — Clerk manages email
      archetype,
      secondaryArchetype: secondaryArchetype || null,
      dimensionScores,
      philosophyBlend,
      part2Preferences: part2Preferences ?? {},
      quizAnswers: quizAnswers ?? {},
      accountId: userId,
    },
  });

  return NextResponse.json({ id: result.id });
}
