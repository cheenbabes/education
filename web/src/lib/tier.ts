/**
 * Tier configuration and helpers.
 *
 * Tier resolution order:
 * 1. DB tierOverride on User (admin, enterprise, etc.)
 * 2. Clerk billing subscription (paying customers)
 * 3. Fallback → "compass" (free)
 *
 * ── Adding a new plan ──
 * 1. Create the plan in Clerk Dashboard (e.g. slug "academy_monthly")
 * 2. Add one entry to TIERS below — that's it.
 *
 * ── Adding an enterprise/custom tier ──
 * 1. Add one entry to TIERS below (e.g. acme_academy)
 * 2. Set tierOverride on the user in the DB
 */

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ── Tier config (single source of truth) ─────────────────────────────────────

export const TIERS = {
  compass:     { clerkSlugs: [] as string[],              lessons: 3,   worksheets: 0,  children: 0  },
  homestead:   { clerkSlugs: ["homestead_monthly"],       lessons: 30,  worksheets: 5,  children: 4  },
  schoolhouse: { clerkSlugs: ["schoolhouse_monthly"],     lessons: 100, worksheets: 15, children: 8  },
  unlimited:   { clerkSlugs: [] as string[],              lessons: Infinity, worksheets: Infinity, children: Infinity },
  // Enterprise tiers — add per customer:
  // acme_academy: { clerkSlugs: [] as string[], lessons: 500, worksheets: 100, children: 50 },
} as const;

export type Tier = keyof typeof TIERS;

// Derived: clerk slug → tier name (auto-built from TIERS)
const SLUG_TO_TIER = Object.entries(TIERS).reduce<Record<string, Tier>>(
  (acc, [tier, config]) => {
    for (const slug of config.clerkSlugs) acc[slug] = tier as Tier;
    return acc;
  },
  {},
);

// ── Server-side: read tier from Clerk API ────────────────────────────────────

export async function getTier(userId: string): Promise<{
  tier: Tier;
  periodStart: Date | null;
  periodEnd: Date | null;
}> {
  // Layer 1: DB-level tier override (admin, enterprise, etc.)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tierOverride: true },
  });
  if (user?.tierOverride && user.tierOverride in TIERS) {
    return { tier: user.tierOverride as Tier, periodStart: null, periodEnd: null };
  }

  // Layer 2: Clerk billing (source of truth for paying customers)
  try {
    const client = await clerkClient();
    const sub = await client.billing.getUserBillingSubscription(userId);

    // Find the active subscription item with a paid plan
    const paidItem = sub.subscriptionItems?.find(
      (item) => item.status === "active" && item.plan && SLUG_TO_TIER[item.plan.slug],
    );

    if (paidItem?.plan) {
      return {
        tier: SLUG_TO_TIER[paidItem.plan.slug],
        periodStart: paidItem.periodStart ? new Date(paidItem.periodStart) : null,
        periodEnd: paidItem.periodEnd ? new Date(paidItem.periodEnd) : null,
      };
    }
  } catch (err) {
    logger.error({ err, userId }, "failed to read subscription from Clerk");
  }

  return { tier: "compass", periodStart: null, periodEnd: null };
}

// ── Limits helper ────────────────────────────────────────────────────────────

export function getLimits(tier: Tier) {
  const t = TIERS[tier];
  return { lessons: t.lessons, worksheets: t.worksheets, children: t.children };
}

// ── Usage period ─────────────────────────────────────────────────────────────

/** Start of the current usage window (billing period or calendar month). */
export function getUsagePeriodStart(tier: Tier, periodStart: Date | null): Date {
  if (tier !== "compass" && periodStart) return periodStart;
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** When the current usage window resets.
 *
 * Clerk can return a stale `periodEnd` in the past for tier-override accounts
 * or mid-renewal states; guard so callers never see a reset date that's
 * already elapsed — fall back to the first of next calendar month in UTC.
 */
export function getUsageResetsAt(tier: Tier, periodEnd: Date | null): Date {
  const now = new Date();
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  if (tier === "compass") return nextMonthStart;
  if (!periodEnd) return nextMonthStart;
  if (periodEnd.getTime() <= now.getTime()) return nextMonthStart;
  return periodEnd;
}

// ── Export slug lookup for tests ─────────────────────────────────────────────

export { SLUG_TO_TIER };
