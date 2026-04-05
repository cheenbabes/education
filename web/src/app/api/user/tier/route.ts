import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { getUsagePeriodStart, getUsageResetsAt } from "@/lib/usage";

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

  // Ensure user exists in DB, then fetch with billing fields
  await getOrCreateUser(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, billingCycleStart: true, tierExpiresAt: true },
  });

  const tier = (user?.tier || "compass") as Tier;
  const periodStart = getUsagePeriodStart({ tier, billingCycleStart: user?.billingCycleStart ?? null });
  const resetsAt = getUsageResetsAt({ tier, tierExpiresAt: user?.tierExpiresAt ?? null });

  const [lessonsUsed, worksheetsUsed, childrenCount] = await Promise.all([
    prisma.lesson.count({
      where: { userId, createdAt: { gte: periodStart } },
    }),
    prisma.worksheet.count({
      where: { userId, createdAt: { gte: periodStart } },
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
