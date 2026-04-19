/**
 * Tests for /api/compass/submit — saves quiz results for both authenticated
 * and anonymous users. Anonymous rows carry sessionId for later backfill.
 */

const mockCreate = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: { compassResult: { create: (...args: unknown[]) => mockCreate(...args) } },
}));

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

const mockGetOrCreateUser = jest.fn().mockResolvedValue({});
jest.mock("@/lib/getOrCreateUser", () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

import { POST } from "@/app/api/compass/submit/route";

function makeRequest(body: object) {
  return new Request("http://localhost/api/compass/submit", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

const baseBody = {
  archetype: "the-guide",
  dimensionScores: { structure: 50 },
  philosophyBlend: { montessori: 0.5 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "cr_1" });
});

describe("POST /api/compass/submit", () => {
  it("saves an anonymous submission with accountId=null and sessionId set", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ ...baseBody, sessionId: "sess-anon" }));
    expect(res.status).toBe(200);
    expect(mockGetOrCreateUser).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: null,
        sessionId: "sess-anon",
        email: null,
        archetype: "the-guide",
      }),
    });
  });

  it("stores an optional email provided by an anon user", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await POST(makeRequest({ ...baseBody, sessionId: "sess-anon", email: "curious@parent.com" }));
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: null,
        email: "curious@parent.com",
      }),
    });
  });

  it("saves a signed-in submission with accountId set to the Clerk userId", async () => {
    mockAuth.mockResolvedValue({ userId: "user_99" });

    const res = await POST(makeRequest({ ...baseBody, sessionId: "sess-1" }));
    expect(res.status).toBe(200);
    expect(mockGetOrCreateUser).toHaveBeenCalledWith("user_99");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: "user_99",
        sessionId: "sess-1",
      }),
    });
  });

  it("rejects payloads missing required fields with 400", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ sessionId: "sess-anon" })); // no archetype etc.
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("accepts submissions with no sessionId (sets it to null)", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await POST(makeRequest(baseBody));
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ sessionId: null }),
    });
  });
});
