# Ship Readiness Plan — 2026-03-21

Kanban-style execution plan for the first three Trello lists:
**Things Required to Ship**, **Improve Lesson Generation**, and **Backend Work**.

Each card has prework identified so we can kick them off quickly.

---

## 🟢 DONE (completed this session)

| Card | What was done |
|------|---------------|
| Rename flexible → adaptive | Full codebase cutover, DB migration, re-seed |
| Explore map polish | Zoom labels, spacing, sparkles, Capricorn, removed pills |
| Remove debug: Glyph Lab link | Removed from ControlBar |
| Remove info panel stats pills | Removed principle/activity/material counts |

---

## 🔵 READY TO START (prework done, can begin immediately)

### 1. Remove all debug info and debug pages
**Trello list:** Things required to ship

**What exists:**
- `/archetype-debug` — archetype combination viewer
- `/matching-debug` — curriculum matching algorithm debugger
- `/personas` — persona simulator
- `/explore/glyph-lab` — glyph pack comparison (link already removed)
- `/curriculum-review` — static HTML curriculum database
- Nav menu (`web/src/components/nav.tsx`) exposes "Combo Debug", "Personas", "Matching Debug"

**Prework done:** Glyph lab link removed. All debug pages identified.

**Work needed:**
- Remove nav links to debug pages (or gate behind dev-only flag)
- Decide: delete the pages entirely, or hide behind `?debug=true` query param?
- Remove `/curriculum-review` from public access

**Estimated scope:** Small — ~1 hour

---

### 2. Tag lessons with philosophy (verify)
**Trello list:** Improve lesson generation

**What exists:**
- Lesson generation already sends `philosophy` field to kg-service
- Lesson detail page shows philosophy name + `philosophy_summary` (when not "adaptive")
- Lessons table stores `philosophy` column

**Prework done:** Verified — this already works. Philosophy is stored and displayed.

**Work needed:**
- Verify it shows correctly for all 8 philosophies (quick manual test)
- Consider showing philosophy even for "adaptive" lessons (currently hidden)

**Estimated scope:** Tiny — verification only, maybe 30 min

---

### 3. Change emoji for architect archetype
**Trello list:** Things required to ship

**What exists:** `web/src/lib/compass/archetypes.ts` defines all 8 archetypes with `icon` field.

**Current values:**
| Archetype | Current | Requested |
|-----------|---------|-----------|
| The Architect | 🔧 | Old-time hammer |
| The Guide | 🧭 | Nautical telescope |

**Work needed:**
- Change icon strings in archetypes.ts
- Architect: 🔧 → 🔨 (or find a better vintage hammer emoji)
- Guide: 🧭 → 🔭 (telescope)
- Verify they render correctly in compass results + archetype pages

**Estimated scope:** Tiny — 15 min

---

## 🟡 NEEDS DESIGN INPUT (prework identified, needs decisions before starting)

### 4. Modify questionnaire with directions screen
**Trello list:** Things required to ship

**What exists:**
- `/compass` has a basic intro: "How it works" with 3 steps, then "Take the Quiz" button
- Quiz flow: intro → 17 part1 questions → compass reveal → part2 → email gate → results

**Trello description:** "This quiz is designed to reveal your natural propensities in teaching. You will get the most accurate results by considering..."

**Work needed:**
- Replace or enhance the intro screen with the copy from the Trello card
- Add instructional framing before Part 1 questions begin
- Possibly add a brief "what to expect" step indicator

**Prework:** Current intro page is at `web/src/app/compass/page.tsx`. Flow lives in `web/src/app/compass/quiz/page.tsx`.

**Blocked on:** Final copy/wording from Trello card (partial description exists)

---

### 5. Hero front page
**Trello list:** Things required to ship

**What exists:**
- Current homepage (`web/src/app/page.tsx`): minimal — title "EduApp", tagline, "Get Started" button
- No visual design, no archetype circle, no branding

**Trello description:** "Circle of archetypes with the sages compass logo in the middle"

