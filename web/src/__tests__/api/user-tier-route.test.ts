const mockAuth = jest.fn();
const mockGetOrCreateUser = jest.fn();
const mockGetTier = jest.fn();
const mockGetStandardWorksheetQuotaStatus = jest.fn();
const mockLessonCount = jest.fn();
const mockChildCount = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/getOrCreateUser", () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

jest.mock("@/lib/tier", () => ({
  getTier: (...args: unknown[]) => mockGetTier(...args),
  getLimits: () => ({ lessons: 30, worksheets: 5, children: 4 }),
  getUsagePeriodStart: () => new Date("2026-04-01T00:00:00.000Z"),
  getUsageResetsAt: () => new Date("2026-05-01T00:00:00.000Z"),
}));

jest.mock("@/lib/standardWorksheetQuota", () => ({
  getStandardWorksheetQuotaStatus: (...args: unknown[]) =>
    mockGetStandardWorksheetQuotaStatus(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    lesson: {
      count: (...args: unknown[]) => mockLessonCount(...args),
    },
    child: {
      count: (...args: unknown[]) => mockChildCount(...args),
    },
  },
}));

import { GET } from "@/app/api/user/tier/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockGetOrCreateUser.mockResolvedValue({ id: "user_123" });
  mockGetTier.mockResolvedValue({
    tier: "homestead",
    periodStart: new Date("2026-04-01T00:00:00.000Z"),
    periodEnd: new Date("2026-05-01T00:00:00.000Z"),
  });
  mockGetStandardWorksheetQuotaStatus.mockResolvedValue({
    tier: "homestead",
    limit: 5,
    used: 3,
    remaining: 2,
    usagePeriodStart: new Date("2026-04-01T00:00:00.000Z"),
    resetsAt: new Date("2026-05-01T00:00:00.000Z"),
  });
  mockLessonCount.mockResolvedValue(7);
  mockChildCount.mockResolvedValue(2);
});

describe("GET /api/user/tier", () => {
  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockGetOrCreateUser).not.toHaveBeenCalled();
  });

  it("uses the standard worksheet access ledger for worksheet usage", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetOrCreateUser).toHaveBeenCalledWith("user_123");
    expect(mockLessonCount).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        createdAt: { gte: new Date("2026-04-01T00:00:00.000Z") },
      },
    });
    expect(mockGetStandardWorksheetQuotaStatus).toHaveBeenCalledWith("user_123");
    expect(body).toMatchObject({
      tier: "homestead",
      lessonsUsed: 7,
      lessonsLimit: 30,
      worksheetsUsed: 3,
      worksheetsLimit: 5,
      childrenCount: 2,
      childrenLimit: 4,
      resetsAt: "2026-05-01T00:00:00.000Z",
    });
  });
});
