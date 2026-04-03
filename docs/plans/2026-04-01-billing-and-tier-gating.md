# Billing & Proactive Tier Gating Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all dead-end tier-limited buttons with proactive upgrade prompts, then wire up Clerk Billing so users can actually pay and get their tier updated automatically.

**Architecture:** Two phases — Phase 1 is pure UI (no billing dependency, ships independently). Phase 2 adds Clerk Billing: a webhook handler writes tier changes to the existing DB `tier` field, and all upgrade buttons point to Clerk's hosted checkout. Phase 1 can be reviewed and deployed before Phase 2 starts.

**Tech Stack:** Next.js 14, Clerk (`@clerk/nextjs` v7), Prisma, Svix (webhook verification), existing `/api/user/tier` endpoint.

---

## Current State Summary

Phase 1 enforcement (API-level) is complete:
- `POST /api/children` → 429 when at child limit
- `POST /api/lessons` → 429 when at lesson limit
- `POST /api/lessons/[id]/worksheet` → 429 when at worksheet limit
- `GET /api/user/tier` returns `{ tier, lessonsUsed, lessonsLimit, childrenCount, childrenLimit, worksheetsUsed, worksheetsLimit, resetsAt }`

**Tier limits:**
| Resource | Compass | Homestead | Schoolhouse |
|---|---|---|---|
| Children | 0 | 4 | 8 |
| Lessons/mo | 3 | 30 | 60 |
| Worksheets/mo | 0 | 5 | 15 |

**What's broken/missing:**
- Homestead user with 4/4 children still sees "+ Add Child" (account + dashboard)
- Lessons list has "+ Create Lesson" with no tier check
- Worksheet button blocks compass but doesn't show remaining count for paid users
- All "Upgrade →" links go to `/#pricing` — no actual checkout
- Pricing section CTAs go to `/compass` (the quiz) — not checkout
- No webhook to update tier when Clerk subscription changes
- No billing portal link for users to manage/cancel

---

## Phase 1 — Proactive UI Gating (no billing required)

### Task 1: Account page — child limit gate

**Files:**
- Modify: `web/src/app/account/page.tsx`

Tier data is already fetched here (`tierData` state from `/api/user/tier`). The `+ Add Child` button is inside a `<TierGate requiredTier="homestead">` which only checks tier level — it doesn't check if the user is *at* their limit.

**Step 1: Add derived boolean above the return**

Find the block near line 200 where `tier` and `tierConf` are derived. Add after it:

```tsx
const atChildLimit = !!tierData && tierData.childrenCount >= tierData.childrenLimit;
```

**Step 2: Replace the "+ Add Child" button**

Find the button that opens the add-child form (around line 483). Replace the single button with a conditional:

```tsx
{atChildLimit ? (
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
    <span style={{ fontSize: "0.8rem", color: "#767676" }}>
      {tierData!.childrenCount}/{tierData!.childrenLimit} children
    </span>
    <a
      href="/#pricing"
      style={{
        fontSize: "0.8rem", fontWeight: 600, color: "#9a7530",
        padding: "0.35rem 0.85rem", borderRadius: "8px",
        background: "rgba(196,152,61,0.1)", border: "1px solid rgba(196,152,61,0.25)",
        textDecoration: "none",
      }}
    >
      Upgrade for more →
    </a>
  </div>
) : (
  <button onClick={() => { setShowAdd(true); setEditing(null); resetForm(); }} style={nightButton}>
    + Add Child
  </button>
)}
```

**Step 3: Build and verify**

```bash
cd ~/github/edu-app/web && npm run build
```
Expected: no errors.

**Step 4: Commit**

```bash
git add web/src/app/account/page.tsx
git commit -m "feat: hide add-child button when at tier child limit"
```

---

### Task 2: Dashboard — child limit gate

**Files:**
- Modify: `web/src/app/dashboard/page.tsx`

The dashboard is inside `<TierGate requiredTier="homestead">` so compass users never see it. But it doesn't fetch tier data, so homestead users at 4/4 children still see "+ Add child".

**Step 1: Add tier data fetch to useEffect**

The `useEffect` already fetches `/api/children` and `/api/lessons`. Add a third fetch:

```tsx
fetch("/api/user/tier").then((r) => r.json()),
```

Update the state declaration:

