# Ship Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the 8 remaining items needed to ship — feature-flag worksheets, fix pricing, rebuild about page structure, wire Resend emails, fix explore page colors/font, add floating feedback button, and verify test purchase flow.

__Architecture:__ Feature flag uses PostHog (UI) + `NEXT_PUBLIC_WORKSHEETS_ENABLED` env var (API/server) so worksheets can be toggled without deploy when ready. All other items are independent page/component changes. Feedback form saves to new `Feedback` DB model and sends admin notification via Resend.

**Tech Stack:** Next.js 14, PostHog, Resend, Prisma, Clerk, Three.js (explore), Tailwind + inline styles.

---

## Current State Notes (from codebase scan)

- **About page:** exists at `app/about/page.tsx` with placeholder team (Jane Archer, Marcus Hale, Sofia Reyes) — needs full rebuild
- **Pricing:** Homestead has "Private community access" (doesn't exist yet) → remove. Schoolhouse doesn't list it at all. Plans not properly stacked.
- **Contact form:** already uses Resend (direct fetch to api.resend.com), from `onboarding@resend.dev`, no SDK installed
- **Worksheets:** 140+ references across codebase — dashboard, lessons pages, lesson detail, account, home page, API routes
- **PostHog:** initialized in providers.tsx, `useFeatureFlagEnabled` not yet used anywhere
- **Explore pulsing:** Three.js useFrame animation in `PhilosophyStar.tsx`, not CSS keyframes
- **Suggest curriculum link:** `app/explore/page.tsx` around lines 260-273
- **Feedback:** nothing exists yet

---

## Task 1: Worksheet Feature Flag

**Context:** Hide ALL worksheet functionality until ready to ship. Two-layer approach:

- __UI layer:__ `NEXT_PUBLIC_WORKSHEETS_ENABLED=false` env var — client components check this to hide/show
- **API layer:** same env var read server-side — returns 404 if worksheets disabled

When ready to launch: set `NEXT_PUBLIC_WORKSHEETS_ENABLED=true` in Railway → redeploy → worksheets appear. No PostHog dashboard changes needed (simpler than dual-system).

**Files:**

- Create: `web/src/lib/featureFlags.ts`
- Modify: `web/src/app/api/worksheets/route.ts`
- Modify: `web/src/app/api/worksheets/standard/route.ts`
- Modify: `web/src/app/api/worksheets/standard/[id]/pdf/route.ts`
- Modify: `web/src/app/api/lessons/[id]/worksheet/route.ts`
- Modify: `web/src/app/dashboard/page.tsx` (recent worksheets strip + usage bar)
- Modify: `web/src/app/lessons/page.tsx` (worksheets tab + CTA)
- Modify: `web/src/app/lessons/[id]/page.tsx` (Create Worksheet section)
- Modify: `web/src/app/account/page.tsx` (worksheets usage bar)
- Modify: `web/src/app/page.tsx` (worksheet feature section)
- Modify: `web/src/components/pricing-section.tsx` (remove worksheet counts from features)
- Modify: `web/.env` (add flag)

**Step 1: Create feature flags helper**

```typescript
// web/src/lib/featureFlags.ts
export const WORKSHEETS_ENABLED =
  process.env.NEXT_PUBLIC_WORKSHEETS_ENABLED === "true";
```

**Step 2: Add env var to web/.env**

```sh
NEXT_PUBLIC_WORKSHEETS_ENABLED=false
```

**Step 3: Block all 4 worksheet API routes**

In each of these routes, add at the very top of the handler, after auth check:

```typescript
import { WORKSHEETS_ENABLED } from "@/lib/featureFlags";

// Add as first check inside POST/GET:
if (!WORKSHEETS_ENABLED) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

Routes to update:

- `web/src/app/api/worksheets/route.ts` (GET handler)
- `web/src/app/api/worksheets/standard/route.ts` (GET + POST handlers)
- `web/src/app/api/worksheets/standard/[id]/pdf/route.ts` (GET handler)
- `web/src/app/api/lessons/[id]/worksheet/route.ts` (GET + POST handlers)

**Step 4: Hide worksheet UI in lesson detail page**

In `web/src/app/lessons/[id]/page.tsx`, wrap the entire `{/* ── Worksheets ── */}` section:

```tsx
import { WORKSHEETS_ENABLED } from "@/lib/featureFlags";

// Replace the worksheets section div with:
{WORKSHEETS_ENABLED && (
  <div style={{ marginTop: "0.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
    {/* existing worksheet content */}
  </div>
)}
```

**Step 5: Hide worksheets tab + CTA in lessons list**

In `web/src/app/lessons/page.tsx`:

- Remove the "Worksheets" tab button from the status tabs row (it's added to the flex gap 1 tabs)
- Remove the worksheets `activeTab === "worksheets"` conditional block
- Remove the worksheets data fetch from the `Promise.all`
- Remove the `worksheets` state and `worksheetsByLesson` memo
- Hide the `+ Create Lesson` → `Upgrade for more lessons →` CTA if worksheets-only (the CTA itself is fine, just remove worksheet mention)

**Step 6: Hide worksheet strip in dashboard**

In `web/src/app/dashboard/page.tsx`, wrap the recent worksheets section:

```tsx
{WORKSHEETS_ENABLED && worksheets.length > 0 && (
  // recent worksheets strip
)}
```

Also hide `worksheetsUsed`/`worksheetsLimit` from the usage snapshot bar.

**Step 7: Hide worksheet references in account page**

In `web/src/app/account/page.tsx`, wrap the worksheets usage bar:

```tsx
{WORKSHEETS_ENABLED && tierData.tier !== "compass" && (
  <UsageBar used={tierData.worksheetsUsed} limit={tierData.worksheetsLimit} label="Worksheets this month" />
)}
```

**Step 8: Remove worksheet feature section from home page**

In `web/src/app/page.tsx`, find the feature deep-dive section with worksheet content (lines ~450-528) and remove it from the `PLANS` array / feature sections map.

**Step 9: Remove worksheet counts from pricing**

In `web/src/components/pricing-section.tsx`, remove these features from both Homestead and Schoolhouse:

- "5 worksheets per month" (Homestead)
- "15 worksheets per month" (Schoolhouse)
   Also remove the footer note: `"Worksheets available on Homestead and Schoolhouse plans."`

**Step 10: Build check**

```bash
cd ~/github/edu-app/web && npm run build
```

Expected: `✓ Compiled successfully`

**Step 11: Commit**

```bash
git add -A
git commit -m "feat: feature-flag all worksheet UI and API routes

NEXT_PUBLIC_WORKSHEETS_ENABLED=false hides worksheets entirely:
- All 4 worksheet API routes return 404 when disabled
- Lesson detail: Create Worksheet section hidden
- Lessons list: Worksheets tab removed, batch fetch removed
- Dashboard: Recent worksheets strip + quota bar hidden
- Account: Worksheets usage bar hidden
- Home page: Worksheet feature section removed
- Pricing: Worksheet counts removed from all tiers

Set NEXT_PUBLIC_WORKSHEETS_ENABLED=true in Railway to enable."
```

---

## Task 2: Fix Pricing Card Copy

**Context:** Remove "Private community access" (doesn't exist). Make tiers feel stacked — Schoolhouse should feel premium because it has MORE of everything, not different things.

**Files:**

- Modify: `web/src/components/pricing-section.tsx`

**Step 1: Update Homestead features**

Current Homestead features (remove community access, add clarity):

```md
- 30 lessons per month
- Up to 4 children with full profiles
- Full curriculum matching (70+ curricula)
- State standards tracking, all 50 states
```

**Step 2: Update Schoolhouse features**

Make it clearly "everything Homestead has + more":

```hs
- 100 lessons per month — double the capacity
- Up to 8 children with full profiles
- Full curriculum matching (70+ curricula)
- State standards tracking, all 50 states
- Priority support
```

**Step 3: Verify Co-op plan copy is unchanged**

**Step 4: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/components/pricing-section.tsx
git commit -m "fix(pricing): remove private community access, clarify tier stacking"
```

---

## Task 3: About Page Rebuild

**Context:** Current page has 3 fake team members. Rebuild with 2 real founders + family photos. Photos drop into `public/team/` as: `founder.jpg`, `cofounder.jpg`, `family-1.jpg`, `family-2.jpg`, `family-3.jpg`. Copy uses `[PLACEHOLDER]` markers so user can fill in.

**Files:**

- Modify: `web/src/app/about/page.tsx`
- Create dir: `web/public/team/` (add a `.gitkeep`)

**Step 1: Create the team photos directory**

```bash
mkdir -p ~/github/edu-app/web/public/team
touch ~/github/edu-app/web/public/team/.gitkeep
```

**Step 2: Rewrite about page**

```tsx
// web/src/app/about/page.tsx
import { Shell } from "@/components/shell";
import Image from "next/image";
import Link from "next/link";

// ── Design tokens (match app palette) ────────────────────────────────────────
const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "14px",
  padding: "2rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

// ── Founder data — fill in placeholders ──────────────────────────────────────
const FOUNDERS = [
  {
    photo: "/team/founder.jpg",
    name: "[FOUNDER NAME]",
    title: "[FOUNDER TITLE]",
    blurb: "[FOUNDER BLURB — replace with real copy about their background, mission, and what drove them to build The Sage's Compass]",
  },
  {
    photo: "/team/cofounder.jpg",
    name: "[CO-FOUNDER NAME]",
    title: "[CO-FOUNDER TITLE]",
    blurb: "[CO-FOUNDER BLURB — replace with real copy]",
  },
];

const FAMILY_PHOTOS = [
  { src: "/team/family-1.jpg", alt: "Founders with family" },
  { src: "/team/family-2.jpg", alt: "Family learning together" },
  { src: "/team/family-3.jpg", alt: "Homeschool life" },
];

export default function AboutPage() {
  return (
    <Shell hue="home">
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 0 5rem" }}>

        {/* ── Mission header ── */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
            Our Story
          </p>
          <h1 className="font-cormorant-sc" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: "1.25rem" }}>
            Built by educators, for families.
          </h1>
          <p className="font-cormorant" style={{ fontSize: "1.15rem", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
            The Sage's Compass started with a simple question: why is it so hard to plan a lesson that actually fits your child, your values, and your life?
          </p>
        </div>

        {/* ── Founders ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "4rem" }}>
          {FOUNDERS.map((founder) => (
            <div key={founder.name} style={{ ...frostCard, display: "grid", gridTemplateColumns: "200px 1fr", gap: "2rem", alignItems: "flex-start" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
                <Image
                  src={founder.photo}
                  alt={founder.name}
                  fill
                  style={{ objectFit: "cover" }}
                  onError={() => {}} // silently fail if photo not yet uploaded
                />
              </div>
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.4rem" }}>
                  {founder.title}
                </p>
                <h2 className="font-cormorant-sc" style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "1rem", letterSpacing: "0.03em" }}>
                  {founder.name}
                </h2>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
                  {founder.blurb}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Family photos ── */}
        <div style={{ marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", textAlign: "center", marginBottom: "1.5rem" }}>
            Life behind the app
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {FAMILY_PHOTOS.map((photo, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
                <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Mission statement ── */}
        <div style={{ ...frostCard, textAlign: "center" }}>
          <h2 className="font-cormorant-sc" style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "1rem" }}>
            What We Believe
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: "620px", margin: "0 auto 1.5rem" }}>
            Every family has a unique teaching philosophy, and every child learns differently. Curriculum should serve your values — not the other way around. We built The Sage's Compass so that creating a lesson that's perfectly matched to your child, your philosophy, and your standards takes minutes, not hours.
          </p>
          <Link href="/compass" style={{ display: "inline-block", background: "#0B2E4A", color: "#F9F6EF", borderRadius: "10px", padding: "0.65rem 1.75rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            Find Your Teaching Archetype →
          </Link>
        </div>

      </div>
    </Shell>
  );
}
```

**Step 3: Handle missing photos gracefully**

The `Image` component with `onError` will silently fail. Add a fallback background color so the layout doesn't break before photos are added.

**Step 4: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/about/page.tsx web/public/team/.gitkeep
git commit -m "feat(about): rebuild with 2-founder layout, family photos, placeholder content"
```

---

## Task 4: Resend Welcome Email

**Context:** Contact form already uses Resend via direct API fetch. Welcome email needs to fire from the Clerk `user.created` webhook. API key + domain setup is pending (user will provide) — build the template + wiring now, key goes in Railway later.

**Files:**

- Create: `web/src/lib/email.ts` (shared Resend helper)
- Modify: `web/src/app/api/webhooks/clerk/route.ts` (send welcome on user.created)
- Modify: `web/src/app/api/contact/route.ts` (update from address)

**Step 1: Create shared email helper**

```typescript
// web/src/lib/email.ts
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hello@sagescompass.com";
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL ?? "hello@sagescompass.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: `The Sage's Compass <${FROM_EMAIL}>`, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error("[email] Resend error:", await res.text());
}

// ── Email templates ───────────────────────────────────────────────────────────

export function welcomeEmailHtml(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:40px 20px;color:#222;background:#FDFBF7;">
  <div style="text-align:center;margin-bottom:32px;">
    <p style="font-variant:small-caps;font-size:1.1rem;color:#0B2E4A;letter-spacing:0.06em;margin:0;">The Sage's Compass</p>
  </div>
  <h1 style="font-variant:small-caps;font-size:1.6rem;color:#0B2E4A;margin-bottom:8px;">
    Welcome${firstName ? `, ${firstName}` : ""}! 🧭
  </h1>
  <p style="font-size:1rem;line-height:1.75;color:#444;margin-bottom:20px;">
    We're so glad you're here. The Sage's Compass was built for families like yours — ones who care deeply about how their children learn and want curriculum that actually fits their values.
  </p>
  <div style="background:#F0EAE0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-weight:600;color:#0B2E4A;margin:0 0 12px;font-size:0.95rem;">Here's what you can do right now:</p>
    <ul style="margin:0;padding-left:1.2rem;line-height:2;font-size:0.9rem;color:#444;">
      <li><strong>Take the Compass Quiz</strong> — discover your teaching archetype in 5 minutes</li>
      <li><strong>Explore curricula</strong> — browse 70+ matched to your philosophy</li>
      <li><strong>Generate a lesson</strong> — pick an interest, get a complete lesson plan</li>
    </ul>
  </div>
  <p style="font-size:0.9rem;line-height:1.75;color:#555;margin-bottom:24px;">
    If you ever have a question, get stuck, or just want to share feedback — just reply to this email. We read every message and respond personally.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://thesagescompass.com/compass" style="background:#0B2E4A;color:#F9F6EF;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:0.9rem;font-weight:600;">
      Take the Compass Quiz →
    </a>
  </div>
  <p style="font-size:0.85rem;color:#888;font-style:italic;line-height:1.7;">
    With gratitude,<br>
    The Sage's Compass Team
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="font-size:0.75rem;color:#aaa;text-align:center;">
    © The Sage's Compass · <a href="https://thesagescompass.com" style="color:#aaa;">thesagescompass.com</a>
  </p>
</body>
</html>`;
}

export function contactNotificationHtml(name: string, email: string, subject: string, message: string): string {
  return `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:32px 20px;color:#222;">
  <h2 style="color:#0B2E4A;">New Contact Form Submission</h2>
  <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
  <p><strong>Subject:</strong> ${subject}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <p style="white-space:pre-wrap;">${message}</p>
</body></html>`;
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to The Sage's Compass 🧭",
    html: welcomeEmailHtml(firstName),
  });
}

export async function sendContactNotification(name: string, email: string, subject: string, message: string) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Contact] ${subject} — from ${name}`,
    html: contactNotificationHtml(name, email, subject, message),
    replyTo: email,
  });
}
```

**Step 2: Wire welcome email to Clerk webhook**

In `web/src/app/api/webhooks/clerk/route.ts`, in the `user.created` handler block:

```typescript
import { sendWelcomeEmail } from "@/lib/email";

