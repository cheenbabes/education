# Full Scope of Work — March 31, 2026

This document is the single source of truth for today's work. It combines:
- `plan-rate-limiting.md` (updated with new pricing/limits)
- `2026-03-31-pricing-section-redesign.md`
- Content moderation
- Mobile responsiveness
- Legal pages (Privacy Policy, Terms of Use)
- Worksheet generation (plan only — build follows)

Work is ordered by priority and dependency. Items marked **[BLOCKING]** must be done before items that depend on them.

---

## 1. Pricing Section Redesign `[BLOCKING for rate limiting]`

**Full spec:** `docs/plans/2026-03-31-pricing-section-redesign.md`

**Summary of changes:**
- Annual/monthly toggle, annual selected by default, pill-style switcher
- 4 cards: Compass, Homestead, Schoolhouse, Co-op
- Updated prices: Homestead $21.99/mo · $199/yr · Schoolhouse $29.99/mo · $279/yr
- Updated features: Homestead 30 lessons + 5 worksheets + 4 children; Schoolhouse 60 lessons + 15 worksheets + 8 children
- Drop: coverage reports, teacher education modules, "unlimited annually" wording
- Co-op card with "Get in touch →" → `/contact`, no Stripe
- Footnote updated to mention worksheets

**File:** `web/src/app/page.tsx` — Section 8 only (~645–722)

---

## 2. Rate Limiting & Tier Enforcement `[depends on: pricing redesign for correct values]`

**Billing provider: Clerk Billing** (replaces Stripe). Clerk has built-in subscription management that wraps Stripe under the hood. One dashboard, one provider, tier info available directly in session claims — no separate Stripe integration needed. See Phase 1 / Phase 2 breakdown below.

**Full spec:** `docs/plans/plan-rate-limiting.md` — update the numbers below throughout that doc.

### Updated Tier Definitions (supersedes plan-rate-limiting.md values)

| Tier | Price | Lessons/Month | Worksheets/Month | Children |
|---|---|---|---|---|
| Compass | Free | 3 | 0 | None (grade dropdown only) |
| Homestead | $21.99/mo · $199/yr | 30 | 5 | Up to 4 |
| Schoolhouse | $29.99/mo · $279/yr | 60 | 15 | Up to 8 |

### Schema changes
```prisma
model User {
  tier              String    @default("compass")
  tierExpiresAt     DateTime?
  worksheetsUsed    Int       @default(0)    // reset monthly with lessons
  worksheetsResetAt DateTime?
}
```

### Enforcement points (updated limits)

**Lesson creation (`POST /api/lessons`):**
```ts
const limits = { compass: 3, homestead: 30, schoolhouse: 60 };
```

**Worksheet creation (`POST /api/lessons/[id]/worksheet`) — new:**
```ts
const worksheetLimits = { compass: 0, homestead: 5, schoolhouse: 15 };
// compass: 0 — worksheets not available on free tier
```

**Children limit:**
```ts
const childLimits = { compass: 0, homestead: 4, schoolhouse: 8 };
```

**Annual plan lesson limit:**
```ts
// Annual Homestead/Schoolhouse: set limit to 9999 (effectively unlimited within reason)
// Or track separately: annualUsed vs annualLimit (360 / 720)
```

### Clerk billing config (updated plan prices)
- Compass: free (no Stripe product)
- Homestead monthly: $21.99/mo
- Homestead annual: $199/year
- Schoolhouse monthly: $29.99/mo
- Schoolhouse annual: $279/year

### Upgrade prompt copy (updated prices)
All `$17.99` references → `$21.99`, all `$24.99` references → `$29.99`, all `100 lessons` → `60 lessons`, all `6 children` → `8 children`.

### Implementation order (from plan-rate-limiting.md, unchanged)
1. Add `tier` + `worksheetsUsed` fields to User model + migration
2. Create `GET /api/user/tier` endpoint
3. Create `<TierGate>` component
4. Free-tier create page (grade dropdown, usage badge)
5. Lock Dashboard/Children/Calendar/Standards
6. Enforce lesson limit in `POST /api/lessons`
7. Enforce child limit in `POST /api/children`
8. 429 handling on create page
9. Clerk billing setup
10. KG service rate limiting (concurrent + per-IP)

