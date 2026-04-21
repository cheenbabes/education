import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BLEND_KEY_TO_PHILOSOPHY_ID } from "@/lib/archetype-utils";
import type { UserArchetype } from "@/app/api/user/archetype/route";

// GET /api/compass/by-session?sessionId=<uuid>
// Anonymous counterpart to /api/user/archetype — looks up the most recent
// CompassResult for a browser-minted sessionId so /create can pre-select
// and highlight the user's matched philosophies before they sign up.
// Returns the same shape as /api/user/archetype to keep the /create client
// code uniform.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const result = await prisma.compassResult.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      archetype: true,
      secondaryArchetype: true,
      philosophyBlend: true,
      createdAt: true,
    },
  });

  if (!result) return NextResponse.json(null);

  const blend = (result.philosophyBlend as Record<string, number>) ?? {};
  const topPhilosophyIds = Object.entries(blend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => BLEND_KEY_TO_PHILOSOPHY_ID[key])
    .filter(Boolean);

  return NextResponse.json({
    resultId: result.id,
    archetype: result.archetype,
    secondaryArchetype: result.secondaryArchetype,
    topPhilosophyIds,
    philosophyBlend: blend,
    createdAt: result.createdAt.toISOString(),
  } satisfies UserArchetype);
}
