/**
 * Tier configuration and helpers.
 *
 * Clerk is the source of truth for billing state. We read the user's
 * subscription from Clerk and map plan slugs to tier names + limits.
 *
 * ── Adding a new plan ──
 * 1. Create the plan in Clerk Dashboard (e.g. slug "academy_monthly")
 * 2. Add one entry to TIERS below — that's it.
 */

import { clerkClient } from "@clerk/nextjs/server";

// ── Tier config (single source of truth) ─────────────────────────────────────

export const TIERS = {
  compass:     { clerkSlugs: [] as string[],              lessons: 3,   worksheets: 0,  children: 0  },
  homestead:   { clerkSlugs: ["homestead_monthly"],       lessons: 30,  worksheets: 5,  children: 4  },
  schoolhouse: { clerkSlugs: ["schoolhouse_monthly"],     lessons: 100, worksheets: 15, children: 8  },
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
    console.error("[tier] Failed to read subscription from Clerk:", err);
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

/** When the current usage window resets. */
export function getUsageResetsAt(tier: Tier, periodEnd: Date | null): Date {
  if (tier !== "compass" && periodEnd) return periodEnd;
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

// ── Export slug lookup for tests ─────────────────────────────────────────────

export { SLUG_TO_TIER };
