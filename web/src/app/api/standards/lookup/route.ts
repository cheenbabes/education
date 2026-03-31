import { NextRequest, NextResponse } from "next/server";

const KG_SERVICE_URL = process.env.NEXT_PUBLIC_KG_SERVICE_URL || process.env.KG_SERVICE_URL || "http://localhost:8000";

// GET /api/standards/lookup?codes=CODE1,CODE2,CODE3
// Returns { [code]: description } map
export async function GET(req: NextRequest) {
  const codesParam = req.nextUrl.searchParams.get("codes") || "";
  const codes = codesParam.split(",").filter(Boolean);

  if (codes.length === 0) {
    return NextResponse.json({});
  }

  try {
    const res = await fetch(`${KG_SERVICE_URL}/standards/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes }),
    });

    if (!res.ok) {
      return NextResponse.json({});
    }

    const data = await res.json();
    const map: Record<string, string> = {};
    for (const item of data.results || []) {
      map[item.code] = item.description_plain || item.description;
    }
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({});
  }
}
