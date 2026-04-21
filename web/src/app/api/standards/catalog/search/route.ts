import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

const VALID_GRADES = new Set(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);

// POST /api/standards/catalog/search
// Body: { query, state, grade }
// Semantic search across standards for a state+grade. No coverage data.
// Used by the free-tier /standards lesson-seed view where there is no child record.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string; state?: string; grade?: string };
  const query = (body.query || "").trim();
  const state = (body.state || "MI").toUpperCase();
  const grade = body.grade || "3";

  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  if (!/^[A-Z]{2}$/.test(state) || !VALID_GRADES.has(grade)) {
    return NextResponse.json({ error: "Invalid state or grade" }, { status: 400 });
  }

  let kgResponse: {
    results?: Array<{
      code: string;
      description: string;
      description_plain?: string;
      subject: string;
      score: number;
      domain?: string;
    }>;
  } | null = null;

  try {
    const res = await fetch(`${KG_SERVICE_URL}/search-standards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, state, grade }),
    });
    if (res.ok) kgResponse = await res.json();
  } catch {
    /* fall through to empty results */
  }

  const results = (kgResponse?.results || []).map((r) => ({
    code: r.code,
    description: r.description_plain || r.description,
    subject: r.subject,
    score: r.score,
    domain: r.domain,
  }));

  return NextResponse.json({ query, state, grade, results, total: results.length });
}
