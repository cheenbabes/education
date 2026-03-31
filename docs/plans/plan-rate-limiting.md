# Rate Limiting & Tier Enforcement Plan

## Tier Definitions

| Tier | Price | Lessons/Month | Worksheets/Month | Children | Features |
|------|-------|---------------|------------------|----------|----------|
| Compass (free) | $0 | 3 | 0 | None (grade-only mode) | Quiz + archetype, create lessons with grade selection, view created lessons |
| Homestead | $21.99/mo · $199/yr | 30 | 5 | Up to 4 | Dashboard, children profiles, calendar, standards tracking, multi-child differentiation, community |
| Schoolhouse | $29.99/mo · $279/yr | 60 | 15 | Up to 8 | All Homestead features + priority support |

## Page Access by Tier

| Page | Compass (free) | Homestead | Schoolhouse |
|------|---------------|-----------|-------------|
| **Home** | Open | Open | Open |
| **Compass Quiz** | Open | Open | Open |
| **Archetypes** | Open | Open | Open |
| **Explore Map** | Open | Open | Open |
| **About / Contact** | Open | Open | Open |
| **Create Lesson** | Simplified (grade-only, no children) | Full (child selection, differentiation) | Full |
| **Lessons List** | View only (own lessons) | Full | Full |
| **Lesson Detail** | View only | Full (rate, schedule) | Full |
| **Dashboard** | Locked → upgrade prompt | Full | Full |
| **Children** | Locked → upgrade prompt | Full | Full |
| **Calendar** | Locked → upgrade prompt | Full | Full |
| **Standards** | Locked → upgrade prompt | Full | Full |

## Create Lesson — Free Tier Mode

When on the free tier (`tier === "compass"`), the create page changes:

### What's different:
- **No child selection section** — instead show a simple grade dropdown (K-12)
- **No multi-age toggle** — single grade only
- **Shows remaining lessons**: "Free tier: 2 of 3 lessons remaining this month"
- **Upgrade banner** at top: "Upgrade to Homestead to unlock per-child differentiation, multi-age lessons, and 30 lessons + 5 worksheets per month"

### What stays the same:
- Interest/topic input
- Subject selection (Math, Science, etc.)
- Philosophy selection (all 8)
- Standards from query param (if coming from standards page)

### API behavior:
- `POST /api/lessons` — on free tier, `childIds` is empty array, lesson saved without children
- The KG service receives `children: [{ grade: "4", name: "Student", age: 9 }]` as a generic placeholder

## Locked Pages — Upgrade Prompt

When a free-tier user navigates to Dashboard, Children, Calendar, or Standards, they see:

```
┌─────────────────────────────────────────────┐
│                                             │
│     🔒 Unlock [Page Name]                  │
│                                             │
│     [Page description explaining the value  │
│      of this feature]                       │
│                                             │
│     Upgrade to Homestead to:                │
│     ✓ Track up to 4 children               │
│     ✓ Schedule lessons on the calendar      │
│     ✓ Monitor standards coverage            │
│     ✓ 30 lessons per month                  │
│                                             │
│     [ Upgrade to Homestead — $21.99/mo ]    │
│                                             │
│     Already have a plan? Restore purchase   │
│                                             │
└─────────────────────────────────────────────┘
```

Each locked page has a custom description:
- **Dashboard**: "See your children's progress, upcoming lessons, and track your teaching journey"
- **Children**: "Create profiles for each child with grade level, interests, and learning needs"
- **Calendar**: "Schedule lessons, see your week at a glance, and stay organized"
- **Standards**: "Track which standards each child has covered and identify gaps"

## Schema Changes

### Add `tier` to User model
```prisma
model User {
  ...
  tier          String    @default("compass")  // compass, homestead, schoolhouse
  tierExpiresAt DateTime? // null = free/lifetime, set for paid monthly
  ...
}
```

## Enforcement Points

### 1. Lesson Creation (`POST /api/lessons`)
Before saving a lesson:
```ts
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const monthlyCount = await prisma.lesson.count({
  where: { userId, createdAt: { gte: startOfMonth } },
});

const limits = { compass: 3, homestead: 30, schoolhouse: 60 };
const tier = user?.tier || "compass";
const limit = limits[tier] || 3;

if (monthlyCount >= limit) {
  return 429 { error: "monthly_limit", tier, limit, used: monthlyCount }
}
```

