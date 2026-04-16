import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/getOrCreateUser";
import { getTier, getLimits, getUsagePeriodStart, getUsageResetsAt } from "@/lib/tier";
import { routeLogger } from "@/lib/logger";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await getOrCreateUser(userId);

  // Read tier from Clerk (source of truth)
  const { tier, periodStart, periodEnd } = await getTier(userId);
  const limits = getLimits(tier);
  const usagePeriodStart = getUsagePeriodStart(tier, periodStart);
  const resetsAt = getUsageResetsAt(tier, periodEnd);

  // Count usage from our DB
  const [lessonsUsed, worksheetsUsed, childrenCount] = await Promise.all([
    prisma.lesson.count({
      where: { userId, createdAt: { gte: usagePeriodStart } },
    }),
    prisma.worksheet.count({
      where: { userId, createdAt: { gte: usagePeriodStart } },
    }),
    prisma.child.count({ where: { userId } }),
  ]);

  const log = routeLogger("GET /api/user/tier", userId);
  log.info({ tier, lessonsUsed, lessonsLimit: limits.lessons }, "tier info served");

  return NextResponse.json({
    tier,
    lessonsUsed,
    lessonsLimit: Number.isFinite(limits.lessons) ? limits.lessons : -1,
    worksheetsUsed,
    worksheetsLimit: Number.isFinite(limits.worksheets) ? limits.worksheets : -1,
    childrenCount,
    childrenLimit: Number.isFinite(limits.children) ? limits.children : -1,
    resetsAt: resetsAt.toISOString(),
  });
}
