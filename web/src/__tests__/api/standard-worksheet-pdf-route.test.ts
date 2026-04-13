import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockIsWorksheetsEnabled = jest.fn();
const mockGetOrCreateUser = jest.fn();
const mockGetStandardWorksheetQuotaStatus = jest.fn();
const mockRenderToBuffer = jest.fn();
const mockWorksheetPdf = jest.fn();
const mockStandardWorksheetFindUnique = jest.fn();
const mockLessonFindUnique = jest.fn();
const mockStandardWorksheetAccessCreate = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/featureFlags", () => ({
  isWorksheetsEnabled: (...args: unknown[]) => mockIsWorksheetsEnabled(...args),
}));

jest.mock("@/lib/getOrCreateUser", () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

jest.mock("@/lib/standardWorksheetQuota", () => ({
  getStandardWorksheetQuotaStatus: (...args: unknown[]) =>
    mockGetStandardWorksheetQuotaStatus(...args),
}));

jest.mock("@react-pdf/renderer", () => ({
  renderToBuffer: (...args: unknown[]) => mockRenderToBuffer(...args),
}));

jest.mock("@/components/pdf/WorksheetPdf", () => ({
  WorksheetPdf: (...args: unknown[]) => mockWorksheetPdf(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    standardWorksheet: {
      findUnique: (...args: unknown[]) => mockStandardWorksheetFindUnique(...args),
    },
    lesson: {
      findUnique: (...args: unknown[]) => mockLessonFindUnique(...args),
    },
    standardWorksheetAccess: {
      create: (...args: unknown[]) => mockStandardWorksheetAccessCreate(...args),
    },
  },
}));

import { GET } from "@/app/api/worksheets/standard/[id]/pdf/route";

function makeRequest(url = "http://localhost/api/worksheets/standard/ws_1/pdf?lessonId=lesson_1") {
  return new NextRequest(url);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockIsWorksheetsEnabled.mockResolvedValue(true);
  mockGetOrCreateUser.mockResolvedValue({ id: "user_123" });
  mockGetStandardWorksheetQuotaStatus.mockResolvedValue({
    tier: "homestead",
    limit: 5,
    used: 1,
    remaining: 4,
    usagePeriodStart: new Date("2026-04-01T00:00:00.000Z"),
    resetsAt: new Date("2026-05-01T00:00:00.000Z"),
  });
  mockStandardWorksheetFindUnique.mockResolvedValue({
    id: "ws_1",
    clusterKey: "cluster-fractions",
    clusterTitle: "Grade 3 Math: Fractions",
    grade: "3",
    subject: "Math",
    worksheetNum: 2,
    worksheetType: "practice",
    title: "Fractions — Practice",
    standardCodes: ["STD.1"],
    content: {
      context: "Practice fractions.",
      problems: [],
      answerKey: [],
    },
  });
  mockLessonFindUnique.mockResolvedValue({
    id: "lesson_1",
    userId: "user_123",
  });
  mockWorksheetPdf.mockReturnValue("mock-pdf-document");
  mockRenderToBuffer.mockResolvedValue(Buffer.from("%PDF-1.4"));
  mockStandardWorksheetAccessCreate.mockResolvedValue({ id: "access_1" });
});

describe("GET /api/worksheets/standard/[id]/pdf", () => {
  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(makeRequest(), { params: { id: "ws_1" } });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 429 when the worksheet quota is exhausted", async () => {
    mockGetStandardWorksheetQuotaStatus.mockResolvedValue({
      tier: "homestead",
      limit: 5,
      used: 5,
      remaining: 0,
      usagePeriodStart: new Date("2026-04-01T00:00:00.000Z"),
      resetsAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    const res = await GET(makeRequest(), { params: { id: "ws_1" } });

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "worksheet_limit",
      limit: 5,
      used: 5,
    });
    expect(mockRenderToBuffer).not.toHaveBeenCalled();
    expect(mockStandardWorksheetAccessCreate).not.toHaveBeenCalled();
  });

  it("renders the pdf and records access when the request succeeds", async () => {
    const res = await GET(makeRequest(), { params: { id: "ws_1" } });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      'inline; filename="cluster-fractions-worksheet-2.pdf"',
    );
    expect(mockLessonFindUnique).toHaveBeenCalledWith({
      where: { id: "lesson_1" },
      select: { id: true, userId: true },
    });
    expect(mockWorksheetPdf).toHaveBeenCalledWith({
      title: "Fractions — Practice",
      clusterTitle: "Grade 3 Math: Fractions",
      grade: "3",
      subject: "Math",
      worksheetNum: 2,
      worksheetType: "practice",
      standardCodes: ["STD.1"],
      content: {
        context: "Practice fractions.",
        problems: [],
        answerKey: [],
      },
    });
    expect(mockRenderToBuffer).toHaveBeenCalledWith("mock-pdf-document");
    expect(mockStandardWorksheetAccessCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_123",
        standardWorksheetId: "ws_1",
        lessonId: "lesson_1",
      },
    });

    const body = Buffer.from(await res.arrayBuffer()).toString("utf8");
    expect(body).toContain("%PDF-1.4");
  });
});