```tsx
const [tierData, setTierData] = useState<{
  tier: string; childrenCount: number; childrenLimit: number;
  lessonsUsed: number; lessonsLimit: number;
} | null>(null);
```

Update the `Promise.all` destructure to include `tierData` and call `setTierData(tierData)`.

**Step 2: Derive the limit boolean**

After the existing derived values, add:

```tsx
const atChildLimit = !!tierData && tierData.childrenCount >= tierData.childrenLimit;
const atLessonLimit = !!tierData && tierData.lessonsUsed >= tierData.lessonsLimit;
```

**Step 3: Gate the "+ Add child" card**

Find the `+ Add child` Link (around line 331). Replace with:

```tsx
{atChildLimit ? (
  <a
    href="/#pricing"
    style={{ fontSize: "0.8rem", fontWeight: 600, color: "#9a7530", textDecoration: "none" }}
  >
    {tierData!.childrenCount}/{tierData!.childrenLimit} children · Upgrade →
  </a>
) : (
  <Link href="/account" style={{ fontSize: "0.8rem", color: "#6E6E9E", textDecoration: "none" }}>
    + Add child
  </Link>
)}
```

**Step 4: Gate the "Create Lesson" button**

Find the `Create Lesson` Link at the top of the dashboard (around line 247). Replace with:

```tsx
{atLessonLimit ? (
  <a
    href="/#pricing"
    style={{ ...nightButton, textDecoration: "none", opacity: 0.7, fontSize: "0.85rem" }}
  >
    {tierData!.lessonsUsed}/{tierData!.lessonsLimit} lessons · Upgrade →
  </a>
) : (
  <Link href="/create" className="btn-night" style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem", borderRadius: "10px" }}>
    Create Lesson
  </Link>
)}
```

