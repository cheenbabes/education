/**
 * E2E Webhook Tests — full Clerk pipeline verification
 *
 * These tests drive real browser actions → Clerk fires webhooks → localtunnel
 * → local handler → DB updated. They show up as green in Clerk Dashboard.
 *
 * Prerequisites (all must be running):
 *   1. npx localtunnel --port 3001  (tunnel registered in Clerk Dashboard)
 *   2. npx next dev --port 3001
 *
 * Run: npx playwright test webhooks-e2e --project=chromium --headed
 */

import { test, expect, Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Test credentials ──────────────────────────────────────────────────────────
const TEST_EMAIL = "ebaibourine+clerk_test@example.com";
const TEST_CODE = "424242"; // Clerk test verification code — never sends real email

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Poll DB until the user's tier matches expected value (max 15s) */
async function waitForTier(userId: string, expectedTier: string, timeout = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const user = await prisma.user.findFirst({
      where: { email: TEST_EMAIL },
    });
    if (user?.tier === expectedTier) return user;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Timed out waiting for tier=${expectedTier} for ${TEST_EMAIL}`);
}

/** Sign up or sign in with test email + code 424242 */
async function signInOrUp(page: Page) {
  await page.goto("http://localhost:3001");

  // Click sign in/up if not already authenticated
  const signInBtn = page.getByRole("link", { name: /sign in|log in|get started|start free/i }).first();
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signInBtn.click();
  }

  // If already signed in, done
  if (page.url().includes("/dashboard") || page.url().includes("/compass")) return;

  // Fill email
  const emailInput = page.getByRole("textbox", { name: /email/i });
  await emailInput.waitFor({ timeout: 10_000 });
  await emailInput.fill(TEST_EMAIL);
  await page.getByRole("button", { name: /continue/i }).click();

  // Fill OTP code (424242 works for any +clerk_test address in test mode)
  const codeInput = page.getByRole("textbox").first();
  await codeInput.waitFor({ timeout: 10_000 });
  await codeInput.fill(TEST_CODE);

  // Wait for redirect after auth
  await page.waitForURL(/\/dashboard|\/compass|\//, { timeout: 15_000 });
}

/** Clean up the test user from both Clerk and local DB after tests */
async function cleanupTestUser() {
  // Delete from our DB
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

  // Delete from Clerk via API
  const users = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(TEST_EMAIL)}`,
    { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } }
  ).then((r) => r.json());

  for (const u of users?.data ?? []) {
    await fetch(`https://api.clerk.com/v1/users/${u.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
  }
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe.serial("Clerk webhook pipeline", () => {
  test.setTimeout(60_000);

  let clerkUserId: string | null = null;

  test.afterAll(async () => {
    await cleanupTestUser();
    await prisma.$disconnect();
  });

  // ── 1. user.created ────────────────────────────────────────────────────────
  test("user.created — signup fires webhook and creates DB record", async ({ page }) => {
    // Delete any existing test user first
    await cleanupTestUser();

    await page.goto("http://localhost:3001/sign-up");

    const emailInput = page.getByRole("textbox", { name: /email/i });
    await emailInput.waitFor({ timeout: 10_000 });
    await emailInput.fill(TEST_EMAIL);
    await page.getByRole("button", { name: /continue/i }).click();

    // Verification code (no real email sent in test mode)
    const codeInput = page.locator("input[autocomplete*='one-time-code'], input[type='text']").first();
    await codeInput.waitFor({ timeout: 10_000 });
    await codeInput.fill(TEST_CODE);

    await page.waitForURL(/\/dashboard|\/compass|\/$/, { timeout: 20_000 });

    // Wait for webhook to arrive and DB to be updated
    const user = await waitForTier("", "compass"); // new user = compass
    clerkUserId = user.id;

    expect(user.email).toBe(TEST_EMAIL);
    expect(user.tier).toBe("compass");

    console.log(`✓ user.created: ${user.id} tier=${user.tier}`);
  });

  // ── 2. subscription.created + subscription.active ─────────────────────────
  test("subscription.created — checkout sets tier=homestead in DB", async ({ page }) => {
    await signInOrUp(page);
    await page.goto("http://localhost:3001/pricing");

    // Click the Homestead plan CTA
    await page.getByRole("button", { name: /start homestead/i }).click();

    // Clerk's checkout renders in an iframe
    const checkoutFrame = page.frameLocator("iframe[src*='clerk']").first();
    const cardInput = checkoutFrame.getByRole("textbox", { name: /card number/i });
    await cardInput.waitFor({ timeout: 15_000 });

    // Fill Stripe test card
    await cardInput.fill("4242 4242 4242 4242");
    await checkoutFrame.getByRole("textbox", { name: /expir/i }).fill("12/26");
    await checkoutFrame.getByRole("textbox", { name: /cvc|security/i }).fill("424");
    await checkoutFrame.getByRole("textbox", { name: /zip|postal/i }).fill("42424");

    await checkoutFrame.getByRole("button", { name: /subscribe|pay/i }).click();

    // Wait for webhook → DB updated
    const user = await waitForTier("", "homestead", 20_000);
    expect(user.tier).toBe("homestead");
    expect(user.billingCycleStart).not.toBeNull();

    console.log(`✓ subscription.created: tier=${user.tier}`);
  });

  // ── 3. subscription.deleted — cancel → downgrade to compass ──────────────
  test("subscription.deleted — cancel subscription downgrades to compass", async ({ page }) => {
    await signInOrUp(page);
    await page.goto("http://localhost:3001/account");

    // Find and click cancel subscription
    const cancelBtn = page.getByRole("button", { name: /cancel|downgrade/i });
    await cancelBtn.waitFor({ timeout: 10_000 });
    await cancelBtn.click();

    // Confirm if dialog appears
    const confirmBtn = page.getByRole("button", { name: /confirm|yes/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    const user = await waitForTier("", "compass", 20_000);
    expect(user.tier).toBe("compass");
    expect(user.billingCycleStart).toBeNull();

    console.log(`✓ subscription.deleted: tier=${user.tier}`);
  });
});
