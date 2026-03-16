import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/compass/submit — save compass quiz results
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, archetype, dimensionScores, philosophyBlend, part2Preferences } = body;

  if (!email || !archetype || !dimensionScores || !philosophyBlend) {
    return NextResponse.json(
      { error: "Missing required fields: email, archetype, dimensionScores, philosophyBlend" },
      { status: 400 },
    );
  }

  // If email matches an existing account, link it
  let accountId: string | null = null;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    accountId = existingUser.id;
  }

  const result = await prisma.compassResult.create({
    data: {
      email,
      archetype,
      dimensionScores,
      philosophyBlend,
      part2Preferences: part2Preferences ?? {},
      ...(accountId && { accountId }),
    },
  });

  // TODO: trigger results email (e.g., via Resend/SendGrid transactional email)

  return NextResponse.json({ id: result.id });
}