---

## 3. Content Moderation on Lesson Seed `[independent]`

**Where it goes:** `POST /api/lessons` is where the lesson is *saved* after generation. But generation happens in the KG service, called directly from the create page client. Content moderation must happen **before** the KG service call — either in a new pre-check API endpoint or as the first step in the create page's generation flow.

**Recommended approach: server-side pre-check endpoint**

Add `POST /api/lessons/check-topic` that runs before generation is triggered. The create page calls this first; if it fails, show an error and never call the KG service.

```ts
// POST /api/lessons/check-topic
// Body: { interest: string, philosophy: string }
// Returns: { safe: boolean, reason?: string }

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { interest } = await req.json();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [{
      role: "user",
      content: `You are a content safety classifier for a children's education app serving K-12 students.

Classify the following lesson topic as SAFE or UNSAFE for children ages 5-18.

UNSAFE topics include: sexual content, graphic violence, drug/alcohol use, hate speech, self-harm, or any topic not appropriate for children's education.

Respond with only: SAFE or UNSAFE

Topic: "${interest}"`,
    }],
  });

  const result = (response.content[0] as { text: string }).text.trim();
  const safe = result === "SAFE";

  return NextResponse.json({
    safe,
    reason: safe ? undefined : "This topic is not appropriate for a children's lesson.",
  });
}
```

**Create page changes:**
- Before triggering KG generation, call `POST /api/lessons/check-topic`
- If `safe: false`, show inline error on the interest input: *"This topic isn't appropriate for a children's lesson. Please choose a different subject."*
- Do not call the KG service if the check fails
- Error is shown inline, not a modal — don't lose form state

**Why Haiku:** Fast (< 300ms), cheap (~$0.0003/call), accurate for binary classification. Not worth using Opus/Sonnet for a yes/no guard.

**Additional hardening:**
- Max length on interest field: 200 characters (enforce on client + API)
- Strip HTML/script tags from interest input server-side before the check
- Log flagged attempts (interest text + userId, no PII beyond that) for review

---

## 4. Mobile Responsiveness `[independent, high priority]`

**Audit scope:** All pages accessed without auth (home, compass quiz, archetypes, explore, about, contact) plus the main authenticated pages (create, dashboard, lessons, children).

### Known issues (from homepage code review)

| Location | Issue | Fix |
|---|---|---|
| Hero section | `gridTemplateColumns: "1fr 1fr"` — two columns collapse to unreadable on mobile | Stack to single column below 768px |
| Stats bar | `gridTemplateColumns: "repeat(3, 1fr)"` — 3 columns too tight on small screens | 1 column on mobile, 3 on desktop |
| Archetype grid | `gridTemplateColumns: "repeat(8, 1fr)"` — definitely broken on mobile | 2×4 grid on mobile, 4×2 on tablet, 8×1 on desktop |
| How-it-works | `gridTemplateColumns: "repeat(3, 1fr)"` with long card content | Stack to 1 column on mobile |
| Feature deep-dive | `display: grid, gridTemplateColumns: "1fr 1fr"` per feature row | Stack visual below text on mobile |
| Kids strip image | `width: "1000px", maxWidth: "none"` — intentional overflow, breaks mobile | Add `overflow: hidden` to parent or make responsive |
| Explore iframe | `width: "250%", transform: scale(0.4)` — broken on small viewports | Hide iframe preview on mobile, show static image or CTA only |
| Pricing cards | `gridTemplateColumns: "1fr 1.1fr 1fr"` — will need `"1fr 1fr"` on tablet and 1 column on mobile after adding 4th card | Stack to 2×2 on tablet, 1 column on mobile |
| Founder section | `gridTemplateColumns: "1fr 1.4fr"` | Stack on mobile |

