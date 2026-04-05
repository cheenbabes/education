/**
 * Integration tests for the Clerk webhook handler.
 *
 * These tests generate real svix signatures and fire HTTP requests at the
 * running dev server (localhost:3001). They write to the real local DB and
 * clean up the test user in afterAll.
 *
 * Prerequisites: `npm run dev -- --port 3001` must be running.
 */

import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const BASE_URL = "http://localhost:3001";
const SECRET = process.env.CLERK_WEBHOOK_SECRET ?? "";
const TEST_USER_ID = "user_integration_test_clerk_webhooks";
const TEST_EMAIL = "integration-test@sagescompass-test.invalid";

// ── Helpers ──────────────────────────────────────────────────────────────────

function signedRequest(payload: object): Request {
  const body = JSON.stringify(payload);
  const wh = new Webhook(SECRET);
  const msgId = `msg_test_${Date.now()}`;
  const timestamp = new Date();
  const sig = wh.sign(msgId, timestamp, body);
  const tsSeconds = Math.floor(timestamp.getTime() / 1000).toString();

  return new Request(`${BASE_URL}/api/webhooks/clerk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "svix-id": msgId,
      "svix-timestamp": tsSeconds,
      "svix-signature": sig,
    },
    body,
  });
}

async function send(payload: object) {
  const req = signedRequest(payload);
  const res = await fetch(req);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
  await prisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("user.created", () => {
  it("creates user in DB and returns 200", async () => {
    const { status, body } = await send({
      type: "user.created",
      data: {
        id: TEST_USER_ID,
        first_name: "Integration",
        email_addresses: [{ id: "email_1", email_address: TEST_EMAIL }],
        primary_email_address_id: "email_1",
      },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(TEST_EMAIL);
    expect(user?.tier).toBe("compass");
  });
});

describe("user.updated", () => {
  it("updates email and returns 200, does not re-send welcome email", async () => {
    const newEmail = "integration-updated@sagescompass-test.invalid";
    const { status, body } = await send({
      type: "user.updated",
      data: {
        id: TEST_USER_ID,
        first_name: "Integration",
        email_addresses: [{ id: "email_1", email_address: newEmail }],
        primary_email_address_id: "email_1",
      },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(user?.email).toBe(newEmail);
  });
});

describe("subscription.created", () => {
  it("sets tier=homestead and billing dates, returns 200", async () => {
    const periodStart = Date.now();
    const periodEnd = periodStart + 30 * 24 * 60 * 60 * 1000;

    const { status, body } = await send({
      type: "subscription.created",
      data: {
        payer: { user_id: TEST_USER_ID },
        items: [{
          status: "active",
          plan: { slug: "homestead_monthly" },
          period_start: periodStart,
          period_end: periodEnd,
        }],
      },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(user?.tier).toBe("homestead");
    expect(user?.billingCycleStart).toEqual(new Date(periodStart));
    expect(user?.tierExpiresAt).toEqual(new Date(periodEnd));
  });
});

describe("subscription.updated", () => {
  it("upgrades tier=schoolhouse on plan change, returns 200", async () => {
    const periodStart = Date.now();
    const periodEnd = periodStart + 30 * 24 * 60 * 60 * 1000;

    const { status, body } = await send({
      type: "subscription.updated",
      data: {
        payer: { user_id: TEST_USER_ID },
        items: [
          { status: "ended", plan: { slug: "homestead_monthly" }, period_start: 1000, period_end: 2000 },
          { status: "active", plan: { slug: "schoolhouse_monthly" }, period_start: periodStart, period_end: periodEnd },
        ],
      },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(user?.tier).toBe("schoolhouse");
  });
});

describe("subscription.past_due", () => {
  it("takes no action, returns 200 (grace period)", async () => {
    const before = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });

    const { status, body } = await send({
      type: "subscription.past_due",
      data: { payer: { user_id: TEST_USER_ID } },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const after = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(after?.tier).toBe(before?.tier); // unchanged
  });
});

describe("subscription.deleted", () => {
  it("downgrades to compass and clears billing dates, returns 200", async () => {
    const { status, body } = await send({
      type: "subscription.deleted",
      data: { payer: { user_id: TEST_USER_ID } },
    });

    expect(status).toBe(200);
    expect(body).toEqual({ received: true });

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    expect(user?.tier).toBe("compass");
    expect(user?.billingCycleStart).toBeNull();
    expect(user?.tierExpiresAt).toBeNull();
  });
});

describe("invalid requests", () => {
  it("returns 400 for missing svix headers", async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/clerk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "user.created", data: {} }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing svix headers");
  });

  it("returns 400 for tampered payload (bad signature)", async () => {
    const body = JSON.stringify({ type: "user.created", data: { id: "hacker" } });
    const res = await fetch(`${BASE_URL}/api/webhooks/clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_fake",
        "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
        "svix-signature": "v1,badsignature",
      },
      body,
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature");
  });
});