**Step 5: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/dashboard/page.tsx
git commit -m "feat: gate create-lesson and add-child on dashboard when at tier limits"
```

---

### Task 3: Lessons list — create lesson CTA gate

**Files:**
- Modify: `web/src/app/lessons/page.tsx`

This page currently fetches lessons, children, and worksheets. It has a `+ Create Lesson` CTA at the bottom with no tier check.

**Step 1: Add tier fetch**

In the existing `Promise.all` (around line 179), add:

```tsx
fetch("/api/user/tier").then((r) => r.json()).catch(() => null),
```

Add `tierData` state:

```tsx
const [tierData, setTierData] = useState<{
  tier: string; lessonsUsed: number; lessonsLimit: number; resetsAt: string;
} | null>(null);
```

Update destructure and call `setTierData`.

**Step 2: Derive limit boolean**

```tsx
const atLessonLimit = !!tierData && tierData.lessonsUsed >= tierData.lessonsLimit;
```

**Step 3: Replace the "+ Create Lesson" CTA**

Find the CTA button/link at the bottom of the page (around line 727). Replace with:

```tsx
{atLessonLimit ? (
  <div style={{ textAlign: "right" }}>
    <p style={{ fontSize: "0.78rem", color: "#767676", marginBottom: "0.35rem" }}>
      {tierData!.lessonsUsed}/{tierData!.lessonsLimit} lessons this month
      {tierData?.resetsAt && ` · resets ${new Date(tierData.resetsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
    </p>
    <a
      href="/#pricing"
      style={{
        fontSize: "0.85rem", fontWeight: 600, color: "#9a7530",
        padding: "0.5rem 1.25rem", borderRadius: "10px",
        background: "rgba(196,152,61,0.1)", border: "1px solid rgba(196,152,61,0.25)",
        textDecoration: "none", display: "inline-block",
      }}
    >
      Upgrade for more lessons →
    </a>
  </div>
) : (
  <div style={{ textAlign: "right" }}>
    <Link href="/create" className="btn-night" style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem", borderRadius: "10px" }}>
      + Create Lesson
    </Link>
  </div>
)}
```

**Step 4: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/lessons/page.tsx
git commit -m "feat: gate create-lesson CTA on lessons list when at monthly limit"
```

---

### Task 4: Lesson detail — worksheet remaining count

**Files:**
- Modify: `web/src/app/lessons/[id]/page.tsx`

The `userTier` state already exists and is fetched. But paid users at 4/5 worksheets have no visual feedback until they hit the 429.

**Step 1: Add worksheet usage to tier fetch**

The `userTier` state is a string. Expand it to also capture worksheet usage. Change the tier fetch (around line 332):

```tsx
const [tierData, setTierData] = useState<{
  tier: string; worksheetsUsed: number; worksheetsLimit: number;
} | null>(null);

// In useEffect, replace the userTier fetch:
fetch("/api/user/tier")
  .then((r) => r.json())
  .then((d) => {
    setUserTier(d.tier);
    setTierData(d);
  })
  .catch(() => {});
```

**Step 2: Add remaining count display below the generate button**

In the worksheet section, after the generate button block and before the error message, add:

```tsx
{tierData && tierData.tier !== "compass" && (
  <p style={{ fontSize: "0.72rem", color: "#999", marginTop: "0.4rem" }}>
    {tierData.worksheetsUsed}/{tierData.worksheetsLimit} worksheets this month
  </p>
)}
```

**Step 3: Disable the generate button when at worksheet limit (paid users)**

In `generateWorksheet`, add an early return after the compass check:

```tsx
if (tierData && tierData.worksheetsUsed >= tierData.worksheetsLimit) {
  setWorksheetError(`You've used all ${tierData.worksheetsLimit} worksheets this month. Upgrade or wait until next month.`);
  return;
}
```

**Step 4: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/lessons/\[id\]/page.tsx
git commit -m "feat: show worksheet usage count and pre-block when at monthly limit"
```

---

## Phase 2 — Clerk Billing

### Task 5: Manual Clerk Dashboard setup *(no code — do this first)*

This is a manual step in the Clerk dashboard before any code runs.

**5a. Connect Stripe to Clerk**
1. Go to Clerk Dashboard → Billing → Connect Stripe
2. Create/connect a Stripe account
3. Copy the Stripe restricted key Clerk generates

**5b. Create subscription plans in Clerk**

Create 4 plans with these exact slugs (slug = what the webhook payload will contain):

| Plan name | Slug | Price |
|---|---|---|
| Homestead Monthly | `homestead_monthly` | $21.99/mo |
| Homestead Annual | `homestead_annual` | $199/yr |
| Schoolhouse Monthly | `schoolhouse_monthly` | $29.99/mo |
| Schoolhouse Annual | `schoolhouse_annual` | $279/yr |

**5c. Get the checkout URLs**

For each plan, Clerk generates a hosted checkout URL. Copy these — you'll use them in Task 8. They look like:
`https://your-app.clerk.accounts.dev/sign-in?redirect_url=/billing/checkout?plan_id=homestead_monthly`

(Exact format: check Clerk dashboard under each plan → "Share link")

**5d. Set up webhook endpoint in Clerk**
1. Go to Clerk Dashboard → Webhooks → Add endpoint
2. URL: `https://your-production-domain.com/api/webhooks/clerk`
3. Select events: `subscription.activated`, `subscription.updated`, `subscription.deactivated`
4. Copy the **Signing Secret** — needed for `CLERK_WEBHOOK_SECRET` env var

---

### Task 6: Webhook handler — sync tier to DB

**Files:**
- Create: `web/src/app/api/webhooks/clerk/route.ts`
- Modify: `web/package.json` (add svix)
- Modify: `web/.env` (add CLERK_WEBHOOK_SECRET)

Clerk uses [Svix](https://svix.com) to sign webhooks. You must verify the signature before trusting the payload.

**Step 1: Install svix**

```bash
cd ~/github/edu-app/web && npm install svix
```

**Step 2: Add env var**

Add to `web/.env` (and to Railway environment variables):

```
CLERK_WEBHOOK_SECRET=whsec_...  # from Clerk dashboard step 5d
```

**Step 3: Create the webhook route**

```typescript
// web/src/app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Maps Clerk plan slugs → our tier values
const PLAN_TO_TIER: Record<string, string> = {
  homestead_monthly: "homestead",
  homestead_annual: "homestead",
  schoolhouse_monthly: "schoolhouse",
  schoolhouse_annual: "schoolhouse",
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  // Verify signature
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;
  const userId = data.user_id as string | undefined;
  const planSlug = (data.plan as { slug?: string })?.slug;

  if (!userId) {
    return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
  }

  try {
    if (type === "subscription.activated" || type === "subscription.updated") {
      const tier = planSlug ? (PLAN_TO_TIER[planSlug] ?? "compass") : "compass";
      await prisma.user.upsert({
        where: { id: userId },
        update: { tier },
        create: { id: userId, email: `${userId}@clerk.placeholder`, tier },
      });
    } else if (type === "subscription.deactivated") {
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "compass" },
      });
    }
  } catch (err) {
    console.error("[clerk webhook]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

**Step 4: Build and verify**

```bash
cd ~/github/edu-app/web && npm run build
```
Expected: no errors. The new route should appear in the build output as `ƒ /api/webhooks/clerk`.

**Step 5: Commit**

```bash
git add web/src/app/api/webhooks/clerk/route.ts web/package.json web/package-lock.json
git commit -m "feat: add Clerk billing webhook handler to sync tier to DB"
```

---

### Task 7: Pricing section — wire up checkout CTAs

**Files:**
- Modify: `web/src/components/pricing-section.tsx`

Currently "Start Homestead" and "Start Schoolhouse" both go to `/compass`. Replace with the actual checkout URLs from Task 5c.

**Step 1: Add checkout URL env vars**

Add to `web/.env` and Railway:

```
NEXT_PUBLIC_CHECKOUT_HOMESTEAD_MONTHLY=https://...  # from Clerk dashboard
NEXT_PUBLIC_CHECKOUT_HOMESTEAD_ANNUAL=https://...
NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_MONTHLY=https://...
NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_ANNUAL=https://...
```

**Step 2: Update pricing section**

In `web/src/components/pricing-section.tsx`, find the plan definitions array. Update the `href` values for Homestead and Schoolhouse plans to read from env vars:

```tsx
// Homestead plan
href: isAnnual
  ? (process.env.NEXT_PUBLIC_CHECKOUT_HOMESTEAD_ANNUAL ?? "/#pricing")
  : (process.env.NEXT_PUBLIC_CHECKOUT_HOMESTEAD_MONTHLY ?? "/#pricing"),

// Schoolhouse plan
href: isAnnual
  ? (process.env.NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_ANNUAL ?? "/#pricing")
  : (process.env.NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_MONTHLY ?? "/#pricing"),
```

The `?? "/#pricing"` fallback means the section still works in local dev without the checkout URLs set.

**Step 3: Update CTA button labels for clarity**

Change "Start Homestead" → "Subscribe to Homestead" and "Start Schoolhouse" → "Subscribe to Schoolhouse" to set clear intent.

**Step 4: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/components/pricing-section.tsx
git commit -m "feat: wire pricing section CTAs to Clerk checkout URLs"
```

---

### Task 8: Wire all "Upgrade →" links to checkout

**Files:**
- Modify: `web/src/components/tier-gate.tsx`
- Modify: `web/src/app/lessons/[id]/page.tsx`
- Modify: `web/src/app/account/page.tsx`
- Modify: `web/src/app/dashboard/page.tsx`
- Modify: `web/src/app/lessons/page.tsx`

Every "Upgrade →" link currently goes to `/#pricing`. Replace them with the Homestead checkout URL (the most common upgrade path). Use a shared constant to avoid scattering the URL.

**Step 1: Create a shared upgrade URL helper**

Create `web/src/lib/upgradeUrl.ts`:

```typescript
// Returns the Homestead monthly checkout URL, falling back to /#pricing
export const UPGRADE_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_HOMESTEAD_MONTHLY ?? "/#pricing";
```

**Step 2: Update tier-gate.tsx**

Replace the hardcoded `href="/#pricing"` on the upgrade CTA button with:

```tsx
import { UPGRADE_URL } from "@/lib/upgradeUrl";
// ...
<a href={UPGRADE_URL} ...>Upgrade to Homestead — $21.99/mo</a>
```

**Step 3: Update all other upgrade links**

In each of the following files, replace `href="/#pricing"` upgrade links with `href={UPGRADE_URL}` (import from `@/lib/upgradeUrl`):
- `web/src/app/account/page.tsx` — compass tier upgrade CTA
- `web/src/app/dashboard/page.tsx` — new lesson/child limit links from Task 2
- `web/src/app/lessons/page.tsx` — lesson limit CTA from Task 3
- `web/src/app/lessons/[id]/page.tsx` — compass worksheet upgrade link

**Step 4: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/components/tier-gate.tsx web/src/lib/upgradeUrl.ts \
  web/src/app/account/page.tsx web/src/app/dashboard/page.tsx \
  web/src/app/lessons/page.tsx web/src/app/lessons/\[id\]/page.tsx
git commit -m "feat: wire all upgrade links to Clerk checkout via shared UPGRADE_URL constant"
```

---

### Task 9: Account page — billing management link

**Files:**
- Modify: `web/src/app/account/page.tsx`

Paid users (homestead/schoolhouse) need a way to manage their subscription — cancel, update payment method, view invoices. Clerk provides a hosted billing portal URL.

**Step 1: Add billing portal env var**

Add to `web/.env` and Railway:

```
NEXT_PUBLIC_BILLING_PORTAL_URL=https://...  # from Clerk dashboard → Billing → Customer Portal
```

Add to `web/src/lib/upgradeUrl.ts`:

```typescript
export const BILLING_PORTAL_URL =
  process.env.NEXT_PUBLIC_BILLING_PORTAL_URL ?? null;
```

**Step 2: Show billing portal link for paid users**

In `web/src/app/account/page.tsx`, find the section that shows tier info for paid users (around line 282, where it currently says "Billing managed via your account — Phase 2"). Replace that placeholder with:

```tsx
{BILLING_PORTAL_URL && tier !== "compass" && (
  <a
    href={BILLING_PORTAL_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      fontSize: "0.8rem", fontWeight: 500, color: "#5A5A5A",
      textDecoration: "underline",
    }}
  >
    Manage billing, invoices & cancellation →
  </a>
)}
```

**Step 3: Build and commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/account/page.tsx web/src/lib/upgradeUrl.ts
git commit -m "feat: add billing portal link to account page for paid users"
```

---

### Task 10: Push and verify Railway deploy

**Step 1: Push all commits**

```bash
cd ~/github/edu-app && git push origin main
```

**Step 2: Monitor deploy**

```bash
railway deployment list  # watch for BUILDING → SUCCESS
railway logs             # verify new migrations applied, server started
```

**Step 3: Set environment variables on Railway**

In Railway dashboard → web-service → Variables, add:
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CHECKOUT_HOMESTEAD_MONTHLY`
- `NEXT_PUBLIC_CHECKOUT_HOMESTEAD_ANNUAL`
- `NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_MONTHLY`
- `NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE_ANNUAL`
- `NEXT_PUBLIC_BILLING_PORTAL_URL`

**Step 4: Test end-to-end**
1. Create a test user, manually set tier to "compass" in DB
2. Verify all upgrade buttons are visible and link to Clerk checkout
3. Complete a test purchase using Stripe test card (`4242 4242 4242 4242`)
4. Verify webhook fires → DB tier updates → user now has homestead access
5. Verify billing portal link appears on account page

---

## Edge Cases & Notes

- **Downgrade mid-period:** When `subscription.deactivated` fires, set tier to "compass". Existing children/lessons are preserved — only *new* creation is blocked.
- **Annual plans:** The `homestead_annual` slug maps to tier `homestead` — no special handling needed. Clerk/Stripe handle the annual billing cycle.
- **Proration on upgrade:** Stripe handles this automatically when upgrading annual → annual or monthly → monthly mid-cycle. No code needed.
- **Webhook replay:** The `upsert` in the webhook handler is idempotent — safe to replay.
- **Local testing of webhooks:** Use the Clerk CLI or Svix dashboard to replay events to localhost. Or use ngrok to expose `localhost:3001` and point Clerk's dev webhook there.
- **UPGRADE_URL points to Homestead:** If a Schoolhouse user is at limit (8 children), the upgrade link is a no-op for them. A future improvement would be to detect tier and skip showing it for Schoolhouse users.

---

## Checklist

### Phase 1 (no billing dependency)
- [ ] Task 1: Account page child limit gate
- [ ] Task 2: Dashboard child + lesson limit gate
- [ ] Task 3: Lessons list lesson limit gate
- [ ] Task 4: Lesson detail worksheet count + pre-block

### Phase 2 (requires Clerk Billing setup first)
- [ ] Task 5: Manual Clerk Dashboard setup (plans + webhook endpoint)
- [ ] Task 6: Webhook handler + svix
- [ ] Task 7: Pricing section CTAs
- [ ] Task 8: All upgrade links → UPGRADE_URL constant
- [ ] Task 9: Account page billing portal link
- [ ] Task 10: Deploy + end-to-end test