**Work needed:**
- Design and build hero section with archetype circle visualization
- Integrate branding (name TBD — sagescompass.com noted in Trello)
- Add feature highlights / value prop sections

**Prework:** All 8 archetypes with icons, descriptions, and philosophy profiles exist in `archetypes.ts`. Could reuse the compass/star-map visual language.

**Blocked on:** Final name/branding decision, logo asset

---

### 6. Archetype primary/secondary with philosophy pulse
**Trello list:** Things required to ship

**What exists:**
- Compass results show a single primary archetype
- Explore map already has philosophy pulse animation (PhilosophyStar.tsx)
- `scoring.ts` computes ranked archetype scores — secondary is available but not surfaced

**Work needed:**
- Surface secondary archetype in compass results
- Add dark purple / light purple visual distinction (primary vs secondary)
- Connect to explore map: pulse connected philosophies for both archetypes

**Prework:** Scoring infrastructure exists. `assignArchetype()` in `scoring.ts` returns ranked results — just need to expose top 2.

---

### 7. Lesson seed with examples
**Trello list:** Improve lesson generation

**What exists:**
- Generate page has a single text input for "interest" (placeholder: "dinosaurs, space, cooking...")
- kg-service accepts `interest` field

**Trello description:** "Growing your lessons will start with a seed. This can be an interest your student has or it can be a theme..."

**Work needed:**
- Rename "interest" to "seed" in UI with the poetic framing
- Add example seeds as clickable chips/suggestions
- Possibly add seed categories: interest, theme, standard, skill gap

**Prework:** Input field is at `web/src/app/create/page.tsx` line ~168. Simple UI change.

---

### 8. UI / UX Design System — THE DRIVER
**Trello list:** Things required to ship

This is the foundational design card that drives the look and feel of every page. Everything else builds on top of these decisions.

**Design direction from Trello:**
- **Archetype characters:** Watercolor/storybook-style illustrated person for each archetype, holding or interacting with their icon (butterfly, yarn, telescope, globe, etc.)
- **Primary archetype:** Full character illustration
- **Secondary archetype:** Just the symbol/icon alone, displayed alongside
- **Art style:** Watercolor fairytale-like, inspired by Myers-Briggs personality cards but NOT the MBTI art style
- **Backgrounds:** Same watercolor texture as the explore map page but in different pale/pastel/muted hues — each page gets a different tint
- **Skin/chrome:** Simple, mostly white with light watercolor marks in background

**What this unlocks (downstream work):**
1. **Hero front page** — archetype circle with illustrated characters
2. **Compass results** — primary character + secondary icon
3. **Lesson pages** — philosophy-tinted watercolor backgrounds
4. **Generate page** — styled inputs matching the aesthetic
5. **Dashboard** — personalized with archetype character
6. **About page** — brand-consistent design

**Work breakdown:**
1. **Design tokens & palette** — define the watercolor hue set for each page, create CSS variables
2. **Background system** — generate or source watercolor textures in multiple hues, build a reusable `<PageBackground hue="warm">` component
3. **Archetype illustrations** — 8 character illustrations (watercolor style). Options: AI-generated with manual refinement, or commission from artist
4. **Archetype icon set** — 8 symbols in watercolor style (not emoji — actual illustrated icons)
5. **Component library update** — apply design tokens to buttons, cards, inputs, nav across all pages
6. **Page-by-page rollout** — apply backgrounds + design to each route

**Prework we can do now:**
- Define the color palette / hue assignments per page
- Build the background texture component
- Audit every page and list what components need restyling
- Prototype one page (compass results is a good candidate — has archetype display)

**Blocked on:** Archetype character illustrations (need art direction or AI generation pass)

---

## 🔴 NOT STARTED (significant new features)

### 9. Include archetype in lesson generation
**Trello list:** Improve lesson generation

**What exists:**
- Lesson generation takes `philosophy` but not archetype
- Archetype data lives in sessionStorage after quiz completion
- kg-service prompt doesn't reference archetypes

