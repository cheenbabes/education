import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { routeLogger } from "@/lib/logger";
import { SCORING_VERSION } from "@/lib/compass/scoring";

// POST /api/compass/submit — save compass quiz results
// Anonymous submissions allowed: accountId is null, sessionId correlates for later backfill.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json();

  const {
    archetype,
    secondaryArchetype,
    dimensionScores,
    philosophyBlend,
    part2Preferences,
    quizAnswers,
    sessionId, // client-minted UUID for anon correlation
    email: bodyEmail, // optional, if provided by anon user
  } = body;

  if (!archetype || !dimensionScores || !philosophyBlend) {
    return NextResponse.json(
      { error: "Missing required fields: archetype, dimensionScores, philosophyBlend" },
      { status: 400 },
    );
  }

  if (userId) await getOrCreateUser(userId);

  const result = await prisma.compassResult.create({
    data: {
      email: bodyEmail ?? null,
      sessionId: sessionId ?? null,
      archetype,
      secondaryArchetype: secondaryArchetype || null,
      dimensionScores,
      philosophyBlend,
      part2Preferences: part2Preferences ?? {},
      quizAnswers: quizAnswers ?? {},
      accountId: userId ?? null,
      scoringVersion: SCORING_VERSION,
    },
  });

  const log = routeLogger("POST /api/compass/submit", userId);
  log.info(
    {
      resultId: result.id,
      anonymous: !userId,
      hasEmail: !!bodyEmail,
      sessionId: sessionId ?? null,
      archetype,
      part2Complete: Object.keys(part2Preferences ?? {}).length > 0,
      scoringVersion: SCORING_VERSION,
    },
    "compass submission saved",
  );

  return NextResponse.json({ id: result.id });
}
