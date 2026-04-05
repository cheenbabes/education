import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";

const LIMITS = {
  lessons:    { compass: 3,  homestead: 30, schoolhouse: 100 },
  worksheets: { compass: 0,  homestead: 5,  schoolhouse: 15 },
  children:   { compass: 0,  homestead: 4,  schoolhouse: 8  },
} as const;

type Tier = keyof typeof LIMITS.lessons;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateUser(userId);

  const tier = (user.tier || "compass") as Tier;

  // Start of current month (UTC)
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // First day of next month (UTC)
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [lessonsUsed, worksheetsUsed, childrenCount] = await Promise.all([
    prisma.lesson.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.worksheet.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.child.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    tier,
    lessonsUsed,
    lessonsLimit: LIMITS.lessons[tier],
    worksheetsUsed,
    worksheetsLimit: LIMITS.worksheets[tier],
    childrenCount,
    childrenLimit: LIMITS.children[tier],
    resetsAt: resetsAt.toISOString(),
  });
}
