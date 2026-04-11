import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findOwnedChild } from "@/lib/ownership";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

// POST /api/standards/search
// Proxies to the KG service's semantic search endpoint and enriches
// results with coverage data from the database.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { query, childId } = body as { query: string; childId: string };

  if (!query || !childId) {
    return NextResponse.json(
      { error: "query and childId are required" },
      { status: 400 }
    );
  }

  const child = await findOwnedChild(userId, childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const state = child.user?.state || "MI";

  // Fetch coverage data and search results in parallel
  const [coveredObjectives, kgResponse] = await Promise.all([
    prisma.lessonObjective.findMany({
      where: {
        childId,
        lesson: { completions: { some: { childId } } },
      },
      include: { lesson: { select: { title: true } } },
    }),
    fetch(`${KG_SERVICE_URL}/search-standards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        state,
        grade: child.gradeLevel,
      }),
    }).then((r) => {
      if (!r.ok) throw new Error(`KG service error ${r.status}`);
      return r.json();
    }),
  ]);

  const coveredMap = new Map<string, string>();
  for (const obj of coveredObjectives) {
    if (!coveredMap.has(obj.standardCode)) {
      coveredMap.set(obj.standardCode, obj.lesson.title);
    }
  }

  // Enrich results with coverage info
  const results = (kgResponse.results || []).map(
    (r: {
      code: string;
      description: string;
      description_plain: string;
      subject: string;
      score: number;
      domain?: string;
      cluster?: string;
    }) => ({
      code: r.code,
      description: r.description_plain || r.description,
      subject: r.subject,
      score: r.score,
      covered: coveredMap.has(r.code),
      lessonTitle: coveredMap.get(r.code) || null,
    })
  );

  return NextResponse.json({
    query,
    results,
    total: results.length,
  });
}
