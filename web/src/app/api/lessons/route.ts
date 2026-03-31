import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

// POST /api/lessons — save a generated lesson
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    lesson,
    childIds,
    scheduledDate,
    subjectNames = [],
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

  // Auto-create User record on first API call
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@clerk.placeholder` },
  });

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
