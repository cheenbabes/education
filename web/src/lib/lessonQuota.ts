import { prisma } from "@/lib/prisma";
import { getLimits, getTier, getUsagePeriodStart, type Tier } from "@/lib/tier";

export interface LessonQuotaStatus {
  tier: Tier;
  limit: number;
  used: number;
  usagePeriodStart: Date;
}

export async function getLessonQuotaStatus(userId: string): Promise<LessonQuotaStatus> {
  const { tier, periodStart } = await getTier(userId);
  const limit = getLimits(tier).lessons;
  const usagePeriodStart = getUsagePeriodStart(tier, periodStart);
  const used = await prisma.lesson.count({
    where: { userId, createdAt: { gte: usagePeriodStart } },
  });

  return {
    tier,
    limit,
    used,
    usagePeriodStart,
  };
}
