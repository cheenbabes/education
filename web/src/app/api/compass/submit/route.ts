import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { routeLogger } from "@/lib/logger";
import { SCORING_VERSION } from "@/lib/compass/scoring";
import { captureServerEvent } from "@/lib/posthog-server";

// POST /api/compass/submit — save compass quiz results
// Anonymous submissions allowed: accountId is null, sessionId correlates for later backfill.
//
// Single row per sessionId: the Part 1 interim save and the Part 2 final save
// update the same row instead of creating duplicates. Previous behavior
// (create every time) caused one quiz-taker to produce ≥2 rows, inflating
// COUNT(*) on CompassResult and making `part2Preferences = '{}'` look like
// failed Part 2 submissions when it was actually just the Part 1 placeholder.
//
// We find+update instead of prisma.upsert because sessionId is not @unique in
// the schema — adding that constraint would require first cleaning up ~120
// duplicate rows already in prod. We address the live data-loss bug here and
// leave the schema tightening for a follow-up.
//
// Emits `compass_submit_persisted` with step:'part1'|'part2' so PostHog has a
// trustworthy server-confirmed signal for funnel analysis — client-side
// compass_part{1,2}_completed events only confirm user intent, not that the
// backend actually stored the submission.
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

  const step: "part1" | "part2" =
    part2Preferences && Object.keys(part2Preferences).length > 0 ? "part2" : "part1";

  const log = routeLogger("POST /api/compass/submit", userId);

  const commonData = {
    email: bodyEmail ?? null,
    archetype,
    secondaryArchetype: secondaryArchetype || null,
    dimensionScores,
    philosophyBlend,
    part2Preferences: part2Preferences ?? {},
    quizAnswers: quizAnswers ?? {},
    accountId: userId ?? null,
    scoringVersion: SCORING_VERSION,
  };

  try {
    let result;
    if (sessionId) {
      // Find the existing row for this session (if any) and update it,
      // otherwise create a new row. Race-safe enough given sessionIds are
      // client-minted UUIDs and one browser tab submits at a time.
      const existing = await prisma.compassResult.findFirst({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      result = existing
        ? await prisma.compassResult.update({
            where: { id: existing.id },
            data: commonData,
          })
        : await prisma.compassResult.create({
            data: { sessionId, ...commonData },
          });
    } else {
      // No sessionId — shouldn't happen in normal flow, but don't 400 a
      // legitimate quiz result. These rows are un-dedupable by design.
      result = await prisma.compassResult.create({ data: commonData });
    }

    log.info(
      {
        resultId: result.id,
        anonymous: !userId,
        hasEmail: !!bodyEmail,
        sessionId: sessionId ?? null,
        archetype,
        step,
        scoringVersion: SCORING_VERSION,
      },
      "compass submission saved",
    );

    // Distinct id preference: authed userId > sessionId > result.id. Using the
    // sessionId for anon submissions keeps these events attached to the same
    // person once PostHog stitches anon → identified at signup.
    const distinctId = userId ?? sessionId ?? result.id;
    captureServerEvent(distinctId, "compass_submit_persisted", {
      step,
      archetype,
      result_id: result.id,
      anonymous: !userId,
    });

    return NextResponse.json({ id: result.id });
  } catch (err) {
    log.error({ err, sessionId: sessionId ?? null }, "compass submit failed");
    const distinctId = userId ?? sessionId ?? "unknown";
    captureServerEvent(distinctId, "compass_submit_failed", {
      step,
      reason: err instanceof Error ? err.message : "unknown",
      anonymous: !userId,
    });
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
