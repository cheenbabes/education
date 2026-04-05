# Edu-App: Multi-Task Implementation Plan

## Collected Tasks

1. Quiz answer enrichment — store question + answer text, not just indices
2. User email storage — real email in DB instead of placeholder, sync via webhook
3. Home page mobile responsiveness — fix squished layouts, keep compass ring
4. Worksheet evals — math/science quality assurance plan
5. Dashboard enrichment — richer experience, recently generated content
6. Analytics — PostHog implementation

---

## Task 1: Quiz Answer Enrichment

**Context:** `quizAnswers` JSON already stored per attempt, but only as raw indices (`{q2: 2, q3: 1}`). Reviewing past attempts requires cross-referencing the question bank. Need human-readable stored data.

**No migration needed** — `quizAnswers` is already `Json?`.

**Files:**
- Modify: `web/src/app/compass/quiz/page.tsx` (partially started — `buildRichAnswers` added to imports block, need to wire it into both submit calls)

**Steps:**

1. The `buildRichAnswers` helper is already added at the top of the quiz page. Wire it into the early Part 1 save (line ~152):
```tsx
quizAnswers: buildRichAnswers(newAnswers, {}),
```

2. Wire into the final Part 2 submit (line ~209):
```tsx
quizAnswers: buildRichAnswers(part1Answers, part2Answers),
```

**Resulting stored shape:**
```json
{
  "part1": [
    { "questionId": "q2", "theme": "morning routine", "question": "Your child...", "selectedIndex": 2, "selectedText": "We follow a flexible routine..." }
  ],
  "part2": [
    { "questionId": "p2_subjects", "question": "Which subjects?", "selectedValues": ["literacy"], "selectedLabels": ["Language Arts & Literacy"] }
  ]
}
```

---

## Task 2: User Email Storage

**Context:** Every `prisma.user.upsert` call creates users with `email: ${userId}@clerk.placeholder`. Makes DB browsing and reporting impossible. Need real email stored and kept in sync when users change email in Clerk.

**No migration needed** — `User.email` field already exists.

**Files:**
- Create: `web/src/lib/getOrCreateUser.ts`
- Modify: `web/src/app/api/user/route.ts`
- Modify: `web/src/app/api/user/tier/route.ts`
- Modify: `web/src/app/api/lessons/route.ts`
- Modify: `web/src/app/api/children/route.ts`
- Modify: `web/src/app/api/compass/submit/route.ts`
- Modify: `web/src/app/api/webhooks/clerk/route.ts`

**Steps:**

1. Create `web/src/lib/getOrCreateUser.ts`:
```typescript
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getOrCreateUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (existing && !existing.email.endsWith("@clerk.placeholder")) return existing;

  // Fetch real email from Clerk (only on first creation or if still placeholder)
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress ?? `${userId}@clerk.placeholder`;

  return prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: { id: userId, email },
  });
}
```

2. Replace all 5 `prisma.user.upsert({ ..., create: { email: \`${userId}@clerk.placeholder\` } })` calls with `await getOrCreateUser(userId)`.

3. **Webhook handler requires structural changes** — the current handler extracts `userId` from `data.payer.user_id` (billing payload shape) at line 47, then immediately 400s if missing. `user.created`/`user.updated` events have a different shape (`data.id` for user ID, `data.email_addresses[]` for email) so they'd always hit the 400 guard before any handler runs.

The fix is to split the userId extraction — try billing shape first, fall back to user-event shape — and add the handler block:

```typescript
// web/src/app/api/webhooks/clerk/route.ts

// BEFORE (line 47 — billing-only shape):
const userId = (data.payer as { user_id?: string } | undefined)?.user_id;
if (!userId) {
  return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
}

// AFTER — handle both billing events (data.payer.user_id) and user events (data.id):
const userId =
  (data.payer as { user_id?: string } | undefined)?.user_id ??
  (data.id as string | undefined);

if (!userId) {
  console.error("[clerk webhook] No user_id found in payload");
  return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
}
```

Then add the user event handler block inside the existing try/catch, alongside the subscription handlers:

```typescript
} else if (type === "user.created" || type === "user.updated") {
  // data.id = Clerk user ID
  // data.email_addresses = array of { id, email_address }
  // data.primary_email_address_id = ID of the primary email
  const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
  const primaryId = data.primary_email_address_id as string | undefined;
  const email = emailAddresses?.find((e) => e.id === primaryId)?.email_address;
  if (email) {
    await prisma.user.upsert({
      where: { id: userId },
      update: { email },
      create: { id: userId, email },
    });
    console.log(`[clerk webhook] Synced email for user=${userId}`);
  }
}
```

