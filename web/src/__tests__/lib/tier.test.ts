/**
 * Tests for tier config, SLUG_TO_TIER mapping, getLimits, and getUsagePeriodStart.
 * getTier() is tested separately since it requires mocking clerkClient.
 */

import { TIERS, SLUG_TO_TIER, getLimits, getUsagePeriodStart, getUsageResetsAt } from "@/lib/tier";

describe("TIERS config", () => {
  it("has compass as default with zero paid limits", () => {
    expect(TIERS.compass.lessons).toBe(3);
    expect(TIERS.compass.worksheets).toBe(0);
    expect(TIERS.compass.children).toBe(0);
    expect(TIERS.compass.clerkSlugs).toHaveLength(0);
  });

  it("has homestead and schoolhouse with correct slugs", () => {
    expect(TIERS.homestead.clerkSlugs).toContain("homestead_monthly");
    expect(TIERS.schoolhouse.clerkSlugs).toContain("schoolhouse_monthly");
  });
});

describe("SLUG_TO_TIER", () => {
  it("maps homestead_monthly to homestead", () => {
    expect(SLUG_TO_TIER["homestead_monthly"]).toBe("homestead");
  });

  it("maps schoolhouse_monthly to schoolhouse", () => {
    expect(SLUG_TO_TIER["schoolhouse_monthly"]).toBe("schoolhouse");
  });

  it("does not map free_user", () => {
    expect(SLUG_TO_TIER["free_user"]).toBeUndefined();
  });

  it("does not map unknown slugs", () => {
    expect(SLUG_TO_TIER["nonexistent_plan"]).toBeUndefined();
  });

  it("is auto-derived from TIERS — adding a new tier entry would auto-register its slugs", () => {
    // Verify every slug in every tier is mapped
    for (const [tierName, config] of Object.entries(TIERS)) {
      for (const slug of config.clerkSlugs) {
        expect(SLUG_TO_TIER[slug]).toBe(tierName);
      }
    }
  });
});

describe("getLimits", () => {
  it("returns correct limits for each tier", () => {
    expect(getLimits("compass")).toEqual({ lessons: 3, worksheets: 0, children: 0 });
    expect(getLimits("homestead")).toEqual({ lessons: 30, worksheets: 5, children: 4 });
    expect(getLimits("schoolhouse")).toEqual({ lessons: 100, worksheets: 15, children: 8 });
  });
});

describe("getUsagePeriodStart", () => {
  it("returns periodStart for paid tiers with billing date", () => {
    const date = new Date("2026-03-15T00:00:00Z");
    expect(getUsagePeriodStart("homestead", date)).toEqual(date);
  });

  it("falls back to calendar month for compass", () => {
    const result = getUsagePeriodStart("compass", null);
    expect(result.getUTCDate()).toBe(1);
  });

  it("falls back to calendar month for paid tier without periodStart", () => {
    const result = getUsagePeriodStart("homestead", null);
    expect(result.getUTCDate()).toBe(1);
  });
});

describe("getUsageResetsAt", () => {
  it("returns periodEnd for paid tiers with billing date", () => {
    const date = new Date("2026-04-15T00:00:00Z");
    expect(getUsageResetsAt("schoolhouse", date)).toEqual(date);
  });

  it("falls back to next month for compass", () => {
    const result = getUsageResetsAt("compass", null);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });
});
