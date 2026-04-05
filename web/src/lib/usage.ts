/**
 * Shared usage-period logic.
 *
 * Paid users count usage from their Clerk billing cycle start date.
 * Free users (compass) and paid users without billing dates yet
 * fall back to calendar-month counting (1st of current UTC month).
 */

interface UserWithBillingCycle {
  tier: string;
  billingCycleStart: Date | null;
}

interface UserWithTierExpiry {
  tier: string;
  tierExpiresAt: Date | null;
}

/** Start of the current usage window for counting lessons/worksheets. */
export function getUsagePeriodStart(user: UserWithBillingCycle): Date {
  if (user.tier !== "compass" && user.billingCycleStart) {
    return user.billingCycleStart;
  }
  // Calendar month fallback
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** When the current usage window resets (displayed to the user). */
export function getUsageResetsAt(user: UserWithTierExpiry): Date {
  if (user.tier !== "compass" && user.tierExpiresAt) {
    return user.tierExpiresAt;
  }
  // Calendar month fallback
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