// Inside the user.created block, after saving to DB:
} else if (type === "user.created" || type === "user.updated") {
  const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
  const primaryId = data.primary_email_address_id as string | undefined;
  const email = emailAddresses?.find((e) => e.id === primaryId)?.email_address;
  const firstName = (data.first_name as string | undefined) ?? "";
  if (email) {
    await prisma.user.upsert({ where: { id: userId }, update: { email }, create: { id: userId, email } });
    console.log(`[clerk webhook] Synced email for user=${userId}`);
    // Send welcome email only on user creation
    if (type === "user.created") {
      await sendWelcomeEmail(email, firstName).catch(err => console.error("[welcome email]", err));
    }
  }
}
```

**Step 3: Update contact form API to use shared helper**

In `web/src/app/api/contact/route.ts`, replace the direct Resend fetch with the shared helper:

```typescript
import { sendContactNotification } from "@/lib/email";
// Replace the fetch block with:
await sendContactNotification(name, email, subject, message);
```

**Step 4: Add env vars to .env (placeholder)**

```sh
RESEND_API_KEY=re_placeholder_replace_with_real_key
RESEND_FROM_EMAIL=hello@sagescompass.com
RESEND_ADMIN_EMAIL=hello@sagescompass.com
```

**Step 5: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/lib/email.ts web/src/app/api/webhooks/clerk/route.ts web/src/app/api/contact/route.ts
git commit -m "feat(email): welcome email + contact notification via Resend shared helper

- Shared email.ts helper with sendEmail, sendWelcomeEmail, sendContactNotification
- Welcome email fires on Clerk user.created webhook
- Contact form uses shared helper (was direct Resend fetch)
- Warm, personal welcome email template with Compass Quiz CTA
- NOTE: Add RESEND_API_KEY, RESEND_FROM_EMAIL to Railway when ready"
```

