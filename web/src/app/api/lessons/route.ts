import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { getLessonQuotaStatus } from "@/lib/lessonQuota";
import { routeLogger } from "@/lib/logger";
import { captureServerEvent } from "@/lib/posthog-server";

// POST /api/lessons — save a generated lesson
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier, limit, used } = await getLessonQuotaStatus(userId);
  if (used >= limit) {
    return NextResponse.json(
      { error: "monthly_limit", tier, limit, used },
      { status: 429 },
    );
  }

  const log = routeLogger("POST /api/lessons", userId);
  const body = await req.json();
  const {
    lesson,
    childIds,
    scheduledDate,
    subjectNames = [],
    generationCostUsd,
  } = body;
  log.info({ interest: lesson?.theme, subject: subjectNames, childIds }, "request received");

  // Create the lesson
  let saved;
  try {
    saved = await prisma.lesson.create({
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
  } catch (err) {
    log.error({ err }, "lesson create failed");
    captureServerEvent(userId, "lesson_create_failed", {
      reason: err instanceof Error ? err.message : "unknown",
      philosophy: lesson?.philosophy,
      source: "api_lessons_post",
    });
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  log.info({ lessonId: saved.id, status: 201 }, "lesson created");

  // Emit server-side so we don't race with the client's router.push after
  // /create completes. Client-side lesson_create_succeeded was under-firing
  // because the page unloaded before PostHog flushed the event. This captures
  // every persisted lesson with authoritative timing.
  captureServerEvent(userId, "lesson_create_succeeded", {
    lesson_id: saved.id,
    philosophy: lesson?.philosophy,
    subject_count: Array.isArray(subjectNames) ? subjectNames.length : 0,
    child_count: Array.isArray(childIds) ? childIds.length : 0,
    tier,
    source: "api_lessons_post",
  });

  return NextResponse.json({ id: saved.id, saved: true });
}

// GET /api/lessons — list all lessons for a user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = routeLogger("GET /api/lessons", userId);
  log.info("request received");

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
