import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://localhost:8000";
const SUBJECTS = ["Math", "Science", "Language Arts", "Social Studies"];

// GET /api/standards?childId=xxx
// Returns standards per subject with coverage from completed lessons
export async function GET(req: NextRequest) {
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

  // Get covered standards from completed lessons
  const coveredObjectives = await prisma.lessonObjective.findMany({
    where: {
      childId,
      lesson: {
        completions: {
          some: { childId },
        },
      },
    },
    include: {
      lesson: { select: { title: true } },
    },
  });

  const coveredMap = new Map<string, string>();
  for (const obj of coveredObjectives) {
    if (!coveredMap.has(obj.standardCode)) {
      coveredMap.set(obj.standardCode, obj.lesson.title);
    }
  }

  // Fetch standards from KG service per subject
  const results = [];
  for (const subject of SUBJECTS) {
    try {
      const res = await fetch(
        `${KG_SERVICE_URL}/standards/${state}/${child.gradeLevel}/${encodeURIComponent(subject)}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const standards = (data.standards || [])
        .filter((s: { description: string }) => s.description.length >= 30) // skip headers
        .map((s: { code: string; description: string; description_plain: string }) => ({
          code: s.code,
          description: s.description_plain || s.description,
          covered: coveredMap.has(s.code),
          lessonTitle: coveredMap.get(s.code) || null,
        }));

      const covered = standards.filter((s: { covered: boolean }) => s.covered).length;

      results.push({
        subject,
        total: standards.length,
        covered,
        standards,
      });
    } catch {
      // KG service might not have standards for this subject/grade
      continue;
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