4. **Manual step (user):** In Clerk Dashboard → Webhooks → production endpoint → edit subscribed events → add `user.created` and `user.updated`.

---

## Task 3: Home Page Mobile Responsiveness

**Context:** Several sections squish side-by-side on mobile instead of stacking. Specific issues:
- Compass ring (`archetype-ring-container`) is hidden on mobile — user wants it VISIBLE, stacked below the hero text
- Feature deep-dive alternating rows may not reflow reliably because inline `style` props override CSS media queries
- Section 4 ("Built on Real Pedagogy" equivalent) likely squished

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/page.tsx` (hero section grid + feature row classes)

**Steps:**

1. **Compass ring on mobile** — In globals.css, change `.archetype-ring-container` from `display: none` to visible, and make the hero grid stack:
```css
@media (max-width: 768px) {
  .archetype-ring-container {
    display: flex;  /* was: none */
    justify-content: center;
    margin-top: 2rem;
  }
}
```
Also ensure the hero `gridTemplateColumns: "1fr 1fr"` div stacks — add a CSS class `home-hero-grid` to that div and handle in globals.css.

2. **Feature deep-dive rows** — The alternating feature rows in Section 5 use inline `display: grid; gridTemplateColumns: "1fr 1fr"` without a CSS class, making them hard to target. Add class `home-feature-row` to each row div and ensure the existing `@media (max-width: 768px) .home-feature-row` rule forces single column and correct visual order (visual should always come after text on mobile regardless of `right:` flag).

3. **Section padding** — Ensure section padding is reduced on mobile so content doesn't overflow viewport edges.

4. **Audit remaining inline grids** — Any other two-column inline grids need either a named CSS class or to use Tailwind responsive classes (`grid grid-cols-1 md:grid-cols-2`).

---

## Task 4: Worksheet Evals (Math & Science)

**Context:** Existing `kg-service/evals/lesson_eval.py` evaluates lesson generation (96-test matrix). No equivalent exists for worksheets. User concern: math/science worksheets are generating generic "write observations in a box" content instead of subject-specific practice (fractions diagrams, specific problems, etc.).

**Files:**
- Create: `kg-service/evals/worksheet_eval.py`
- Modify: `kg-service/api/worksheet.py` (potentially improve prompt if evals reveal issues)

**Eval Design:**

Test matrix: 8 philosophies × 2 grade bands (K-3, 4-8) × 2 subjects (Math, Science) = 32 worksheets

Math test cases:
- K-3: fractions, counting, basic operations
- 4-8: fractions, decimals, geometry, word problems

Science test cases:
- K-3: animal habitats, plant life cycles, weather
- 4-8: ecosystems, chemistry basics, physics (forces/motion)

**Scoring dimensions for worksheets:**
1. `SUBJECT_SPECIFICITY` (1-5): Does the worksheet contain specific content (actual fractions, specific organisms, real science concepts) vs generic prompts?
2. `PHILOSOPHY_ALIGNMENT` (1-5): Do section types match the philosophy (Charlotte Mason = narration/copywork, Montessori = observation/hands-on)?
3. `GRADE_APPROPRIATENESS` (1-5): Is complexity appropriate for the grade level?
4. `PRACTICALITY` (1-5): Can a parent actually use this worksheet without additional materials?
5. `VALUE_DENSITY` (1-5): Does the student have enough to do? (Not just one box with lines)

**Failure criteria (critical issues):**
- Generic science box ("observe and draw what you see") for a math worksheet
- No subject-specific content at all
- Instructions that assume classroom equipment a homeschool family won't have

**Script structure** (mirrors lesson_eval.py pattern):
```python
# generate_one(): POST to /generate-worksheet with test case
# evaluate_one(): LLM judge scores worksheet on 5 dimensions
# main(): run matrix, save to reports/worksheet-eval-{timestamp}.json
# CLI: --quick (one per subject), --subject math|science, --grade k3|48
```

**To run:**
```bash
cd ~/github/edu-app/kg-service
.venv/bin/python evals/worksheet_eval.py --quick
```

If scores reveal `SUBJECT_SPECIFICITY < 3` on math/science, the worksheet system prompt in `api/worksheet.py` needs updating to explicitly require subject-specific content (actual problems, diagrams, specific vocabulary) rather than generic observation prompts.

---

## Task 5: Dashboard Enrichment

**Context:** Dashboard currently shows: archetype card, children grid, upcoming lessons, missed lessons, recent completions, calendar. All lesson data. Worksheets are only accessible via the Lessons page. User wants a richer "home base" experience.

**This task is plan + mockup only — no code changes until approved.**

**Available data not yet on dashboard:**
- Recent worksheets (via `GET /api/worksheets`, already exists)
- Worksheet usage this month (from `/api/user/tier` → `worksheetsUsed`)
- Lesson count this month (from same endpoint)

**Proposed additions:**

**A. Recent Worksheets strip** — small horizontal scrollable row below Recent Completions showing last 3-5 worksheets: child name, lesson title, philosophy pill, print button. Pulls from existing `/api/worksheets` endpoint.

**B. Monthly usage snapshot** — small usage bar row (already shown in Account page, could be a compact version on dashboard): "12/30 lessons · 3/5 worksheets · resets May 1"

**C. Quick-create shortcut** — if no lessons exist yet, show a prominent "Create your first lesson" onboarding card instead of empty upcoming section.

**What NOT to merge:** The full lessons list with filtering/sorting belongs on `/lessons`. Dashboard should stay summary-level.

**HTML mockup** will be written to `docs/plans/dashboard-mockup.html` showing the proposed layout before any code changes.

---

## Task 6: Analytics — PostHog

**Recommendation: PostHog** (not Google Analytics)

**Why PostHog over GA4 in 2026:**
- GA4 requires cookie consent banners in most jurisdictions; PostHog can be configured without cookies
- PostHog captures events, sessions, funnels, heatmaps, and session recordings in one tool
- 1M events/month free on cloud (more than enough for early growth)
- First-class Next.js SDK with automatic pageview tracking
- No data sent to Google; better for user trust with privacy-conscious homeschool audience
- Self-hostable if you ever want full data ownership

**Implementation:**

**Files:**
- Create: `web/src/app/providers.tsx` (PostHog provider)
- Modify: `web/src/app/layout.tsx` (wrap with provider)
- Add env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

**Steps:**

1. Install: `npm install posthog-js` in `web/`

2. Create `web/src/app/providers.tsx`:
```tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // handled by PostHogPageView
      capture_pageleave: true,
    });
  }, []);
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

