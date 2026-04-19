import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// POST /api/compass/link-session — claim anon compass submissions for the current user.
// Called client-side post-login with the browser's stored sessionId, so results from
// "took quiz anonymously, then signed up" paths get attributed to the account.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ linked: 0 });

  const result = await prisma.compassResult.updateMany({
    where: { accountId: null, sessionId },
    data: { accountId: userId },
  });

  return NextResponse.json({ linked: result.count });
}
