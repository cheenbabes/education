import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { routeLogger } from "@/lib/logger";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

// POST /api/lessons/check-topic — content-safety check for a lesson interest.
// Public: anon users on /create also need to be gated on unsafe topics before
// they ever see the signup modal. Pure moderation proxy — no user data leaves
// the server. Returns {safe: boolean, reason?: string}.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const log = routeLogger("POST /api/lessons/check-topic", userId ?? "anon");

  const { interest } = await req.json();

  if (!interest || typeof interest !== "string") {
    return NextResponse.json({ safe: false, reason: "No topic provided." }, { status: 400 });
  }

  const res = await fetch(`${KG_SERVICE_URL}/check-topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interest }),
  });

  if (!res.ok) {
    // KG service unavailable — fail open so generation isn't blocked
    log.error({ status: res.status, interest }, "KG service error");
    return NextResponse.json({ safe: true });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
