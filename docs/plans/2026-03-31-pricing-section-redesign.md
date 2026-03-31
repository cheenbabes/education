# Pricing Section Redesign Plan
*Date: 2026-03-31*

## Goal

Redesign the homepage pricing section to reflect finalized pricing, add an annual/monthly toggle (annual default), fix inaccurate feature copy, and add a Co-op card. No Stripe wiring is in scope for this plan — CTA buttons link to `/compass` or `/contact` for now.

---

## Final Pricing

| Plan | Monthly | Annual | Annual/mo equiv |
|---|---|---|---|
| Compass | Free | — | — |
| Homestead | $21.99/mo | $199/year | ~$16.58/mo |
| Schoolhouse | $29.99/mo | $279/year | ~$23.25/mo |
| Co-op | Contact | Contact | — |

Annual saves ~2 months vs monthly for both paid tiers.

---

## Tier Feature Matrix (Source of Truth for Copy)

### Compass — Free
- Full Compass Quiz + teaching archetype discovery
- 3 lesson generations per month (grade dropdown, no child profile required)
- Top 3 curriculum matches for your philosophy
- Explore star map (interactive)
- No child tracking, no standards tracking

### Homestead — $21.99/mo · $199/year
- 30 lessons per month
- 5 worksheets per month
- Up to 4 children with full profiles
- Full curriculum matching (70+ curricula)
- State standards tracking, all 50 states
- Private community access
- Email support

### Schoolhouse — $29.99/mo · $279/year
- 60 lessons per month
- 15 worksheets per month
- Up to 8 children with full profiles
- Full curriculum matching (70+ curricula)
- State standards tracking, all 50 states
- Private community access
- Priority support

### Co-op — Contact
- Multiple teacher accounts
- Shared student rosters
- Group lesson planning
- Custom lesson volume
- CTA: "Get in touch →" → `/contact`

**Notes:**
- Explore star map is interactive on all plans including free. Remove any view-only language.
- "Coverage reports" feature is dropped. Standards progress bars cover this visually.
- "Teacher education modules" feature is dropped. Placeholder, not built.
- All plans include all 8 philosophies and the Compass Quiz. This stays in the footnote.

---

## Annual/Monthly Toggle

### Behavior
- **Default: Annual selected**
- Toggle label: `Annual (Save 2 Months)` | `Monthly`
- When Annual is selected:
  - Homestead shows: `$16.58/mo` with subtext `billed $199/year`
  - Schoolhouse shows: `$23.25/mo` with subtext `billed $279/year`
  - A "Save 2 months" badge appears on Homestead and Schoolhouse cards
- When Monthly is selected:
  - Homestead shows: `$21.99/mo`
  - Schoolhouse shows: `$29.99/mo`
  - Badge disappears
- Compass and Co-op cards are unaffected by the toggle (no price change)
- Toggle is a pill-style switcher, centered above the cards, consistent with the existing watercolor aesthetic

### Implementation notes
- Toggle is client-side only (`useState`) — no API calls
- Monthly equivalent on annual is shown as the headline price (e.g. `$16.58`) with a smaller `/ mo` suffix and a second line `billed $199/year`
- Price should not show cents on the annual-billed display — show `$199/year` not `$199.00/year`

---

## Card Layout Changes

### Grid
- Current: 3 columns (`1fr 1.1fr 1fr`)
- New: 4 columns (`1fr 1.05fr 1.05fr 1fr`) — Homestead and Schoolhouse slightly larger, Compass and Co-op equal
- Homestead keeps the featured/raised treatment (dark background, gold badge)

### Homestead card (featured)
- Badge: "Most Popular" (keep)
- Remove: "30 lessons per month (unlimited annually)" → replace with "30 lessons per month"
- Remove: multi-child differentiation as a separate bullet (it's implied by "up to 4 children")
- Add: "5 worksheets per month" as a bullet
- Keep: standards tracking, community access

### Schoolhouse card
- Headline price update: $24.99 → $29.99
- Remove: "Up to 100 lessons" → replace with "60 lessons per month"
- Remove: "Up to 6 children" → replace with "Up to 8 children"
- Remove: "Full standards coverage reports" → drop entirely
- Remove: "Access to teacher education modules" → drop entirely
- Add: "15 worksheets per month"
- Add: "Priority support"

### Compass card
- Remove any mention of child tracking or multi-child
- Add: "Grade dropdown — no account required for first lesson"
- Feature copy: "3 lessons · Compass Quiz · Curriculum matches · Explore star map"

### Co-op card (new)
- No price, no period label
- Headline: "Co-op"
- Subheadline or descriptor: "For homeschool groups, micro schools, and co-ops."
- Features:
  - Multiple teacher accounts
  - Shared student rosters
  - Custom lesson volume
- CTA button: "Get in touch →" (ghost/outline style, links to `/contact`)
- Visual treatment: same frost/glass card style as Compass, no dark background

### Footnote (below cards)
Keep and update to:
> All plans include all 8 teaching philosophies, the full Compass Quiz, and the interactive Explore star map. Worksheets available on Homestead and Schoolhouse plans. Cancel anytime.

---

## What Is NOT in This Plan

- Stripe billing integration (separate plan)
- Worksheet generation feature (separate plan — `2026-03-31-worksheet-generation.md`)
- Gating lessons/worksheets by plan in the app (separate, after billing)
- 2E/neurodivergent messaging additions (separate)
- Worldschooling audience row (separate)
- Annual pricing toggle wired to actual checkout

---

## Files to Change

- `web/src/app/page.tsx` — Section 8 (Pricing), lines ~645–722
- No other files. This is a pure homepage UI change.

---

## Acceptance Criteria

- [ ] Annual toggle visible above cards, annual selected by default
- [ ] Toggle switches all paid card prices correctly (monthly ↔ annual display)
- [ ] 4 cards render correctly at desktop width with no overflow
- [ ] Homestead is visually featured (dark bg, raised, "Most Popular" badge)
- [ ] Co-op card renders with contact CTA
- [ ] All removed features (coverage reports, teacher modules, unlimited annually) are gone
- [ ] Worksheets appear on Homestead (5) and Schoolhouse (15) cards
- [ ] Footnote updated
- [ ] No mention of view-only Explore anywhere on the page
