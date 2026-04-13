import type { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockChildFindFirst = jest.fn();
const mockLessonObjectiveFindMany = jest.fn();
const mockFetch = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    child: {
      findFirst: (...args: unknown[]) => mockChildFindFirst(...args),
    },
    lessonObjective: {
      findMany: (...args: unknown[]) => mockLessonObjectiveFindMany(...args),
    },
  },
}));

import { POST } from "@/app/api/standards/search/route";

const originalFetch = global.fetch;
const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

function makeRequest(body: object): NextRequest {
  return new Request("http://localhost/api/standards/search", {
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
  mockChildFindFirst.mockResolvedValue({
    id: "child_1",
    name: "Ada",
    gradeLevel: "4",
    standardsOptIn: true,
    user: { state: "WA" },
  });
  mockLessonObjectiveFindMany.mockResolvedValue([
    { standardCode: "ELA.1", lesson: { title: "Poetry Day" } },
    { standardCode: "ELA.1", lesson: { title: "Second Match" } },
  ]);
  mockFetch.mockResolvedValue(
    jsonResponse({
      results: [
        {
          code: "ELA.1",
          description: "Long fallback description for reading theme in stories.",
          description_plain: "Determine a theme and explain supporting details.",
          subject: "language_arts",
          score: 0.94,
          domain: "Reading Literature",
        },
        {
          code: "ELA.2",
          description: "Long fallback description for comparing narrative structures.",
          description_plain: "Compare story structure across two texts.",
          subject: "language_arts",
          score: 0.71,
          cluster: "Craft and Structure",
        },
      ],
    }),
  );
});

describe("POST /api/standards/search", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ query: "theme", childId: "child_1" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockChildFindFirst).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when query or childId is missing", async () => {
    const res = await POST(makeRequest({ query: "", childId: "child_1" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "query and childId are required",
    });
    expect(mockChildFindFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the child is not owned by the user", async () => {
    mockChildFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ query: "theme", childId: "child_1" }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Child not found" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("proxies the KG search and enriches results with local coverage", async () => {
    const res = await POST(makeRequest({ query: "theme", childId: "child_1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockChildFindFirst).toHaveBeenCalledWith({
      where: { id: "child_1", userId: "user_1" },
      include: { user: { select: { state: true } } },
    });
    expect(mockLessonObjectiveFindMany).toHaveBeenCalledWith({
      where: {
        childId: "child_1",
        lesson: { completions: { some: { childId: "child_1" } } },
      },
      include: { lesson: { select: { title: true } } },
    });
    expect(mockFetch).toHaveBeenCalledWith(`${KG_SERVICE_URL}/search-standards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "theme",
        state: "WA",
        grade: "4",
      }),
    });
    expect(body).toEqual({
      query: "theme",
      total: 2,
      results: [
        {
          code: "ELA.1",
          description: "Determine a theme and explain supporting details.",
          subject: "language_arts",
          score: 0.94,
          covered: true,
          lessonTitle: "Poetry Day",
        },
        {
          code: "ELA.2",
          description: "Compare story structure across two texts.",
          subject: "language_arts",
          score: 0.71,
          covered: false,
          lessonTitle: null,
        },
      ],
    });
  });

  it("falls back to MI when the child has no state on record", async () => {
    mockChildFindFirst.mockResolvedValue({
      id: "child_1",
      name: "Ada",
      gradeLevel: "4",
      standardsOptIn: true,
      user: { state: null },
    });
    mockFetch.mockResolvedValue(jsonResponse({ results: [] }));

    const res = await POST(makeRequest({ query: "theme", childId: "child_1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(`${KG_SERVICE_URL}/search-standards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "theme",
        state: "MI",
        grade: "4",
      }),
    });
    expect(body).toEqual({ query: "theme", results: [], total: 0 });
  });
});