3. Add `PHProvider` to `web/src/app/layout.tsx` wrapping the app body.

4. Add a `PostHogPageView` component (needed for Next.js App Router since navigation doesn't trigger full page loads):
```tsx
"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  useEffect(() => {
    if (pathname && posthog) {
      posthog.capture("$pageview", { $current_url: window.location.href });
    }
  }, [pathname, searchParams, posthog]);
  return null;
}
```

5. Identify logged-in users (add to a client component that has access to Clerk user):
```tsx
const { user } = useUser();
useEffect(() => {
  if (user) posthog.identify(user.id, { email: user.primaryEmailAddress?.emailAddress });
}, [user]);
```

6. **Manual step (user):** Create free account at posthog.com, get project API key, add to Railway:
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**What you get automatically:** pageviews, session duration, referral sources, device/browser, geographic data, user journeys, click heatmaps (with session recording enabled).

**Custom events to add later** (not in this task): lesson_generated, worksheet_created, quiz_completed, plan_upgraded — these give product funnel visibility.

---

## Execution Order

1. Task 1 (quiz enrichment) — 15 min, no risk
2. Task 2 (email storage) — 30 min, low risk
3. Task 6 (analytics) — 30 min, no risk, high value
4. Task 3 (mobile) — 1-2 hrs, medium complexity
5. Task 4 (worksheet evals) — 1 hr, kg-service only
6. Task 5 (dashboard mockup) — 1 hr, plan only

## Verification

- Task 1: Take quiz → check Prisma Studio `CompassResult.quizAnswers` → confirm question text + answer text stored
- Task 2: Create new account → check `User.email` → should be real email, not placeholder
- Task 3: Open home page on iPhone or Chrome mobile emulator (375px) → compass ring visible under hero text, all sections stacked
- Task 4: `cd kg-service && .venv/bin/python evals/worksheet_eval.py --quick` → review scores, especially SUBJECT_SPECIFICITY
- Task 5: Review mockup HTML in browser before any code
- Task 6: Go to PostHog dashboard → verify pageviews tracking after first page load
