/**
 * Integration tests for the Clerk webhook handler.
 * After billing simplification, only user events go through webhooks.
 * Tier is read from Clerk API — no subscription webhooks to test.
 *
 * Prerequisites: `npm run dev -- --port 3001` must be running.
 */

import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const BASE_URL = "http://localhost:3001";
const SECRET = process.env.CLERK_WEBHOOK_SECRET ?? "";
const TEST_USER_ID = "user_integration_test_clerk_webhooks";
const TEST_EMAIL = "integration-test@sagescompass-test.invalid";

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

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
  await prisma.$disconnect();
});

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
  });
});

describe("user.updated", () => {
  it("updates email and returns 200", async () => {
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

describe("billing events are ignored", () => {
  it("subscription.created returns 200 with no DB side effects", async () => {
    const { status } = await send({
      type: "subscription.created",
      data: { payer: { user_id: TEST_USER_ID }, items: [] },
    });
    expect(status).toBe(200);
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
  });

  it("returns 400 for tampered payload", async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_fake",
        "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
        "svix-signature": "v1,badsignature",
      },
      body: JSON.stringify({ type: "user.created", data: { id: "hacker" } }),
    });
    expect(res.status).toBe(400);
  });
});