**Approach:** Add a `useIsMobile` hook or use CSS `@media` queries via a `<style>` tag injected into the layout. Since the app uses inline styles throughout (no Tailwind breakpoints on most components), the cleanest fix is to add a `mediaQueries` global CSS block in `globals.css` targeting the section classes, plus convert the most problematic inline grids to use `clamp()` or switch from inline style to className where breakpoints are needed.

**Full audit of remaining pages to be done during implementation** — read each page file and append issues to this doc.

---

## 5. Legal Pages `[independent]`

### Pages to create
- `/privacy` — Privacy Policy
- `/terms` — Terms of Use (includes resale prohibition)
- `/contact` already exists

### Key clauses

**Terms of Use — must include:**
1. **No resale of generated content:** Generated lessons, worksheets, and curriculum plans are licensed for personal, non-commercial family use only. Resale, redistribution, or commercial use of generated content — including as part of a paid curriculum package, tutoring service, or educational product — is strictly prohibited.
2. **AI-generated content disclaimer:** Lessons are generated by AI and should be reviewed by the educator before use. We do not guarantee standards compliance accuracy.
3. **Acceptable use:** Platform is for K-12 educational use only. Users must not attempt to generate content that is inappropriate for children.
4. **Account sharing:** One account per family. Co-op/institutional use requires a Co-op plan.
5. **Subscription terms:** Monthly plans renew automatically. Annual plans renew annually. Cancel anytime.

**Privacy Policy — must include:**
1. What data is collected (account, child profiles, lesson usage — no sale of data)
2. Children's data: child profiles are associated with the parent/guardian account. We do not share child data with third parties.
3. COPPA notice: children under 13 are not permitted to create accounts. Parents manage all child profiles.
4. Data deletion: users can delete their account and all associated data.
5. Third-party services used: Clerk (auth), Stripe (billing), Anthropic (AI generation), Vercel (hosting).

### Footer nav update
Add to footer:
```
Privacy Policy · Terms of Use · Contact
```

### Files to create
- `web/src/app/privacy/page.tsx`
- `web/src/app/terms/page.tsx`
- Update footer component (find via `grep -r "footer\|Footer" web/src`)

---

## 6. Worksheet Generation `[depends on: rate limiting schema]`

**Full spec:** To be written in `docs/plans/2026-03-31-worksheet-generation.md`

**Summary:** "Generate Worksheet" button on lesson detail page. Calls `POST /api/lessons/[id]/worksheet`. Returns philosophy-appropriate printable content (narration prompts, exercises, vocabulary). Print via `window.print()` with print stylesheet initially.

**Blocked by:** Rate limiting schema (need `worksheetsUsed` on User model) and Clerk billing (need to know tier to enforce the 5/15 per month limits).

---

## 7. Small Homepage Additions `[independent, low effort]`

These came out of the secondary competitive analysis and can be done alongside or after the above:

### Audience row (between feature deep-dive and kids strip image)
Four pill/chip labels centered:
```
[ Homeschool Families ]  [ Micro School & Co-ops ]  [ Worldschooling Families ]  [ 2E & Diverse Learners ]
```
One-line subtext under each. ~20 lines of JSX.

### 2E/neurodivergent messaging
No product change yet. Add a line to the Adaptive philosophy description on the create page and homepage referencing UDL (Universal Design for Learning). Full 2E support (learning notes field on child profile) is a separate task.

---

## Implementation Order (Recommended)

| # | Task | Effort | Dependency |
|---|---|---|---|
| 1 | Pricing section redesign (homepage) | 2-3 hrs | None |
| 2 | Content moderation endpoint + create page guard | 1 hr | None |
| 3 | Legal pages (Privacy + Terms) | 2 hrs | None |
| 4 | Mobile audit remaining pages + implement all fixes | 4-6 hrs | None |
| 5 | Audience row + 2E line on homepage | 30 min | None |
| 6 | Rate limiting schema + enforcement (updated prices/limits) | 4-6 hrs | Pricing redesign |
| 7 | Worksheet generation | 2-3 hrs | Rate limiting schema |
| 8 | Clerk billing config | External | Rate limiting |

Items 1–5 can all be done in parallel. Item 6 should follow item 1 (so the limits are consistent with what's shown). Item 7 follows item 6.
