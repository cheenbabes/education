const mockAuth = jest.fn();
const mockIsWorksheetsEnabled = jest.fn();
const mockLessonFindUnique = jest.fn();
const mockStandardWorksheetFindMany = jest.fn();
const mockStandardWorksheetAccessFindMany = jest.fn();
const mockGetClusterKeysForStandards = jest.fn();
const mockGetStandardCodesForCluster = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

jest.mock("@/lib/featureFlags", () => ({
  isWorksheetsEnabled: (...args: unknown[]) => mockIsWorksheetsEnabled(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    lesson: {
      findUnique: (...args: unknown[]) => mockLessonFindUnique(...args),
    },
    standardWorksheet: {
      findMany: (...args: unknown[]) => mockStandardWorksheetFindMany(...args),
    },
    standardWorksheetAccess: {
      findMany: (...args: unknown[]) => mockStandardWorksheetAccessFindMany(...args),
    },
  },
}));

jest.mock("@/lib/standardWorksheetLibrary", () => ({
  getClusterKeysForStandards: (...args: unknown[]) =>
    mockGetClusterKeysForStandards(...args),
  getStandardCodesForCluster: (...args: unknown[]) =>
    mockGetStandardCodesForCluster(...args),
}));

import { GET } from "@/app/api/lessons/[id]/standard-worksheets/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockIsWorksheetsEnabled.mockResolvedValue(true);
  mockLessonFindUnique.mockResolvedValue({
    id: "lesson_1",
    userId: "user_123",
    title: "Fraction Adventure",
    subjects: ["STD.1"],
    content: {
      standards_addressed: [
        {
          code: "STD.1",
          description_plain: "Use number lines to represent fractions.",
        },
      ],
    },
    lessonChildren: [{ child: { id: "child_1", name: "Ada" } }],
    completions: [],
  });
  mockGetClusterKeysForStandards.mockReturnValue(
    new Map([["cluster-fractions", ["STD.1"]]]),
  );
  mockGetStandardCodesForCluster.mockReturnValue(["STD.1", "STD.2"]);
  mockStandardWorksheetFindMany.mockResolvedValue([
    {
      id: "ws_1",
      clusterKey: "cluster-fractions",
      clusterTitle: "Grade 3 Math: Fractions",
      grade: "3",
      subject: "Math",
      worksheetNum: 1,
      worksheetType: "identify",
      title: "Fractions — Identify",
      standardCodes: [],
    },
    {
      id: "ws_2",
      clusterKey: "cluster-fractions",
      clusterTitle: "Grade 3 Math: Fractions",
      grade: "3",
      subject: "Math",
      worksheetNum: 2,
      worksheetType: "practice",
      title: "Fractions — Practice",
      standardCodes: [],
    },
    {
      id: "ws_3",
      clusterKey: "cluster-fractions",
      clusterTitle: "Grade 3 Math: Fractions",
      grade: "3",
      subject: "Math",
      worksheetNum: 3,
      worksheetType: "extend",
      title: "Fractions — Extend",
      standardCodes: [],
    },
  ]);
  mockStandardWorksheetAccessFindMany.mockResolvedValue([
    {
      standardWorksheetId: "ws_2",
      createdAt: new Date("2026-04-10T12:00:00.000Z"),
    },
  ]);
});

describe("GET /api/lessons/[id]/standard-worksheets", () => {
  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(new Request("http://localhost"), {
      params: { id: "lesson_1" },
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("groups worksheets by canonical cluster and falls back to the cluster map when standardCodes are empty", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: { id: "lesson_1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockStandardWorksheetFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { standardCodes: { hasSome: ["STD.1"] } },
          { clusterKey: { in: ["cluster-fractions"] } },
        ],
      },
      orderBy: [
        { subject: "asc" },
        { grade: "asc" },
        { clusterTitle: "asc" },
        { worksheetNum: "asc" },
      ],
    });
    expect(body).toMatchObject({
      lessonId: "lesson_1",
      isUnlocked: false,
      lockReason: "Complete this lesson for at least one child to unlock worksheets.",
      completion: {
        completedChildren: 0,
        totalChildren: 1,
      },
      standards: [
        {
          code: "STD.1",
          descriptionPlain: "Use number lines to represent fractions.",
        },
      ],
    });
    expect(body.worksheetGroups).toHaveLength(1);
    expect(body.worksheetGroups[0]).toMatchObject({
      clusterKey: "cluster-fractions",
      clusterTitle: "Grade 3 Math: Fractions",
      matchedStandards: [
        {
          code: "STD.1",
          descriptionPlain: "Use number lines to represent fractions.",
        },
      ],
    });
    expect(body.worksheetGroups[0].worksheets).toEqual([
      {
        id: "ws_1",
        title: "Fractions — Identify",
        worksheetNum: 1,
        worksheetType: "identify",
        lastOpenedAt: null,
      },
      {
        id: "ws_2",
        title: "Fractions — Practice",
        worksheetNum: 2,
        worksheetType: "practice",
        lastOpenedAt: "2026-04-10T12:00:00.000Z",
      },
      {
        id: "ws_3",
        title: "Fractions — Extend",
        worksheetNum: 3,
        worksheetType: "extend",
        lastOpenedAt: null,
      },
    ]);
  });
});
