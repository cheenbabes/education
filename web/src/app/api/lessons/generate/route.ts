import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { routeLogger } from "@/lib/logger";
import { getLessonQuotaStatus } from "@/lib/lessonQuota";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("POST /api/lessons/generate", userId);
  const { tier, limit, used } = await getLessonQuotaStatus(userId);
  if (used >= limit) {
    return NextResponse.json(
      { error: "monthly_limit", tier, limit, used },
      { status: 429 },
    );
  }

  const body = await req.json();
  let res: Response;
  try {
    res = await fetch(`${KG_SERVICE_URL}/generate-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    log.error({ err }, "kg-service request failed");
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error(
      { status: res.status, detail: detail.slice(0, 500) },
      "kg-service error",
    );
    return NextResponse.json(
      { error: res.status >= 500 ? "generation_failed" : "invalid_generation_request" },
      { status: res.status >= 500 ? 502 : 400 },
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    log.error({ err }, "invalid kg-service JSON");
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }

  return NextResponse.json(data);
}