### 2. Children Limit (`POST /api/children`)
```ts
const childLimits = { compass: 0, homestead: 4, schoolhouse: 8 };
// compass: 0 — free tier can't create children at all
```

### 3. Tier-gated pages (middleware or component level)
Create a `<TierGate tier="homestead">` wrapper component:
- Checks user's tier from a `/api/user/tier` endpoint (cached)
- If tier is insufficient, renders the upgrade prompt instead of children
- Used on Dashboard, Children, Calendar, Standards pages

### 4. KG Service Rate Limiting
- Max 1 concurrent generation per user
- Max 10 requests per minute per IP

## Frontend Components

### `<TierGate requiredTier="homestead">`
Reusable wrapper component:
```tsx
// If user tier >= required tier, render children
// Otherwise, render upgrade prompt with page-specific messaging
<TierGate requiredTier="homestead" pageName="Dashboard"
  description="See your children's progress and upcoming lessons">
  <DashboardContent />
</TierGate>
```

### `<UsageBadge />`
Shows on create page and in nav for paid tiers:
- "2 of 3 lessons remaining" (free)
- "28 of 30 lessons this month" (homestead, shown when >50% used)
- "58 of 60 lessons this month" (schoolhouse, shown when >50% used)

### Upgrade prompt on 429
When create page gets 429 from API:
- Frosted card overlay: "You've used all 3 free lessons this month"
- "Upgrade to Homestead" CTA
- "Resets on [1st of next month]"
- Don't lose form state

## Billing Provider: Clerk Billing (not Stripe)

Clerk has built-in subscription management — single provider for auth + billing. No separate Stripe dashboard.

### Phase 1 — No billing config needed (ship now)
All enforcement uses the `tier` DB field defaulting to `"compass"`. Free users are gated immediately. Paid users get manually bumped in DB until Phase 2 is live.

1. Add `tier` + `worksheetsUsed` to User model (default `"compass"`)
2. `GET /api/user/tier` endpoint
3. `<TierGate>` component with frosted upgrade prompt
4. Lock Dashboard / Children / Calendar / Standards
5. Free-tier create page (grade dropdown, usage badge)
6. Enforce lesson limit `POST /api/lessons` → 429
7. Enforce child limit `POST /api/children` → 429
8. 429 overlay on create page

### Phase 2 — Clerk Billing config
- Configure plans in Clerk dashboard: Compass (free), Homestead ($21.99/mo · $199/yr), Schoolhouse ($29.99/mo · $279/yr)
- Read tier from Clerk session: `sessionClaims?.metadata?.tier` or `user.publicMetadata.tier`
- API: `const { userId, sessionClaims } = await auth()` → tier
- Clerk webhook (`user.updated`) syncs tier to DB for enforcement
- Clerk handles checkout UI, upgrades, downgrades, cancellations, receipts

## API: Get User Tier & Usage (`GET /api/user/tier`)
Returns current tier info for frontend:
```json
{
  "tier": "compass",
  "lessonsUsed": 2,
  "lessonsLimit": 3,
  "childrenCount": 0,
  "childrenLimit": 0,
  "resetsAt": "2026-05-01T00:00:00Z"
}
```
Called on page load by create page and nav (cached client-side).

## Implementation Order

1. **Add `tier` field to User model + migration** — default "compass"
2. **Create `GET /api/user/tier` endpoint** — returns tier + usage
3. **Create `<TierGate>` component** — reusable upgrade prompt
4. **Free-tier create page** — grade dropdown instead of children, usage badge
5. **Lock Dashboard/Children/Calendar/Standards** — wrap in TierGate
6. **Enforce lesson limit in `POST /api/lessons`** — return 429
7. **Enforce child limit in `POST /api/children`** — return 429
8. **429 handling on create page** — upgrade prompt overlay
9. **Usage badge in nav** for paid tiers
10. **Clerk billing setup** — configure plans in dashboard
11. **KG service rate limiting** — concurrent + per-IP limits

## Edge Cases
- **Annual Homestead**: set lesson limit to 9999 (no hard cap — annual commitment, cost absorbed)
- **Annual Schoolhouse**: same, set to 9999
- **Tier downgrade mid-month**: Don't delete existing lessons/children, just prevent new ones
- **Grace period**: 3 days after payment failure before downgrade
- **Existing demo users**: All get "compass" tier by default
- **Free tier viewing lessons**: Can view lessons they created, but can't rate/schedule (those need children)
