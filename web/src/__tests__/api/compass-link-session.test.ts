/**
 * Tests for /api/compass/link-session — attaches anon CompassResult rows
 * (matched by sessionId) to a user after they sign in.
 */

const mockUpdateMany = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: { compassResult: { updateMany: (...args: unknown[]) => mockUpdateMany(...args) } },
}));

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

import { POST } from "@/app/api/compass/link-session/route";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/compass/link-session", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/compass/link-session", () => {
  it("returns 401 when the caller is not signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ sessionId: "sess-123" }));
    expect(res.status).toBe(401);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns linked: 0 and skips DB when sessionId is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ linked: 0 });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("claims anon rows matching sessionId and returns the count", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockUpdateMany.mockResolvedValue({ count: 3 });

    const res = await POST(makeRequest({ sessionId: "sess-abc" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ linked: 3 });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { accountId: null, sessionId: "sess-abc" },
      data: { accountId: "user_1" },
    });
  });

  it("does not touch rows already linked to an account (where clause enforces null)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockUpdateMany.mockResolvedValue({ count: 0 });

    await POST(makeRequest({ sessionId: "sess-abc" }));

    // Assert the filter explicitly — rows with existing accountId must be untouched.
    const call = mockUpdateMany.mock.calls[0][0];
    expect(call.where.accountId).toBeNull();
  });
});
