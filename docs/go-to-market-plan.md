# Go-To-Market Plan & Content Strategy

*Based on current app state + Trello remaining work + competitive/marketing analysis*

---

## Table of Contents

1. [Launch Readiness Assessment](#1-launch-readiness-assessment)
2. [Phased Launch Strategy](#2-phased-launch-strategy)
3. [Phase 0: Pre-Launch Content Machine](#3-phase-0-pre-launch-content-machine)
4. [Phase 1: Soft Launch — The Compass Quiz](#4-phase-1-soft-launch--the-compass-quiz)
5. [Phase 2: Beta Launch — Free Generation](#5-phase-2-beta-launch--free-generation)
6. [Phase 3: Full Launch — Paid Tiers](#6-phase-3-full-launch--paid-tiers)
7. [Content Strategy Calendar](#7-content-strategy-calendar)
8. [Launch Week Playbook](#8-launch-week-playbook)
9. [Post-Launch Growth Loops](#9-post-launch-growth-loops)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Launch Readiness Assessment

### What's Built & Production-Ready

| Feature | Status | Launch Readiness |
|---------|--------|-----------------|
| Compass Quiz (Part 1 + Part 2) | Complete | Ready — needs minor instruction copy tweaks |
| 8 Teaching Archetypes | Complete | Ready |
| Archetype results + philosophy blend | Complete | Ready |
| 56 combo text descriptions | Complete | Ready |
| Curriculum matching (100+ curricula) | Complete | Ready |
| Lesson generation (KG-backed) | Complete | Ready — needs seed examples + archetype wiring |
| Explore star map | Complete | Ready — polish items on Trello |
| Standards alignment (50 states, 363K+) | Complete | Ready |
| Multi-child differentiation | Complete | Ready |
| Calendar & scheduling | Complete | Ready |
| Standards progress tracking | Complete | Ready |
| Print-ready lesson output | Complete | Ready |
| Knowledge graph (philosophies, principles, activities, materials) | Complete | Needs audit per Trello |

### What Must Be Built Before Launch

| Feature | Effort Estimate | Blocks |
|---------|----------------|--------|
| **Authentication (NextAuth)** | Medium (3-5 days) | Blocks everything — can't have users without login |
| **Stripe payment integration** | Medium (3-5 days) | Blocks paid tier |
| **Free/paid tier gating** | Medium (2-3 days) | Blocks monetization |
| **Rate limiting** | Small (1 day) | Blocks public launch (API abuse risk) |
| **Hero landing page** | Medium (2-3 days) | Blocks first impression |
| **About page (founder story)** | Small (1 day) | Blocks trust-building |
| **Remove debug pages** | Small (< 1 day) | Blocks professional appearance |

### What Can Ship After Launch (Enhancement)

| Feature | Priority | Why It Can Wait |
|---------|----------|----------------|
| Wire archetype → lesson generation | High | Generation works fine with philosophy selection; archetype pre-fill is UX improvement |
| Lesson seed examples | Medium | Current text input works; examples are guidance, not functionality |
| Standards gap input | Medium | New feature, not broken existing feature |
| Philosophy tags on lessons | Low | Likely already partially working (philosophy is selected at generation time) |
| Archetype pulse on star map | Low | Visual polish |
| Architect emoji change | Low | Cosmetic |
| Questionnaire instruction refinement | Low | Quiz already works end-to-end |

---

## 2. Phased Launch Strategy

Instead of one big launch, we execute a **4-phase rollout** where each phase builds audience, tests systems, and creates momentum for the next:

```
PHASE 0          PHASE 1           PHASE 2             PHASE 3
Pre-Launch        Soft Launch        Beta Launch          Full Launch
Content Machine   Compass Quiz       Free Generation      Paid Tiers
───────────────┼──────────────────┼────────────────────┼─────────────────
Weeks 1-4       Weeks 5-8          Weeks 9-14           Week 15+

Build audience   Collect emails     Collect users        Collect revenue
Establish voice  Prove the quiz     Prove the product    Prove the business
$0 spend         $0 spend           $0-500/mo ads        $1-3K/mo ads
```

### Why Phased?

1. **The Compass Quiz is already production-ready.** We can launch it as a standalone tool *before* auth/payments are built, collecting emails and building audience while the founder finishes backend work.
2. **The homeschool buying cycle is seasonal.** Families plan curriculum in March-June for fall start. If we're targeting Fall 2026 enrollment, we need to be visible by May-June.
3. **Facebook group trust takes time.** Starting now with organic content means we have 2-3 months of credibility before asking anyone to pay.
4. **The founder needs content runway.** Podcast bookings take 4-8 weeks lead time. Conference speaking proposals are due months in advance.

---

## 3. Phase 0: Pre-Launch Content Machine (Weeks 1-4)

**Goal:** Establish the founder's voice, build an email list of 500+, and create a content library before any product is public.

### No Code Required — Just Content

This phase requires ZERO engineering work. The founder can execute this while the dev work continues in parallel.

### Week 1: Foundation

| Action | Details | Time |
|--------|---------|------|
| **Finalize brand name** | Decision from shortlist (Trellis, Kindling, etc.) + buy domain | 1 day |
| **Set up social accounts** | Instagram, Pinterest, TikTok, YouTube channel under new brand name | 1 hour |
| **Create "Coming Soon" landing page** | Simple page: founder photo + one-paragraph story + email signup + "Quiz coming soon" | 2 hours (can use Carrd, Typedream, or simple Next.js page) |
| **Write the founder's story** | 500-word version for website, 150-word version for social bios | 2 hours |
| **Set up email tool** | ConvertKit, Mailchimp, or Resend — free tier is fine | 1 hour |

### Week 2: Content Creation Sprint

| Action | Details |
|--------|---------|
| **Write 2 philosophy articles** | Start with the 2 philosophies that map to largest Facebook groups: Place/Nature-Based (Wildschooling: 91K) and Montessori (42K). 2,000+ words each, SEO-optimized. |
| **Create 8 archetype social cards** | One Instagram/Pinterest graphic per archetype with name, icon, 2-line description. These become the shareable assets. |
| **Record founder intro video** | 60-90 second video: "Hi, I'm [Name]. I've been an educator for 14 years..." for Instagram Reels + TikTok |
| **Create Pinterest boards** | 8 philosophy boards + "Homeschool Planning" + "Standards Made Simple" |

### Week 3: Community Entry

| Action | Details |
|--------|---------|
| **Join 15 Facebook groups** | See priority list from Facebook Groups analysis (Wildschooling, SEA, Montessori, Beginners, etc.) |
| **Start engaging authentically** | Answer 2-3 questions per day in groups. NO product mentions. Just be helpful. |
| **Post first Instagram content** | Archetype cards, philosophy tips, founder story snippets |
| **Pin first Pinterest content** | Philosophy articles, archetype graphics, "coming soon" quiz teasers |
| **Submit to 3 podcasts** | Send pitch emails to homeschool podcasts (see podcast list from brand strategy doc) |

### Week 4: Email List Building

| Action | Details |
|--------|---------|
| **Create lead magnet** | "Which Homeschool Philosophy Fits Your Family? A Guide to 8 Approaches" — free PDF download, requires email |
| **Share lead magnet in groups** | When someone asks about philosophies (they always do), offer the free guide |
| **Launch Instagram Stories series** | "Philosophy of the Day" — one philosophy per day for 8 days, ending with "full quiz coming soon" |
| **Write 2 more philosophy articles** | Charlotte Mason + Classical (maps to Morning Baskets 35K + Classical Conversations 57K groups) |

### Phase 0 Targets

| Metric | Target |
|--------|--------|
| Email list | 500+ subscribers |
| Instagram followers | 200+ |
| Pinterest impressions | 5,000+ |
| Facebook group presence | Active in 15 groups |
| Philosophy articles published | 4 |
| Podcast recordings scheduled | 2-3 |

---

## 4. Phase 1: Soft Launch — The Compass Quiz (Weeks 5-8)

**Goal:** Launch the Compass Quiz as a standalone free tool. Collect 2,000+ quiz completions and 1,000+ emails. Validate the archetype framework with real users.

### What Ships

The Compass Quiz is already built. We deploy it as a standalone experience:

**URL:** `quiz.[domain].com` or `[domain].com/compass`

**Flow:**
```
Landing Page → Start Quiz → 18 Questions → Archetype Reveal →
"Want your full results + curriculum matches?" → Email Gate →
Full Results Page (archetype + dimensions + philosophy blend + top 3 curriculum matches)
```

### Engineering Work Required

| Task | Effort | Notes |
|------|--------|-------|
| Deploy quiz to production domain | 1 day | Can be standalone — doesn't need auth/payments |
| Add email capture gate before full results | 1 day | Simple email input → store in DB or email tool |
| Add social sharing for archetype result | 1 day | "I'm The Cultivator!" shareable card with link back to quiz |
| Add UTM tracking | 0.5 day | Track which channels drive quiz completions |
| Basic analytics (quiz starts, completions, emails) | 0.5 day | Simple event tracking |

**Total new engineering: ~4 days.** The quiz itself is done.

### Marketing Push

| Action | Channel | Details |
|--------|---------|---------|
| **Announce quiz launch** | Email list | "The quiz I've been building for months is live" |
| **Share in Facebook groups** | Organic | When someone asks "what philosophy should I use?" → share quiz link |
| **Instagram launch series** | Instagram | 8-post series: one archetype per day → "Which one are you? Take the quiz" |
| **Pinterest quiz pin** | Pinterest | "Discover Your Homeschool Teaching Style — Free 5-Minute Quiz" |
| **First podcast airs** | Podcast | Founder talks about archetypes, mentions quiz |
| **Blog post** | SEO | "The 8 Homeschool Teaching Archetypes: Which One Are You?" |
| **TikTok series** | TikTok | "I'm a [Archetype] and here's what that means for my homeschool" × 8 |

### The Viral Loop

The Compass Quiz has natural virality built in:

```
Parent takes quiz → Gets archetype → Shares "I'm The Cultivator!" on Instagram/Facebook
→ Friend sees it → "What's MY archetype?" → Takes quiz → Shares → ...
```

**Amplify this loop:**
- Make the shareable result card beautiful (archetype name + icon + one-line description + quiz URL)
- Add "Share Your Result" buttons (Instagram Stories, Facebook, Pinterest, copy link)
- Create a "Quiz your spouse!" prompt on the results page
- Encourage "tag a homeschool friend" in social posts

### Phase 1 Targets

| Metric | Target |
|--------|--------|
| Quiz starts | 3,000+ |
| Quiz completions (70% of starts) | 2,100+ |
| Email captures (50% of completions) | 1,050+ |
| Social shares | 200+ |
| Total email list | 1,500+ (Phase 0 list + quiz captures) |
| Instagram followers | 500+ |

---

## 5. Phase 2: Beta Launch — Free Generation (Weeks 9-14)

**Goal:** Open the full app to free users (with limits). Collect 1,000+ registered users. Get 50+ lesson generation data points. Gather testimonials.

### What Ships

This is where the engineering heavy lift happens:

| Task | Effort | Priority |
|------|--------|----------|
| **Authentication (NextAuth)** | 3-5 days | CRITICAL — must ship |
| **Remove debug pages** | 0.5 day | Must ship |
| **Hero landing page redesign** | 2-3 days | Must ship (founder story, features, CTA) |
| **About page** | 1 day | Must ship (founder credentials, story, booking link) |
| **Rate limiting on API routes** | 1 day | Must ship (prevent abuse) |
| **Free tier limits** | 1-2 days | Implement: 3 lessons/month, 1 child, basic features |
| **Wire archetype → generation default** | 1 day | High priority enhancement |
| **Lesson seed examples** | 0.5 day | Nice-to-have for this phase |
| **Questionnaire instruction refinement** | 0.5 day | Nice-to-have |
| **KG audit** | 2-3 days | Can run in parallel |

**Total engineering: ~15-20 days.**

### The Free Tier Experience

What free users get:
- Full Compass Quiz + archetype + curriculum matching (top 3 per subject)
- 3 lesson generations per month
- 1 child profile
- All 8 philosophies (for quiz), 2 for generation (adaptive + their top philosophy)
- Standards preview (not full tracking)
- View-only Explore star map
- Watermarked print output

What they see when they hit the limit:
> "You've used 3 of 3 free lessons this month. [Founder Name] designed this to give you a real taste of custom curriculum. Ready for unlimited? Plans start at $14.99/month."

### Beta Marketing

| Action | Details |
|--------|---------|
| **Email blast to full list** | "The app is live. Generate your first custom lesson in 2 minutes." |
| **Facebook group organic** | Start naturally recommending the tool when parents ask curriculum questions (now with real product to link to) |
| **Blog posts** | "How I Generate a Week of Montessori Math Lessons in 10 Minutes" (walkthrough post) |
| **YouTube video** | Founder does a live lesson generation demo — "Watch me plan a week of nature-based science" |
| **Collect testimonials** | Email beta users at day 7 and day 14 asking for feedback. Offer free month of paid tier for a testimonial. |
| **Advisory Circle feedback** | Weekly 15-min calls with 5-10 power users |

### Phase 2 Targets

| Metric | Target |
|--------|--------|
| Registered users | 1,000+ |
| Lessons generated | 500+ |
| Active weekly users | 200+ |
| Testimonials collected | 15-20 |
| Email list | 3,000+ |
| Instagram followers | 1,000+ |
| NPS score | 40+ (good for early product) |

---

## 6. Phase 3: Full Launch — Paid Tiers (Week 15+)

**Goal:** Turn on payments. Convert 15-20% of active free users to paid. Hit $5,000 MRR within 60 days of payment launch.

### What Ships

| Task | Effort | Priority |
|------|--------|----------|
| **Stripe integration** | 3-5 days | CRITICAL |
| **Pricing page** | 1-2 days | CRITICAL |
| **Paid tier feature unlocks** | 2-3 days | CRITICAL (gate: lesson count, children, standards tracking, print) |
| **Annual plan option** | 1 day | Include at launch (17% discount) |
| **Upgrade prompts in-app** | 1 day | When hitting free limits, show upgrade CTA |
| **Payment confirmation + onboarding email** | 1 day | Welcome to paid, here's what's unlocked |
| **Standards gap input** | 2-3 days | Enhancement for paid tier |
| **Include archetype in generation** | 1 day | Enhancement for paid tier |

### Pricing (Finalized)

| | Compass (Free) | Hearth ($14.99/mo) | Homestead ($24.99/mo) |
|---|---|---|---|
| Annual | $0 | $149/year | $249/year |
| Lessons/month | 3 | 30 | Unlimited |
| Children | 1 | 4 | 6 |
| Standards tracking | Preview | Full | Full + reports |
| Print output | Watermarked | Full | Full |
| Explore map | View-only | Interactive | Interactive |
| Multi-child lessons | No | Yes | Yes |
| Community | Public | Private group | Private + founder AMAs |

### Launch Marketing Blitz

**Week 15 (Launch Week):**

| Day | Action | Channel |
|-----|--------|---------|
| **Monday** | Teaser: "Something big is coming this week" | Instagram Stories, email |
| **Tuesday** | Founder video: "After 14 years of teaching, I'm launching the tool I wished I had" | YouTube, Instagram Reels, TikTok |
| **Wednesday** | **LAUNCH DAY** — Email blast + social posts + blog post | All channels |
| **Thursday** | "First 100 annual subscribers get a free 30-minute planning session with me" | Email + Facebook Group |
| **Friday** | User testimonial roundup: "Here's what beta families are saying" | Instagram carousel + email |
| **Weekend** | Founder goes live in Facebook Group: "Ask me anything about the launch" | Facebook Live |

**Weeks 16-18 (Post-Launch):**

| Action | Details |
|--------|---------|
| **Start Pinterest Ads** | $750/month promoting quiz + free tier |
| **Start Facebook Ads** | $1,000/month: video testimonial ads → quiz → free signup → paid conversion |
| **Launch affiliate program** | 25% recurring commission, recruit 10 bloggers in first month |
| **Comparison blog posts** | "[Product Name] vs. Time4Learning" + "[Product Name] vs. Easy Peasy" |
| **Podcast appearances** | First episodes airing (booked in Phase 0-1) |

### Conversion Strategy: Free → Paid

The free tier is designed to create **desire for more**, not frustration:

| Trigger | What Happens | Goal |
|---------|-------------|------|
| **3rd lesson generated** | "You've used all 3 free lessons. Here's what your 4th could look like..." (show preview) | Create FOMO |
| **Try to add 2nd child** | "Multi-child lessons are a Hearth feature. See how it works →" (show example) | Show the value |
| **View standards tracking** | "You've covered 12 standards this month! Track your full progress →" | Show what they're missing |
| **Try to print** | Watermark + "Get clean prints with Hearth →" | Practical friction |
| **Day 7 email** | "You generated 2 lessons this week. Here's what families do with unlimited..." | Social proof |
| **Day 14 email** | Founder personal email: "I noticed you're a Cultivator like me. Here's why I built this..." | Personal connection |
| **Day 21 email** | Testimonial from a similar archetype: "[Parent] went from 3hrs/week planning to 20 min" | Proof |
| **Day 28 email** | "Your free lessons reset tomorrow — or unlock unlimited for $12.42/month (annual)" | Urgency + best price |

### Phase 3 Targets (First 60 Days)

| Metric | Target |
|--------|--------|
| Paid subscribers | 200+ |
| Monthly recurring revenue | $3,000-$5,000 |
| Free → paid conversion rate | 15-20% |
| Annual plan adoption | 40%+ |
| Monthly churn | <7% |
| Active weekly paid users | 150+ |
| Affiliate partners | 10+ |
| Email list | 5,000+ |

---

## 7. Content Strategy Calendar

### Pre-Launch Through Launch (16-Week Calendar)

#### Weeks 1-4 (Phase 0: Content Machine)

| Week | Blog | Social | Email | Community |
|------|------|--------|-------|-----------|
| 1 | Set up blog | Founder intro video | Set up email tool | Join 15 Facebook groups |
| 2 | Nature-Based Education Guide | 8 archetype cards (1/day) | Welcome sequence draft | Start engaging in groups |
| 3 | Montessori Homeschooling Guide | Philosophy tip series | Lead magnet: "8 Philosophies Guide" PDF | Share lead magnet when relevant |
| 4 | Charlotte Mason Guide + Classical Guide | "Quiz coming soon" teasers | Nurture: philosophy deep-dives | Build relationships with admins |

#### Weeks 5-8 (Phase 1: Quiz Launch)

| Week | Blog | Social | Email | Community |
|------|------|--------|-------|-----------|
| 5 | "The 8 Teaching Archetypes" | **QUIZ LAUNCH** — archetype reveal series | Quiz announcement blast | Share quiz when philosophy questions arise |
| 6 | "What Your Archetype Means" | User archetype results (reshare with permission) | "Did you take the quiz? Here's what your result means" | Engage with quiz-takers in groups |
| 7 | Unschooling Guide + PBL Guide | "Quiz your spouse!" campaign | Archetype-specific nurture emails | |
| 8 | Waldorf Guide + Adaptive Guide | Milestone: "1,000 quiz completions!" | "The app is almost ready..." teaser | |

#### Weeks 9-14 (Phase 2: Beta)

| Week | Blog | Social | Email | Community |
|------|------|--------|-------|-----------|
| 9 | **"The App Is Live"** announcement | **BETA LAUNCH** — lesson generation demo | Beta launch email blast | Share in owned group |
| 10 | "How I Plan a Week in 10 Minutes" walkthrough | Lesson spotlight series begins | Day-3 onboarding: "Generate your first lesson" | |
| 11 | First state standards page (Michigan) | User-generated content (lesson photos) | Day-7: "How's it going?" feedback request | Collect testimonials |
| 12 | 5 more state pages | Testimonial carousel | Day-14: "You've generated X lessons" progress | |
| 13 | "[Product] vs. Time4Learning" comparison | Behind-the-scenes: founder building the product | "Paid tier coming soon" teaser | |
| 14 | "[Product] vs. Easy Peasy" comparison | "What would unlimited look like for your family?" | "One more week until full launch" | |

#### Weeks 15-16 (Phase 3: Full Launch)

| Week | Blog | Social | Email | Community |
|------|------|--------|-------|-----------|
| 15 | **FULL LAUNCH** announcement | Launch week content blitz (see Launch Week Playbook) | Launch email sequence (Mon-Fri) | Facebook Live AMA |
| 16 | "What 50 Families Learned in Their First Month" | First paid-user testimonials | Post-launch: conversion nudge for free users | |

### Ongoing Content Pillars (Post-Launch)

| Pillar | Frequency | Format | Purpose |
|--------|-----------|--------|---------|
| **Philosophy Deep Dives** | 1/week | Blog + social | SEO + authority |
| **Lesson Spotlights** | 2/week | Instagram + Pinterest | Show product magic |
| **Founder's Journal** | 1/week | Email newsletter | Personal connection |
| **State Standards Guides** | 2/month | Blog (SEO) | Long-tail search traffic |
| **Comparison Content** | 2/month | Blog (SEO) | Capture high-intent searchers |
| **User Stories** | 1/week | Social + email | Social proof |
| **"14 Years, 14 Lessons" Series** | 1/month | Blog + YouTube + social | Founder narrative authority |

---

## 8. Launch Week Playbook

### Full Launch Week (Week 15) — Hour by Hour

#### Monday: Teaser Day
- **9 AM:** Instagram Story: "This week changes everything for my family — and maybe yours"
- **12 PM:** Email to list: "I've been building something for 14 years. It launches Wednesday."
- **3 PM:** TikTok: 15-second teaser clip of founder with product on screen
- **Evening:** Post in owned Facebook Group: "Big announcement coming Wednesday..."

#### Tuesday: Story Day
- **9 AM:** YouTube premiere: "Why I Built This — A 14-Year Journey" (3-5 min founder video)
- **12 PM:** Instagram carousel: "From kitchen table → micro school → co-op → this" (founder journey photos)
- **3 PM:** Email: "Tomorrow is the day. Here's what I built and why."
- **Evening:** Instagram Live Q&A: "Ask me anything before tomorrow's launch"

#### Wednesday: LAUNCH DAY
- **7 AM:** Email blast to full list: "It's here. [Product Name] is live. Plans start at $14.99/month."
- **8 AM:** Instagram + Facebook + TikTok: Launch announcement with product demo video
- **9 AM:** Pinterest: Launch pin + 10 new lesson preview pins
- **10 AM:** Blog post: "Introducing [Product Name]: Custom Curriculum for How Your Family Learns"
- **12 PM:** Facebook Group: Founder post with full story + product demo
- **All day:** Monitor, respond to comments, share user excitement
- **Evening:** Instagram Stories: Real-time signup counter + "thank you" messages

#### Thursday: Social Proof Day
- **9 AM:** Instagram carousel: "Here's what beta families are saying" (5 testimonials)
- **12 PM:** Email: "First 100 annual subscribers get a free 30-min planning session with me"
- **3 PM:** TikTok: Quick lesson generation demo — "dinosaurs → full lesson in 2 minutes"
- **Evening:** Share individual testimonials as Instagram Stories

#### Friday: Community Day
- **10 AM:** Facebook Group Live: "Launch Week AMA — ask me anything about [Product Name]"
- **12 PM:** Email: "Week 1 recap — X families joined, X lessons generated, here's what's next"
- **3 PM:** Instagram: "Thank you" post from founder + weekend planning tips
- **Evening:** Founder personally responds to every comment/DM from the week

#### Weekend: Organic Momentum
- Share lesson examples across social media
- Respond to all questions in Facebook groups
- Repin popular Pinterest content
- Repost user-generated content (archetype results, lesson photos)

---

## 9. Post-Launch Growth Loops

### Loop 1: Quiz → Share → Quiz (Viral)
```
Parent takes Compass Quiz → Gets archetype → Shares on social media →
Friend sees → Takes quiz → Shares → ...
```
**Amplifier:** Beautiful shareable archetype result cards

### Loop 2: Content → Google → Quiz → Signup (SEO)
```
Parent searches "montessori homeschool curriculum" → Finds our blog article →
Reads value → Clicks "Take the Quiz" CTA at bottom → Signs up
```
**Amplifier:** 8 philosophy articles + 50 state pages + comparison content

### Loop 3: Group Question → Recommendation → Signup (Community)
```
Parent asks "what should I use for 3rd grade math?" in Facebook group →
Existing user recommends us → New parent tries quiz → Signs up
```
**Amplifier:** Growing base of happy users who advocate naturally

### Loop 4: Podcast → Authority → Search → Signup (Founder-Led)
```
Founder appears on homeschool podcast → Listener searches product name →
Finds website → Takes quiz → Signs up
```
**Amplifier:** 2 podcasts/month, founder's personal brand grows

### Loop 5: Free User → Hits Limit → Upgrades (Conversion)
```
Free user generates 3 lessons → Loves them → Hits monthly limit →
Sees upgrade prompt → Converts to paid
```
**Amplifier:** 28-day email nurture sequence, in-app upgrade prompts

### Loop 6: Paid User → Affiliate → New User (Referral)
```
Paid user loves product → Joins affiliate program → Shares unique link →
Friend signs up → Affiliate earns 25% → Motivated to share more
```
**Amplifier:** Affiliate dashboard, referral bonuses, "give a month, get a month" program

---

## 10. Risk Mitigation

### Risk: "It's just ChatGPT with a wrapper"

**Mitigation:** The founder's credentials are the answer. Every piece of marketing emphasizes:
- 253 principles extracted from 29 foundational texts (not a generic prompt)
- 363K+ state standards integrated (not "tell ChatGPT your state")
- Knowledge graph architecture (not prompt engineering)
- 14 years of teaching methodology (not a weekend hackathon)

**Specific tactic:** Create a "How We're Different from ChatGPT" blog post and FAQ answer. Show a side-by-side: same topic in ChatGPT vs. our app. The depth difference is immediately visible.

### Risk: Slow initial adoption

**Mitigation:** The Compass Quiz is the wedge. It provides value with ZERO purchase commitment. Even if no one pays for 3 months, we're building an email list of qualified leads who've told us their philosophy, archetype, state, grade levels, and preferences. That data is gold for targeted marketing later.

### Risk: High churn after first month

**Mitigation:**
- Push annual plans aggressively (17% discount, "plan your curriculum year")
- Founder's personal onboarding emails (not automated SaaS drip)
- Community (Facebook Group) creates social switching cost
- Standards tracking creates data switching cost (leave = lose your progress records)
- New lesson content keeps product fresh (not a static curriculum)

### Risk: MagicSchool AI adds homeschool features

**Mitigation:** MagicSchool has 80+ tools but zero philosophy depth. Our moat isn't "AI generates lessons" — it's the knowledge graph, the compass quiz, the founder's methodology, and the community. Even if they add a "homeschool mode," they can't replicate 29 PDFs worth of extracted philosophy principles or a psychometric archetype instrument overnight.

### Risk: Founder burnout (she's doing everything)

**Mitigation:**
- Phase 0-1 content can be batched (write 4 articles in one weekend, schedule for a month)
- Social media can be scheduled (Buffer, Later, or Tailwind for Pinterest)
- Podcast appearances are 30-60 min recordings, then passive distribution
- By Phase 3, revenue should justify hiring a part-time community manager
- The Advisory Circle provides free product feedback, reducing founder's solo burden
- AI tools (this one included) handle research, writing drafts, and analysis

---

## Engineering Priority Order (Critical Path to Revenue)

If the founder is also the developer (or has limited dev resources), here's the strict priority order:

### Sprint 1 (Weeks 1-4): Ship the Quiz Standalone
1. Deploy quiz to production domain (1 day)
2. Add email capture gate (1 day)
3. Add social sharing cards (1 day)
4. Add UTM tracking + basic analytics (0.5 day)
5. Remove debug pages from production build (0.5 day)

**Result:** Quiz is live, collecting emails. Founder focuses on content.

### Sprint 2 (Weeks 5-8): Build the User Layer
1. Implement NextAuth (Google + email login) (3-5 days)
2. Migrate demo-user logic to real user accounts (2 days)
3. Rate limiting on API routes (1 day)
4. Hero landing page with founder story (2-3 days)
5. About page (1 day)

**Result:** Real users can sign up. App is behind auth. Ready for beta.

### Sprint 3 (Weeks 9-12): Build the Money Layer
1. Stripe integration (subscription billing) (3-5 days)
2. Pricing page (1-2 days)
3. Free tier limits (lesson count, child count) (2-3 days)
4. Upgrade prompts and flows (1-2 days)
5. Wire compass archetype → lesson generation default (1 day)

**Result:** Paid tiers are live. Revenue starts flowing.

### Sprint 4 (Weeks 13+): Polish & Enhance
1. Lesson seed examples on generation page
2. Standards gap input feature
3. Archetype pulse on Explore map
4. Philosophy tags on saved lessons
5. Questionnaire instruction refinement
6. Knowledge graph audit

**Result:** Product quality improves. Retention increases.

---

## Timeline Summary

| Week | Phase | Engineering | Marketing | Milestone |
|------|-------|-------------|-----------|-----------|
| 1-4 | Phase 0 | Quiz deployment + email gate | Content creation, Facebook groups, lead magnet | 500 emails |
| 5-8 | Phase 1 | Auth + landing page + rate limiting | Quiz launch, social push, podcast bookings | 2,000 quiz completions |
| 9-14 | Phase 2 | Stripe + pricing + tier gating | Beta launch, testimonials, comparison content | 1,000 registered users |
| 15+ | Phase 3 | Polish + enhancements | Full launch, ads begin, affiliate program | First paying customers → $5K MRR |

---

*The founder's 14 years of experience isn't just marketing copy — it's the product itself, the content strategy, the community trust, and the competitive moat. Everything in this plan leverages that.*
