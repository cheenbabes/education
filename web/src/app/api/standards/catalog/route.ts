import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

const VALID_GRADES = new Set(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);

// GET /api/standards/catalog?state=MI&grade=3
// Returns all standards for a state+grade grouped by subject. No coverage data.
// Used by the free-tier /standards lesson-seed view where there is no child record.
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = (req.nextUrl.searchParams.get("state") || "MI").toUpperCase();
  const grade = req.nextUrl.searchParams.get("grade") || "3";

  if (!/^[A-Z]{2}$/.test(state) || !VALID_GRADES.has(grade)) {
    return NextResponse.json({ error: "Invalid state or grade" }, { status: 400 });
  }

  let kgResponse: {
    subjects?: Array<{
      subject: string;
      standards: Array<{ code: string; description: string; description_plain?: string }>;
    }>;
  } | null = null;
  try {
    const res = await fetch(`${KG_SERVICE_URL}/standards/${state}/${grade}`, { cache: "no-store" });
    if (res.ok) kgResponse = await res.json();
  } catch {
    /* fall through to empty response */
  }

  const subjects = (kgResponse?.subjects || []).map((s) => ({
    subject: s.subject,
    standards: (s.standards || [])
      .filter((std) => std.description.length >= 30)
      .map((std) => ({
        code: std.code,
        description: std.description_plain || std.description,
      })),
  }));

  const total = subjects.reduce((n, s) => n + s.standards.length, 0);

  return NextResponse.json({ state, grade, subjects, total });
}
