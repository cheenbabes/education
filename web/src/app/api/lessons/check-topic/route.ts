import { NextRequest, NextResponse } from "next/server";

const KG_SERVICE_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
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
    console.error(`check-topic: KG service returned ${res.status}`);
    return NextResponse.json({ safe: true });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