**Work needed:**
- Pass archetype (primary + secondary) to lesson generation API
- Update kg-service prompt to incorporate archetype teaching style
- Show "suggested philosophies" based on archetype profile
- Update Trello card: "disregard eclectic" → now "adaptive"

**Prework:** Archetype philosophy profiles exist in `archetypes.ts`. Could auto-suggest philosophy from archetype weights.

---

### 10. Allow standards/gaps input for generation
**Trello list:** Improve lesson generation

**What exists:**
- Standards data: 363K+ standards cached in kg-service
- Standards tracker page exists (`/standards`)
- Generation prompt already includes state standards lookup

**Work needed:**
- Add optional "target standards" input to generate page
- Let parents pick specific standards or describe gaps ("she's behind on fractions")
- Pass to kg-service to bias standard selection

---

### 11. Book advising session + about page
**Trello list:** Things required to ship

**What exists:** Nothing — no about page, no booking integration.

**Work needed:**
- Create `/about` page with mission, team, philosophy
- Integrate Calendly or similar for booking advising sessions

---

### 12. Implement paid vs free tier
**Trello list:** Things required to ship

**Dependencies:** Stripe (backend card), Authentication (backend card)

**Work needed:**
- Define free vs paid feature set
- Build paywall/upgrade flow
- Integrate Stripe checkout
- Gate premium features (lesson generation limits, curriculum matching, etc.)

---

### 13. Authentication
**Trello list:** Backend work

**What exists:** Hardcoded `demo-user` everywhere. No auth system.

**Work needed:**
- Choose auth provider (NextAuth.js, Clerk, or Auth0)
- Replace all `demo-user` hardcoding with session-based user ID
- Add sign-up / login pages
- Migrate existing demo data or create onboarding flow

**Note:** This blocks paid tier, multi-user support, and data persistence.

---

### 14. Stripe payment integration
**Trello list:** Backend work

**Dependencies:** Authentication (must know who's paying)

**Work needed:**
- Set up Stripe account + API keys
- Build checkout flow for subscription
- Webhook handler for payment events
- Store subscription status in Prisma schema

---

### 15. Rate limiting
**Trello list:** Backend work

**Work needed:**
- Add rate limiting to API routes (especially lesson generation which calls GPT)
- Options: next-rate-limit, upstash/ratelimit, or custom middleware

---

### 16. Audit knowledge graph
**Trello list:** Backend work

**What exists:** 253 principles, 265 activities, 276 materials across 8 philosophies.

**Work needed:**
- Verify completeness: are all philosophies equally represented?
- Check quality: do extracted principles/activities make sense?
- Cross-reference with source PDFs
- Fill gaps if any philosophy is underrepresented

---

## Suggested Execution Order

### Phase 1 — Finish the functional canvas (get every page working, no styling)
All pages should be feature-complete before we touch design.

1. ✅ Verify lesson philosophy tagging works
2. Remove debug pages from nav (clean up for real users)
3. Archetype primary/secondary scoring — surface top 2 in results
4. Include archetype in lesson generation
5. Lesson seed UI with examples
6. Questionnaire directions/intro screen
7. Standards/gaps input for generation
8. About page + booking (functional, unstyled)
9. Hero front page (functional layout, unstyled)
10. Authentication (real users, not demo-user)
11. Stripe + paid tier
12. Rate limiting

### Phase 2 — Design system + UI/UX pass (apply styling to the finished canvas)
Once all pages are functional, apply the design in one coherent pass:

1. **Design tokens** — color palette, watercolor hue set per page, typography, spacing
2. **Background system** — watercolor textures in multiple hues, `<PageBackground>` component
3. **Archetype art** — 8 character illustrations (watercolor storybook), 8 icon illustrations
4. **Component library** — restyle buttons, cards, inputs, nav to match design language
5. **Page-by-page rollout** — apply design to each route, one at a time
6. **Polish** — transitions, micro-interactions, responsive, accessibility

### Phase 3 — QA + launch
1. KG audit for completeness
2. End-to-end testing with real user flows
3. Performance pass
4. Domain + deploy