---

## Task 5: Explore Page — Electric Pulsing Colors

__Context:__ The pulsing animation for the user's primary/secondary philosophy in the star map is in `PhilosophyStar.tsx`. The pulse glow color is based on the philosophy's color from `PHILOSOPHY_COLORS` scoring. Need to find where matched philosophy nodes get their highlight color and make it more saturated/electric — same color family, just more vibrant.

**Files:**

- Read: `web/src/components/explore/PhilosophyStar.tsx` (full file)
- Read: `web/src/lib/compass/scoring.ts` (PHILOSOPHY_COLORS map)
- Modify: `web/src/components/explore/PhilosophyStar.tsx`

**Step 1: Read PhilosophyStar.tsx completely first**

Look for where the matched/pulsing philosophy gets its color set in the Three.js material or the pulse intensity. The pulse is driven by `isMatch` or similar prop. The color should be boosted when `isPrimary` or `isSecondary`.

**Step 2: Find the philosophy color constants**

In `web/src/lib/compass/scoring.ts`, find `PHILOSOPHY_COLORS`. These are muted watercolor colors (designed for text). For the electric pulse we want saturated versions.

Create a `PHILOSOPHY_COLORS_ELECTRIC` map alongside the existing one — same hues but pushed to full saturation:

```typescript
// In scoring.ts, add alongside PHILOSOPHY_COLORS:
export const PHILOSOPHY_COLORS_ELECTRIC: Record<string, string> = {
  "montessori-inspired":    "#2E8B57",  // emerald green
  "waldorf-adjacent":       "#8B2FC9",  // vivid violet
  "charlotte-mason":        "#D44000",  // burnt orange electric
  "classical":              "#1B4FBB",  // royal blue
  "project-based-learning": "#C4830A",  // electric gold
  "place-nature-based":     "#1A7A3C",  // forest green electric
  "unschooling":            "#C92E7B",  // electric pink
  "adaptive":               "#0E7C8A",  // electric teal
};
```

