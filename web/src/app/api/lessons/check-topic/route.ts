import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { routeLogger } from "@/lib/logger";

const KG_SERVICE_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("POST /api/lessons/check-topic", userId);

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
