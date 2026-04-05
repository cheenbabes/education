/**
 * Tests for the Clerk webhook handler.
 * Mocks: Prisma, svix, Clerk headers, sendWelcomeEmail.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUpsert = jest.fn().mockResolvedValue({});
const mockUpdate = jest.fn().mockResolvedValue({});

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

const mockSendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/email", () => ({
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),
}));

// Mock svix — verify() returns the parsed payload
const mockVerify = jest.fn();
jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: (...args: unknown[]) => mockVerify(...args),
  })),
}));

// Mock next/headers
const mockHeaders = jest.fn();
jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

// Set env
process.env.CLERK_WEBHOOK_SECRET = "test_secret";

import { POST } from "@/app/api/webhooks/clerk/route";

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const HOMESTEAD_ITEM = {
  status: "active",
  plan: { slug: "homestead_monthly" },
  period_start: 1775075247038,
  period_end: 1806611247038,
};

const SCHOOLHOUSE_ITEM = {
  status: "active",
  plan: { slug: "schoolhouse_monthly" },
  period_start: 1775075247038,
  period_end: 1806611247038,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSvixHeaders();
});

describe("subscription.created", () => {
  it("sets tier and billing dates from active item", async () => {
    const payload = {
      type: "subscription.created",
      data: {
        payer: { user_id: "user_123" },
        items: [HOMESTEAD_ITEM],
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_123" },
        update: expect.objectContaining({
          tier: "homestead",
          billingCycleStart: new Date(1775075247038),
          tierExpiresAt: new Date(1806611247038),
        }),
        create: expect.objectContaining({
          tier: "homestead",
          billingCycleStart: new Date(1775075247038),
          tierExpiresAt: new Date(1806611247038),
        }),
      })
    );
  });
});

describe("subscription.updated", () => {
  it("updates tier and billing dates on plan change", async () => {
    const payload = {
      type: "subscription.updated",
      data: {
        payer: { user_id: "user_123" },
        items: [
          { status: "ended", plan: { slug: "homestead_monthly" }, period_start: 1000, period_end: 2000 },
          SCHOOLHOUSE_ITEM,
        ],
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          tier: "schoolhouse",
          billingCycleStart: new Date(SCHOOLHOUSE_ITEM.period_start),
          tierExpiresAt: new Date(SCHOOLHOUSE_ITEM.period_end),
        }),
      })
    );
  });

  it("updates billing dates on renewal (new period)", async () => {
    const newPeriodStart = 1806611247038;
    const newPeriodEnd = 1838147247038;
    const payload = {
      type: "subscription.updated",
      data: {
        payer: { user_id: "user_123" },
        items: [{
          ...HOMESTEAD_ITEM,
          period_start: newPeriodStart,
          period_end: newPeriodEnd,
        }],
      },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          billingCycleStart: new Date(newPeriodStart),
          tierExpiresAt: new Date(newPeriodEnd),
        }),
      })
    );
  });
});

describe("subscription.deleted", () => {
  it("downgrades to compass and nulls billing dates", async () => {
    const payload = {
      type: "subscription.deleted",
      data: { payer: { user_id: "user_123" } },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user_123" },
      data: { tier: "compass", billingCycleStart: null, tierExpiresAt: null },
    });
  });
});

describe("subscription.past_due", () => {
  it("takes no action (grace period — intentional)", async () => {
    const payload = {
      type: "subscription.past_due",
      data: { payer: { user_id: "user_123" } },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(200);

    // Should NOT update tier or billing dates
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("user.created", () => {
  it("syncs email and sends welcome email", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_456",
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
        where: { id: "user_456" },
        update: { email: "jane@test.com" },
        create: { id: "user_456", email: "jane@test.com" },
      })
    );

    expect(mockSendWelcomeEmail).toHaveBeenCalledWith("jane@test.com", "Jane");
  });
});

describe("user.updated", () => {
  it("syncs email but does NOT send welcome email", async () => {
    const payload = {
      type: "user.updated",
      data: {
        id: "user_456",
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

describe("validation", () => {
  it("returns 400 for missing svix headers", async () => {
    mockHeaders.mockReturnValue({
      get: () => null,
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing svix headers");
  });

  it("returns 400 for invalid signature", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("returns 400 when no userId in payload", async () => {
    const payload = {
      type: "subscription.created",
      data: { items: [] },
    };
    mockVerify.mockReturnValue(payload);

    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No user_id in payload");
  });
});