**Step 3: In PhilosophyStar, pass electric color to matched nodes**

Find where `isPrimary` and `isSecondary` props are used to determine pulse intensity. Use `PHILOSOPHY_COLORS_ELECTRIC[philosophyId]` for the glow color instead of the muted `PHILOSOPHY_COLORS` version. The pulse should already be more visible — just making the color pop.

**Step 4: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/components/explore/PhilosophyStar.tsx web/src/lib/compass/scoring.ts
git commit -m "feat(explore): electric pulse colors for primary/secondary philosophy nodes"
```

---

## Task 6: Explore Page — Suggest Curriculum Font

**Context:** "Don't see your curriculum? Suggest one →" link at bottom of explore page is hard to read on dark blue background. Make it lighter and slightly bigger.

**Files:**

- Modify: `web/src/app/explore/page.tsx` (around lines 260-273)

**Step 1: Read the current suggest curriculum section**

Find the exact JSX and current styles.

**Step 2: Update the link style**

Change the text color from whatever muted color it currently is to a lighter/more visible version, and bump font size from ~0.8rem to ~0.95rem:

```tsx
// Find and update the suggest curriculum link:
<Link
  href="/contact?subject=curriculum-suggestion"
  style={{
    fontSize: "0.95rem",        // was ~0.8rem
    color: "rgba(255,255,255,0.75)",  // was likely rgba(255,255,255,0.4) or similar
    textDecoration: "none",
    fontStyle: "italic",
    letterSpacing: "0.02em",
    transition: "color 0.2s",
  }}
