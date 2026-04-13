import { prisma } from "@/lib/prisma";
import {
  getLimits,
  getTier,
  getUsagePeriodStart,
  getUsageResetsAt,
  type Tier,
} from "@/lib/tier";

export interface StandardWorksheetQuotaStatus {
  tier: Tier;
  limit: number;
  used: number;
  remaining: number;
  usagePeriodStart: Date;
  resetsAt: Date;
}

export async function getStandardWorksheetQuotaStatus(
  userId: string,
): Promise<StandardWorksheetQuotaStatus> {
  const { tier, periodStart, periodEnd } = await getTier(userId);
  const limit = getLimits(tier).worksheets;
  const usagePeriodStart = getUsagePeriodStart(tier, periodStart);
  const resetsAt = getUsageResetsAt(tier, periodEnd);
  const used = await prisma.standardWorksheetAccess.count({
    where: { userId, createdAt: { gte: usagePeriodStart } },
  });

  return {
    tier,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    usagePeriodStart,
    resetsAt,
  };
}
