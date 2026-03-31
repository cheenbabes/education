import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";

// GET /api/standards?childId=xxx
// Returns standards per subject with coverage from completed lessons
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: { user: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  if (!child.standardsOptIn) {
    return NextResponse.json({ error: "Standards tracking is off for this child" }, { status: 400 });
  }

  const state = child.user?.state || "MI";

  // Fetch covered standards and all standards in parallel
  const [coveredObjectives, kgResponse] = await Promise.all([
    prisma.lessonObjective.findMany({
      where: {
        childId,
        lesson: { completions: { some: { childId } } },
      },
      include: { lesson: { select: { title: true } } },
    }),
    fetch(
      `${KG_SERVICE_URL}/standards/${state}/${child.gradeLevel}`,
      { cache: "no-store" }
    ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  const coveredMap = new Map<string, string>();
  for (const obj of coveredObjectives) {
    if (!coveredMap.has(obj.standardCode)) {
      coveredMap.set(obj.standardCode, obj.lesson.title);
    }
  }

  // Process KG response (single call returns all subjects)
  const results = [];
  if (kgResponse?.subjects) {
    for (const subjectData of kgResponse.subjects) {
      const standards = (subjectData.standards || [])
        .filter((s: { description: string }) => s.description.length >= 30)
        .map((s: { code: string; description: string; description_plain: string }) => ({
          code: s.code,
          description: s.description_plain || s.description,
          covered: coveredMap.has(s.code),
          lessonTitle: coveredMap.get(s.code) || null,
        }));

      const covered = standards.filter((s: { covered: boolean }) => s.covered).length;

      results.push({
        subject: subjectData.subject,
        total: standards.length,
        covered,
        standards,
      });
    }
  }

  return NextResponse.json({
    childId,
    childName: child.name,
    gradeLevel: child.gradeLevel,
    state,
    subjects: results,
  });
}
