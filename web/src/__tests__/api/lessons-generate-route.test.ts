import type { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockLessonCount = jest.fn();
const mockGetTier = jest.fn();
const mockRouteLogger = jest.fn();
const mockLogError = jest.fn();
const mockFetch = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    lesson: {
      count: (...args: unknown[]) => mockLessonCount(...args),
    },
  },
}));

jest.mock("@/lib/tier", () => {
  const actual = jest.requireActual("@/lib/tier");
  return {
    ...actual,
    getTier: (...args: unknown[]) => mockGetTier(...args),
  };
});

jest.mock("@/lib/logger", () => ({
  routeLogger: (...args: unknown[]) => mockRouteLogger(...args),
}));

import { POST } from "@/app/api/lessons/generate/route";

const originalFetch = global.fetch;
const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

function makeRequest(body: object): NextRequest {
  return new Request("http://localhost/api/lessons/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeAll(() => {
  Object.defineProperty(global, "fetch", {
    configurable: true,
    writable: true,
    value: mockFetch as unknown as typeof fetch,
  });
});

afterAll(() => {
  Object.defineProperty(global, "fetch", {
    configurable: true,
    writable: true,
    value: originalFetch,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_1" });
  mockGetTier.mockResolvedValue({
    tier: "compass",
    periodStart: null,
    periodEnd: null,
  });
  mockLessonCount.mockResolvedValue(0);
  mockRouteLogger.mockReturnValue({ error: mockLogError });
  mockFetch.mockResolvedValue(jsonResponse({ lesson: { title: "Fraction Lab" } }));
});

describe("POST /api/lessons/generate", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockRouteLogger).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 429 when the monthly lesson quota is exhausted", async () => {
    mockLessonCount.mockResolvedValue(3);

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "monthly_limit",
      tier: "compass",
      limit: 3,
      used: 3,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 502 when the KG service request throws", async () => {
    mockFetch.mockRejectedValue(new Error("socket hang up"));

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "generation_failed" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "kg-service request failed",
    );
  });

  it("maps upstream 4xx failures to invalid_generation_request", async () => {
    mockFetch.mockResolvedValue(new Response("bad request", { status: 422 }));

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_generation_request" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 422,
        detail: "bad request",
      }),
      "kg-service error",
    );
  });

  it("maps upstream 5xx failures to generation_failed", async () => {
    mockFetch.mockResolvedValue(new Response("boom", { status: 503 }));

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "generation_failed" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 503,
        detail: "boom",
      }),
      "kg-service error",
    );
  });

  it("returns 502 when the KG service responds with invalid JSON", async () => {
    mockFetch.mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(makeRequest({ topic: "fractions" }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "generation_failed" });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.anything() }),
      "invalid kg-service JSON",
    );
  });

  it("proxies successful generation responses unchanged", async () => {
    const payload = {
      topic: "fractions",
      childId: "child_1",
    };

    const res = await POST(makeRequest(payload));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ lesson: { title: "Fraction Lab" } });
    expect(mockRouteLogger).toHaveBeenCalledWith(
      "POST /api/lessons/generate",
      "user_1",
    );
    expect(mockGetTier).toHaveBeenCalledWith("user_1");
    expect(mockLessonCount).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        createdAt: { gte: expect.any(Date) },
      },
    });
    expect(mockFetch).toHaveBeenCalledWith(`${KG_SERVICE_URL}/generate-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });
});
