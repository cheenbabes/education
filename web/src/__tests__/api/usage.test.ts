import { getUsagePeriodStart, getUsageResetsAt } from "@/lib/usage";

describe("getUsagePeriodStart", () => {
  it("returns billingCycleStart for paid user with dates", () => {
    const start = new Date("2026-03-15T00:00:00Z");
    const result = getUsagePeriodStart({ tier: "homestead", billingCycleStart: start });
    expect(result).toEqual(start);
  });

  it("returns billingCycleStart for schoolhouse user", () => {
    const start = new Date("2026-02-20T12:00:00Z");
    const result = getUsagePeriodStart({ tier: "schoolhouse", billingCycleStart: start });
    expect(result).toEqual(start);
  });

  it("returns 1st of current UTC month for free user", () => {
    const result = getUsagePeriodStart({ tier: "compass", billingCycleStart: null });
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    expect(result).toEqual(expected);
  });

  it("returns 1st of current UTC month for free user even if billingCycleStart set", () => {
    // Edge case: compass user somehow has a billing date (shouldn't happen, but test fallback)
    const result = getUsagePeriodStart({ tier: "compass", billingCycleStart: new Date("2026-01-01") });
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    expect(result).toEqual(expected);
  });

  it("returns calendar month for paid user with null billingCycleStart (fallback)", () => {
    const result = getUsagePeriodStart({ tier: "homestead", billingCycleStart: null });
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    expect(result).toEqual(expected);
  });
});

describe("getUsageResetsAt", () => {
  it("returns tierExpiresAt for paid user with dates", () => {
    const expiry = new Date("2026-04-15T00:00:00Z");
    const result = getUsageResetsAt({ tier: "homestead", tierExpiresAt: expiry });
    expect(result).toEqual(expiry);
  });

  it("returns 1st of next UTC month for free user", () => {
    const result = getUsageResetsAt({ tier: "compass", tierExpiresAt: null });
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    expect(result).toEqual(expected);
  });

  it("returns calendar month for paid user with null tierExpiresAt (fallback)", () => {
    const result = getUsageResetsAt({ tier: "schoolhouse", tierExpiresAt: null });
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    expect(result).toEqual(expected);
  });
});
