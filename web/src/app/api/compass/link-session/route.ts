import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { routeLogger } from "@/lib/logger";

// POST /api/compass/link-session — claim anon compass submissions for the current user.
// Called client-side post-login with the browser's stored sessionId, so results from
// "took quiz anonymously, then signed up" paths get attributed to the account.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  const log = routeLogger("POST /api/compass/link-session", userId);

  if (!sessionId) {
    log.info({ reason: "no sessionId in body" }, "link-session skipped");
    return NextResponse.json({ linked: 0 });
  }

  const result = await prisma.compassResult.updateMany({
    where: { accountId: null, sessionId },
    data: { accountId: userId },
  });

  log.info({ sessionId, linked: result.count }, "link-session completed");
  return NextResponse.json({ linked: result.count });
}
