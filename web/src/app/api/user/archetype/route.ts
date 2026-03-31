import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BLEND_KEY_TO_PHILOSOPHY_ID } from "@/lib/archetype-utils";

export interface UserArchetype {
  resultId: string;
  archetype: string;
  secondaryArchetype: string | null;
  /** Top 2 philosophy IDs from the blend, mapped to PHILOSOPHIES IDs */
  topPhilosophyIds: string[];
  philosophyBlend: Record<string, number>;
  createdAt: string;
}

// GET /api/user/archetype — returns the user's most recent compass result
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.compassResult.findFirst({
    where: { accountId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      archetype: true,
      secondaryArchetype: true,
      philosophyBlend: true,
      createdAt: true,
    },
  });

  if (!result) {
    return NextResponse.json(null);
  }

  const blend = (result.philosophyBlend as Record<string, number>) ?? {};

  // Get top 2 philosophies by blend score, mapped to PHILOSOPHIES IDs
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
