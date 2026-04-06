/**
 * Tests for the Clerk webhook handler.
 * After the billing simplification, only user.created and user.updated are handled.
 * Billing state is read directly from Clerk API — no subscription webhooks needed.
 */

const mockUpsert = jest.fn().mockResolvedValue({});
jest.mock("@/lib/prisma", () => ({
  prisma: { user: { upsert: (...args: unknown[]) => mockUpsert(...args) } },
}));

const mockSendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/email", () => ({
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),
}));

const mockVerify = jest.fn();
jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: (...args: unknown[]) => mockVerify(...args),
  })),
}));

const mockHeaders = jest.fn();
jest.mock("next/headers", () => ({ headers: () => mockHeaders() }));

process.env.CLERK_WEBHOOK_SECRET = "test_secret";

import { POST } from "@/app/api/webhooks/clerk/route";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockSvixHeaders() {
  mockHeaders.mockReturnValue({
    get: (name: string) => {
      const map: Record<string, string> = {
        "svix-id": "msg_test",
        "svix-timestamp": "1234567890",
        "svix-signature": "v1_test",
      };
      return map[name] ?? null;
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSvixHeaders();
});

// ── User events ──────────────────────────────────────────────────────────────

describe("user.created", () => {
  it("syncs email and sends welcome email", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_123",
        first_name: "Jane",
        email_addresses: [{ id: "email_1", email_address: "jane@test.com" }],
        primary_email_address_id: "email_1",
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_123" },
        update: { email: "jane@test.com" },
        create: { id: "user_123", email: "jane@test.com" },
      })
    );
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith("jane@test.com", "Jane");
  });

  it("handles missing email gracefully", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_456",
        first_name: "Bob",
        email_addresses: [],
        primary_email_address_id: null,
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });
});

describe("user.updated", () => {
  it("syncs email but does NOT send welcome email", async () => {
    const payload = {
      type: "user.updated",
      data: {
        id: "user_123",
        first_name: "Jane",
        email_addresses: [{ id: "email_1", email_address: "jane-new@test.com" }],
        primary_email_address_id: "email_1",
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });
});

// ── Billing events are now ignored ──────────────────────────────────────────

describe("billing events (ignored — tier read from Clerk API)", () => {
  it("subscription.created returns 200 without DB writes", async () => {
    const payload = {
      type: "subscription.created",
      data: { payer: { user_id: "user_123" }, items: [] },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("subscriptionItem.active returns 200 without DB writes", async () => {
    const payload = {
      type: "subscriptionItem.active",
      data: { payer: { user_id: "user_123" }, plan: { slug: "homestead_monthly" } },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("subscriptionItem.ended returns 200 without DB writes", async () => {
    const payload = {
      type: "subscriptionItem.ended",
      data: { payer: { user_id: "user_123" }, plan: { slug: "homestead_monthly" } },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

// ── Validation ──────────────────────────────────────────────────────────────

describe("validation", () => {
  it("returns 400 for missing svix headers", async () => {
    mockHeaders.mockReturnValue({ get: () => null });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing svix headers");
  });

  it("returns 400 for invalid signature", async () => {
    mockVerify.mockImplementation(() => { throw new Error("Invalid signature"); });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid signature");
  });

  it("returns 400 when user.created has no id", async () => {
    const payload = { type: "user.created", data: { email_addresses: [] } };
    mockVerify.mockReturnValue(payload);
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("No user_id in payload");
  });
});
