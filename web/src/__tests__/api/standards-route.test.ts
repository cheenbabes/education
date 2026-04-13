import { NextRequest } from "next/server";

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

import { GET } from "@/app/api/standards/route";

const originalFetch = global.fetch;
const KG_SERVICE_URL = process.env.KG_SERVICE_URL || "http://localhost:8000";

function makeRequest(url = "http://localhost/api/standards?childId=child_1") {
  return new NextRequest(url);
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
    gradeLevel: "3",
    standardsOptIn: true,
    user: { state: "CA" },
  });
  mockLessonObjectiveFindMany.mockResolvedValue([
    {
      standardCode: "MATH.1",
      lesson: { title: "First Lesson" },
    },
    {
      standardCode: "MATH.1",
      lesson: { title: "Duplicate Lesson" },
    },
    {
      standardCode: "SCI.1",
      lesson: { title: "Weather Lab" },
    },
  ]);
  mockFetch.mockResolvedValue(
    jsonResponse({
      subjects: [
        {
          subject: "math",
          standards: [
            {
              code: "MATH.1",
              description: "Long fallback description for addition facts and fluency work.",
              description_plain: "Add within 20 and explain the strategy.",
            },
            {
              code: "MATH.2",
              description: "Long fallback description for skip counting and number patterns.",
              description_plain: "Count by fives and tens in real contexts.",
            },
            {
              code: "MATH.SHORT",
              description: "Too short",
              description_plain: "Too short",
            },
          ],
        },
        {
          subject: "science",
          standards: [
            {
              code: "SCI.1",
              description: "Long fallback description for observing daily weather changes.",
              description_plain: "Observe and record weather patterns over time.",
            },
          ],
        },
      ],
    }),
  );
});

describe("GET /api/standards", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockChildFindFirst).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when childId is missing", async () => {
    const res = await GET(makeRequest("http://localhost/api/standards"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "childId required" });
    expect(mockChildFindFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the child is not owned by the user", async () => {
    mockChildFindFirst.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Child not found" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when standards tracking is disabled for the child", async () => {
    mockChildFindFirst.mockResolvedValue({
      id: "child_1",
      name: "Ada",
      gradeLevel: "3",
      standardsOptIn: false,
      user: { state: "CA" },
    });

    const res = await GET(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Standards tracking is off for this child",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns filtered standards with coverage and the first matching lesson title", async () => {
    const res = await GET(makeRequest());
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
    expect(mockFetch).toHaveBeenCalledWith(
      `${KG_SERVICE_URL}/standards/CA/3`,
      { cache: "no-store" },
    );
    expect(body).toEqual({
      childId: "child_1",
      childName: "Ada",
      gradeLevel: "3",
      state: "CA",
      subjects: [
        {
          subject: "math",
          total: 2,
          covered: 1,
          standards: [
            {
              code: "MATH.1",
              description: "Add within 20 and explain the strategy.",
              covered: true,
              lessonTitle: "First Lesson",
            },
            {
              code: "MATH.2",
              description: "Count by fives and tens in real contexts.",
              covered: false,
              lessonTitle: null,
            },
          ],
        },
        {
          subject: "science",
          total: 1,
          covered: 1,
          standards: [
            {
              code: "SCI.1",
              description: "Observe and record weather patterns over time.",
              covered: true,
              lessonTitle: "Weather Lab",
            },
          ],
        },
      ],
    });
  });

  it("falls back to MI when the child has no state on record", async () => {
    mockChildFindFirst.mockResolvedValue({
      id: "child_1",
      name: "Ada",
      gradeLevel: "3",
      standardsOptIn: true,
      user: { state: null },
    });
    mockFetch.mockResolvedValue(jsonResponse({ subjects: [] }));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      `${KG_SERVICE_URL}/standards/MI/3`,
      { cache: "no-store" },
    );
    expect(body.state).toBe("MI");
  });
});
