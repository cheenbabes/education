import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { routeLogger } from "@/lib/logger";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("POST /api/lessons/generate", userId);

  const body = await req.json();

  const res = await fetch(`${KG_SERVICE_URL}/generate-lesson`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    log.error({ status: res.status }, "kg-service error");
    return NextResponse.json({ error: detail }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
