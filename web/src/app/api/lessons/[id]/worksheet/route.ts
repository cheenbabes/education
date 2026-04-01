import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const KG_SERVICE_URL = process.env.KG_SERVICE_URL || process.env.NEXT_PUBLIC_KG_SERVICE_URL || "http://127.0.0.1:8000";

const WORKSHEET_LIMITS: Record<string, number> = {
  compass: 0,
  homestead: 5,
  schoolhouse: 15,
};

// POST /api/lessons/[id]/worksheet — generate and save a worksheet for a lesson
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load lesson and verify ownership
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  if (lesson.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Load user tier
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.tier || "compass";

    // Count worksheets generated this calendar month
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const usedThisMonth = await prisma.worksheet.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });
    const limit = WORKSHEET_LIMITS[tier] ?? 0;
    if (usedThisMonth >= limit) {
      return NextResponse.json(
        { error: "worksheet_limit", used: usedThisMonth, limit },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      childId = null,
      childName,
      grade,
    }: { childId?: string | null; childName: string; grade: string } = body;

    // Fetch child's learning notes if a specific child was selected
    let learningNotes: string | null = null;
    if (childId) {
      try {
        const child = await prisma.child.findUnique({ where: { id: childId }, select: { learningNotes: true } });
        learningNotes = child?.learningNotes ?? null;
      } catch {
        // learningNotes column may not exist yet if migration hasn't run; proceed without it
      }
    }

    // Extract lesson content fields for the KG service
    const lessonContent = lesson.content as Record<string, unknown>;
    const lessonSections = (lessonContent?.lesson_sections as unknown[]) ?? [];
    const standardsAddressed = (lessonContent?.standards_addressed as unknown[]) ?? [];
    const interest = (lessonContent?.theme as string) ?? lesson.interest ?? "";

    // Call KG service to generate worksheet
    const kgRes = await fetch(`${KG_SERVICE_URL}/generate-worksheet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_title: lesson.title,
        interest,
        philosophy: lesson.philosophy,
        child_name: childName,
        grade,
        lesson_sections: lessonSections,
        standards_addressed: standardsAddressed,
        learning_notes: learningNotes,
      }),
    });

    if (!kgRes.ok) {
      const detail = await kgRes.text();
      return NextResponse.json(
        { error: "kg_service_error", detail },
        { status: 502 }
      );
    }

    const { worksheet: worksheetContent, cost_usd } = await kgRes.json();

    // Save worksheet to DB
    const saved = await prisma.worksheet.create({
      data: {
        lessonId: lesson.id,
        userId,
        childId: childId ?? null,
        childName: childName ?? null,
        grade,
        philosophy: lesson.philosophy,
        content: worksheetContent,
        costUsd: typeof cost_usd === "number" ? cost_usd : null,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("[worksheet POST]", err);
    return NextResponse.json({ error: "internal_error", detail: String(err) }, { status: 500 });
  }
}

// GET /api/lessons/[id]/worksheet — list all worksheets for a lesson
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const worksheets = await prisma.worksheet.findMany({
    where: { lessonId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(worksheets);
}