>
  Don&apos;t see your curriculum? Suggest one →
</Link>
```

**Step 3: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/src/app/explore/page.tsx
git commit -m "fix(explore): larger, lighter font for suggest curriculum link"
```

---

## Task 7: Floating Feedback Button + In-App Form

**Context:** Floating bottom-right button on all authenticated pages. Clicking opens a modal with pre-filled user info. Submission saves to DB and sends Resend notification. Requires new Prisma model.

**Files:**

- Modify: `web/prisma/schema.prisma` (add Feedback model)
- Create: `web/src/app/api/feedback/route.ts`
- Create: `web/src/components/FeedbackButton.tsx`
- Modify: `web/src/app/layout.tsx` OR a root layout that wraps authenticated pages

**Step 1: Add Feedback model to schema**

```prisma
model Feedback {
  id        String   @id @default(cuid())
  userId    String?
  email     String
  name      String?
  plan      String?
  message   String   @db.Text
  category  String   // "bug" | "feature" | "general"
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

Run migration:

```bash
cd ~/github/edu-app/web && npx prisma migrate dev --name add_feedback
```

**Step 2: Create the API route**

```typescript
// web/src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json();
  const { category, message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Get user context
  const clerkUser = userId ? await currentUser() : null;
  const email = clerkUser?.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "anonymous";
  const name = clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() : "Anonymous";

  // Get plan from DB
  const dbUser = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { tier: true, createdAt: true } }) : null;
  const plan = dbUser?.tier ?? "unknown";
  const memberSince = dbUser?.createdAt ? Math.floor((Date.now() - dbUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + " days" : "unknown";

  // Save to DB
  await prisma.feedback.create({
    data: { userId: userId ?? null, email, name, plan, category: category ?? "general", message },
  });

  // Send notification
  await sendEmail({
    to: process.env.RESEND_ADMIN_EMAIL ?? "hello@sagescompass.com",
    subject: `[Feedback] ${category ?? "general"} — ${name}`,
    html: `<div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:32px 20px;">
      <h2 style="color:#0B2E4A;">New Feedback</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Plan:</strong> ${plan} · <strong>Member for:</strong> ${memberSince}</p>
      <p><strong>Category:</strong> ${category}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="white-space:pre-wrap;">${message}</p>
    </div>`,
  }).catch(() => {}); // non-blocking

  return NextResponse.json({ ok: true });
}
```

**Step 3: Create FeedbackButton component**

```tsx
// web/src/components/FeedbackButton.tsx
"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

const CATEGORIES = [
  { value: "bug", label: "Something's broken" },
  { value: "feature", label: "Feature idea" },
  { value: "general", label: "General feedback" },
];

export function FeedbackButton() {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isSignedIn) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setMessage(""); setCategory("general"); }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 100,
          background: "#0B2E4A", color: "#F9F6EF",
          border: "none", borderRadius: "50px",
          padding: "0.55rem 1.1rem",
          fontSize: "0.8rem", fontWeight: 600, fontFamily: "Georgia, serif",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(11,46,74,0.3)",
          display: "flex", alignItems: "center", gap: "0.4rem",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <span style={{ fontSize: "1rem" }}>💬</span> Feedback
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(11,46,74,0.3)", backdropFilter: "blur(2px)", zIndex: 200 }}
        />
      )}

      {/* Modal panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "80px", right: "24px", zIndex: 300,
          width: "min(360px, calc(100vw - 48px))",
          background: "rgba(253,251,247,0.97)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.1)", borderRadius: "14px",
          padding: "1.5rem", boxShadow: "0 8px 32px rgba(11,46,74,0.18)",
          display: "flex", flexDirection: "column", gap: "0.875rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="font-cormorant-sc" style={{ fontSize: "1rem", color: "#0B2E4A", margin: 0 }}>Share Feedback</h3>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#888", padding: "0 4px" }}>×</button>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ fontSize: "0.9rem", color: "#4a8b6e" }}>✓ Thank you — we read every message.</p>
            </div>
          ) : (
            <>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ padding: "0.45rem 0.6rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.85rem", fontFamily: "Georgia, serif", background: "rgba(255,255,255,0.8)", color: "#333" }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                style={{ padding: "0.5rem 0.65rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", fontFamily: "Georgia, serif", resize: "vertical", background: "rgba(255,255,255,0.8)", color: "#222", lineHeight: 1.6 }}
              />

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                style={{
                  background: "#0B2E4A", color: "#F9F6EF", border: "none", borderRadius: "8px",
                  padding: "0.6rem", fontSize: "0.875rem", fontWeight: 600, fontFamily: "Georgia, serif",
                  cursor: message.trim() && !submitting ? "pointer" : "not-allowed",
                  opacity: message.trim() && !submitting ? 1 : 0.5,
                }}
              >
                {submitting ? "Sending…" : "Send Feedback"}
              </button>

              <p style={{ fontSize: "0.72rem", color: "#aaa", textAlign: "center", margin: 0 }}>
                We reply personally to every message.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
```

**Step 4: Add FeedbackButton to layout**

In `web/src/app/layout.tsx`, add inside `<PHProvider>`:

```tsx
import { FeedbackButton } from "@/components/FeedbackButton";

// Inside body, after {children}:
<FeedbackButton />
```

**Step 5: Add /api/feedback to middleware public routes check**

In `web/src/middleware.ts`, the API routes are already excluded from the public route matcher (the `if (!isPublicRoute(req))` check doesn't apply to api routes that require auth). The `/api/feedback` route uses `auth()` which will handle unauthenticated requests. No middleware change needed.

**Step 6: Build check + commit**

```bash
cd ~/github/edu-app/web && npm run build
git add web/prisma/schema.prisma web/prisma/migrations/ web/src/app/api/feedback/route.ts web/src/components/FeedbackButton.tsx web/src/app/layout.tsx
git commit -m "feat(feedback): floating feedback button + in-app form

- FeedbackButton component: fixed bottom-right, authenticated only
- Three categories: bug / feature idea / general
- Saves to Feedback DB table with user context (plan, member duration)
- Sends admin notification via Resend
- Warm 'we reply personally' confirmation message"
```

---

## Task 8: Test Purchase Verification (manual)

**Context:** Staying in Clerk test mode. Verify the full checkout → webhook → tier update flow works end-to-end before flipping to production.

**Checklist (manual steps, no code changes):**

1. Go to `/pricing` — verify plans show correctly
2. Click "Start Homestead" — Clerk checkout drawer opens
3. Use test card `4242 4242 4242 4242`, any future date, any CVV
4. Complete checkout
5. Check Clerk dashboard → Webhooks → Recent Deliveries — confirm `subscription.created` event fired
6. Check DB in Prisma Studio — confirm `user.tier` updated to "homestead"
7. Navigate to Dashboard — confirm tier badge shows "Homestead", limits updated
8. Navigate to Account page — confirm tier display correct
9. Go to `/pricing` again — confirm "Active" shows on Homestead plan

__If anything fails:__ Note which step and debug the webhook handler. Common issues: webhook secret mismatch (check `CLERK_WEBHOOK_SECRET` in .env), plan key slug mismatch (check `PLAN_TO_TIER` map in webhook route).

---

## Execution Order

Tasks 1, 2, 3, 5, 6, 7 can mostly run in parallel (different files). Task 4 (email) touches webhook route which doesn't conflict with others.

**Parallel groups:**

- Group A: Task 1 (feature flag) + Task 2 (pricing)
- Group B: Task 3 (about page) + Task 6 (explore font)
- Group C: Task 4 (Resend emails)
- Group D: Task 5 (explore colors) + Task 7 (feedback)

**Then:** Task 8 (manual test) after all code is deployed.

## Verification

```bash
# Full build
cd ~/github/edu-app/web && npm run build

# All routes
curl http://localhost:3001 -o /dev/null -w "%{http_code}\n"
curl http://localhost:3001/about -o /dev/null -w "%{http_code}\n"
curl http://localhost:3001/pricing -o /dev/null -w "%{http_code}\n"
curl http://localhost:3001/explore -o /dev/null -w "%{http_code}\n"

# Worksheet routes blocked
curl -X POST http://localhost:3001/api/worksheets/standard -H "Content-Type: application/json" -d '{}' -w "%{http_code}\n"
# Expected: 401 (auth required) or 404 (feature flagged) — NOT 200
```
