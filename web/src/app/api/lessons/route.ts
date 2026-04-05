import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { getUsagePeriodStart } from "@/lib/usage";

const LESSON_LIMITS: Record<string, number> = {
  compass: 3,
  homestead: 30,
  schoolhouse: 100,
};

// POST /api/lessons — save a generated lesson
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce tier lesson limit
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tier: true, billingCycleStart: true },
  });
  const tier = user?.tier || "compass";
  const limit = LESSON_LIMITS[tier] ?? 3;
  const periodStart = getUsagePeriodStart({ tier, billingCycleStart: user?.billingCycleStart ?? null });
  const used = await prisma.lesson.count({
    where: { userId, createdAt: { gte: periodStart } },
  });
  if (used >= limit) {
    return NextResponse.json(
      { error: "monthly_limit", tier, limit, used },
      { status: 429 },
    );
  }

  const body = await req.json();
  const {
    lesson,
    childIds,
    scheduledDate,
    subjectNames = [],
    generationCostUsd,
  } = body;

  // Create the lesson
  const saved = await prisma.lesson.create({
    data: {
      userId,
      title: lesson.title,
      interest: lesson.theme,
      philosophy: lesson.philosophy,
      subjects: lesson.standards_addressed?.map((s: { code: string }) => s.code) || [],
      subjectNames,
      multiSubjectOptimized: false,
      content: lesson,
      contentHash:
        lesson.content_hash ||
        crypto.createHash("sha256").update(JSON.stringify(lesson)).digest("hex").slice(0, 12),
      generationCostUsd: typeof generationCostUsd === "number" ? generationCostUsd : null,
      lessonChildren: {
        create: childIds.map((childId: string) => ({ childId })),
      },
      lessonObjectives: {
        create: (lesson.standards_addressed || []).flatMap(
          (std: { code: string; description_plain: string }) =>
            childIds.map((childId: string) => ({
              childId,
              standardCode: std.code,
              subject: "",
              descriptionPlain: std.description_plain,
            }))
        ),
      },
      ...(scheduledDate && {
        calendarEntries: {
          // Append T12:00:00 to avoid timezone shifting the date by a day
          create: { userId, scheduledDate: new Date(scheduledDate + "T12:00:00") },
        },
      }),
    },
    include: {
      lessonChildren: true,
      calendarEntries: true,
    },
  });

  return NextResponse.json({ id: saved.id, saved: true });
}

// GET /api/lessons — list all lessons for a user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getOrCreateUser(userId);

  const lessons = await prisma.lesson.findMany({
    where: { userId },
    include: {
      lessonChildren: { include: { child: true } },
      completions: true,
      calendarEntries: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lessons);
}
