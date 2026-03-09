import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// POST /api/lessons — save a generated lesson
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    lesson,
    childIds,
    scheduledDate,
    userId = "demo-user", // TODO: replace with auth
  } = body;

  // Create the lesson
  const saved = await prisma.lesson.create({
    data: {
      userId,
      title: lesson.title,
      interest: lesson.theme,
      philosophy: lesson.philosophy,
      subjects: lesson.standards_addressed?.map((s: { code: string }) => s.code) || [],
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
          create: { userId, scheduledDate: new Date(scheduledDate) },
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
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "demo-user";

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
