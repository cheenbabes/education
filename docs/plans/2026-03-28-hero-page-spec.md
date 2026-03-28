# Hero Page Layout Spec — The Sage's Compass

*Prepared: 2026-03-28*

---

## Table of Contents

1. [Design System Reference](#1-design-system-reference)
2. [Page Architecture Overview](#2-page-architecture-overview)
3. [Section-by-Section Breakdown](#3-section-by-section-breakdown)
   - [Section 1: Hero](#section-1-hero)
   - [Section 2: Trust / Stats Bar](#section-2-trust--stats-bar)
   - [Section 3: The 8 Archetypes Showcase](#section-3-the-8-archetypes-showcase)
   - [Section 4: Three-Step How It Works](#section-4-three-step-how-it-works)
   - [Section 5: Feature Deep Dive](#section-5-feature-deep-dive)
   - [Section 6: Social Proof](#section-6-social-proof)
   - [Section 7: Founder Section](#section-7-founder-section)
   - [Section 8: Pricing Preview](#section-8-pricing-preview)
   - [Section 9: Final CTA](#section-9-final-cta)
   - [Section 10: Footer](#section-10-footer)
4. [Copy Recommendations](#4-copy-recommendations)
5. [Archetype Visual Treatment](#5-archetype-visual-treatment)
6. [Implicit Competitor Positioning](#6-implicit-competitor-positioning)
7. [Three-Layer Value Prop](#7-three-layer-value-prop)
8. [Implementation Notes](#8-implementation-notes)

---

## 1. Design System Reference

All tokens are drawn from `/web/public/brand-guide.html`.

### Core Colors

| Token | Value | Use |
|---|---|---|
| `--parchment` | `#F9F6EF` | Page background |
| `--ink` | `#1B1A17` | Primary text, primary button background |
| `--accent-primary` | `#6E6E9E` | Muted indigo — CTA buttons (accent variant), links, progress |
| `--accent-secondary` | `#7A9E8A` | Soft sage — success states, tips, nature motifs |
| `--accent-tertiary` | `#9B7E8E` | Warm mauve — badges, decorative, philosophy chips |
| `--surface-card` | `rgba(255,255,255,0.7)` | Frosted glass card surface |
| `--border-default` | `rgba(0,0,0,0.08)` | Default card border |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)` | Card elevation |

### Archetype Colors

| Archetype | Token | Value |
|---|---|---|
| The Guide | `--arch-guide` | `#5B5E8A` |
| The Explorer | `--arch-explorer` | `#5A947A` |
| The Cultivator | `--arch-cultivator` | `#7D6B9E` |
| The Naturalist | `--arch-naturalist` | `#6BA07A` |
| The Storyteller | `--arch-storyteller` | `#B07A8A` |
| The Architect | `--arch-architect` | `#5A7FA0` |
| The Free Spirit | `--arch-freespirit` | `#C07A42` |
| The Weaver | `--arch-weaver` | `#8A8A7E` |

### Typography

| Role | Font | Spec |
|---|---|---|
| Page headline (H1) | Cormorant SC | 700 weight, `letter-spacing: 0.08em` |
| Section headline (H2) | Cormorant SC | 600 weight, `letter-spacing: 0.06em` |
| Section label / eyebrow | Inter | 600 weight, 0.85rem, uppercase, `letter-spacing: 0.12em`, color `#5B5E8A` |
| Body | Inter | 400 weight, 0.95rem, color `#4A4A4A` |
| Lead / subheadline | Cormorant (italic) | 1.25rem, italic, color `#5A5A5A` |

### Watercolor Background System (Home Page)

Use `class="watercolor-bg hue-home"` on the page root. This renders:
- Layer 1: Grayscale paint-stroke texture at 28% opacity (multiply blend)
- Layer 2: Radial lavender mist washes — `rgba(160,145,190,0.28)` at top-left, `rgba(145,155,185,0.20)` at bottom-right

For the hero section specifically, the background should shift to a slightly richer wash. A light inline radial-gradient override on the hero container adds depth without competing with the full-page texture.

### Frosted Glass Cards ("Medium Frost B2")

```css
background: rgba(255, 255, 255, 0.70);
backdrop-filter: blur(12px) saturate(1.4);
-webkit-backdrop-filter: blur(12px) saturate(1.4);
border: 1px solid rgba(255, 255, 255, 0.55);
border-radius: 20px;
box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04);
```

---

## 2. Page Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  NAV BAR                                                │
├─────────────────────────────────────────────────────────┤
│  SECTION 1: HERO                            ~100vh      │
│  Headline + subhead + dual CTA + archetype preview ring │
├─────────────────────────────────────────────────────────┤
│  SECTION 2: TRUST / STATS BAR               ~80px       │
│  3 credential stats inline                              │
├─────────────────────────────────────────────────────────┤
│  SECTION 3: 8 ARCHETYPES SHOWCASE           ~600px      │
│  "Which of these is you?" — scrolling horizontal row    │
│  + "Take the quiz" CTA                                  │
├─────────────────────────────────────────────────────────┤
│  SECTION 4: HOW IT WORKS                    ~500px      │
│  3-step horizontal flow with embedded UI preview        │
├─────────────────────────────────────────────────────────┤
│  SECTION 5: FEATURE DEEP DIVE               ~700px      │
│  3 feature rows (alternating text/visual)               │
├─────────────────────────────────────────────────────────┤
│  SECTION 6: SOCIAL PROOF                    ~400px      │
│  3 testimonials + founder quote                         │
├─────────────────────────────────────────────────────────┤
│  SECTION 7: FOUNDER                         ~500px      │
│  Photo + credentials + "why I built this" quote         │
├─────────────────────────────────────────────────────────┤
│  SECTION 8: PRICING PREVIEW                 ~400px      │
│  3-tier card stack, "start free" emphasized             │
├─────────────────────────────────────────────────────────┤
│  SECTION 9: FINAL CTA                       ~280px      │
│  Full-width warm banner + "Take the Compass Quiz" CTA   │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                     ~200px      │
└─────────────────────────────────────────────────────────┘
```

Total estimated page height: ~4,500px. Aim for 8-9 meaningful sections (not 14 like LearnSpark). Every section must earn its place.

---

## 3. Section-by-Section Breakdown

---

### Section 1: Hero

**Purpose:** Communicate the 5-second hook, create immediate emotional resonance, funnel into the primary CTA.

**Layout:** Two-column on desktop, stacked on mobile.

```
┌─────────────────────────────────────────────────────────┐
│  [Left 55%]                   [Right 45%]               │
│                                                         │
│  Eyebrow label                 ┌─────────────────┐      │
│  "Your Teaching Archetype      │  Archetype ring │      │
│   — Discovered in 5 Minutes"   │  (8 watercolor  │      │
│                                │   characters    │      │
│  H1 Headline                   │   in circular   │      │
│  Subheadline (italic)          │   arrangement)  │      │
│                                └─────────────────┘      │
│  [Primary CTA button]                                   │
│  [Secondary link]                                       │
│                                                         │
│  Trust signal row (3 micro-badges, inline)              │
└─────────────────────────────────────────────────────────┘
```

**Background:** `watercolor-bg hue-home` on page wrapper. Hero section itself uses `background: var(--parchment)` with a subtle hand-painted edge element (the watercolor bleed from the page wrapper shows through at section boundary).

**Left Column — Copy**

Eyebrow (Inter, uppercase, `#5B5E8A`):
> Designed by a Master Educator. Built for Your Family.

H1 (Cormorant SC, 700, ~56px desktop / 38px mobile):
> Every family teaches differently. Now your lessons can too.

Subheadline (Cormorant italic, 1.35rem, `#5A5A5A`):
> Discover your teaching archetype. Generate custom, standards-aligned lesson plans for any philosophy — Montessori, Charlotte Mason, Classical, and more — in two minutes.

Primary CTA button (full-width on mobile, auto-width on desktop):
- Label: **Take the Compass Quiz** — It's Free
- Style: `--ink` background (`#1B1A17`), `--parchment` text, 12px border-radius, Inter 500, 1rem
- Sub-text below button (Inter, 0.78rem, `--text-tertiary`): "No credit card required · 5 minutes · Discover your archetype"

Secondary link (text-only, underlined):
- Label: See how it works →
- Scrolls down to Section 4

Trust micro-badges (inline row, gap 1.5rem, Inter 500, 0.8rem, icon + text):
- Compass icon: "14 Years of Teaching Experience"
- Mortarboard icon: "Master's in Education"
- Home icon: "Homeschooled Her Own Children"

**Right Column — Archetype Ring Visual**

See Section 5 (Archetype Visual Treatment) for full detail. The ring is the primary hero visual. It should animate on load: characters fade in one by one in a ~600ms stagger, the ring gently rotates 5° and settles. No heavy animation — subtle entry only.

Underneath the ring, a small caption (Inter, 0.78rem, `--text-tertiary`, center-aligned):
> "Which one are you?"

**Mobile Behavior:** Stack left column above right. Archetype ring scales to 90vw centered. CTA stays above the fold.

---

### Section 2: Trust / Stats Bar

**Purpose:** Provide instant social proof before the parent reads further. Implicit credibility, not hype.

**Layout:** Full-width horizontal strip. Parchment background, subtle top and bottom border (`--border-default`). Three stats separated by vertical dividers.

```
┌──────────────┬──────────────────────────┬────────────────────────┐
│  363,000+    │  29 Foundational Texts   │  100+ Curricula        │
│  State       │  Studied. 253 Teaching   │  Matched to Your       │
│  Standards   │  Principles Extracted.   │  Philosophy.           │
│  Integrated. │                          │                        │
└──────────────┴──────────────────────────┴────────────────────────┘
```

Each stat:
- Number/label: Cormorant SC, 600, ~2rem, `--ink`
- Description: Inter, 0.8rem, `--text-secondary`

Note on voice: these stats are not hype numbers ("10 million lessons!") — they are evidence of the founder's methodology. The framing should feel like an academic citation, not a startup boast.

**Mobile:** Stack vertically, left-aligned with a left border accent (`--accent-secondary`).

---

### Section 3: The 8 Archetypes Showcase

**Purpose:** Make the quiz irresistible by showing parents what they're about to discover. This is the biggest differentiator vs. every competitor — none of them have archetypes. Make it feel like identity, not a product feature.

**Layout:** Section heading centered, then a horizontal scroll container with 8 archetype cards. Below the row: a pull-quote and the quiz CTA.

**Section Heading:**
- Eyebrow: "The Compass Quiz"
- H2: "Eight Ways to Teach. One That's Yours."
- Lead (italic): "After 14 years in classrooms, co-ops, and micro schools, I found that every educator falls into one of eight archetypes. Which one describes you?"

**Archetype Card Row**

On desktop (1200px+): Display all 8 cards in a single row, each card ~140px wide. Cards truncate description text — they are teasers, not full profiles.

On tablet (768px–1199px): 2 rows of 4, or horizontal scroll.

On mobile: Horizontal scroll (scroll-snap). Show 2.5 cards to indicate scrollability.

**Each Archetype Card:**
```
┌──────────────────┐
│  [Watercolor PNG] │  ← 80px × 80px, circle crop
│    [Name]        │  ← Cormorant SC, 600, 0.95rem
│  [1-line hook]   │  ← Inter, 0.75rem, --text-secondary
│  [Arch color bar]│  ← 3px bottom border in arch color
└──────────────────┘
```
- Card background: `--surface-card` (frosted glass)
- Border: 1px `--border-default`
- Border-radius: 16px
- On hover: `translateY(-4px)`, box-shadow elevation increase, arch color border glows slightly

**8 Cards — Name, Hook Line, Color:**

| # | Archetype | Hook Line | Color Token |
|---|---|---|---|
| 1 | The Guide | "Clear direction, rigorous academics, measurable milestones" | `--arch-guide` (#5B5E8A) |
| 2 | The Explorer | "The world is the classroom — always has been" | `--arch-explorer` (#5A947A) |
| 3 | The Cultivator | "Prepared environment. Child chooses. Trust the process." | `--arch-cultivator` (#7D6B9E) |
| 4 | The Naturalist | "Seasons, soil, and sky teach better than any textbook" | `--arch-naturalist` (#6BA07A) |
| 5 | The Storyteller | "Living books, narration, and the beauty of great ideas" | `--arch-storyteller` (#B07A8A) |
| 6 | The Architect | "Real learning means building something real" | `--arch-architect` (#5A7FA0) |
| 7 | The Free Spirit | "Trust. Curiosity. Freedom. Children know what they need." | `--arch-freespirit` (#C07A42) |
| 8 | The Weaver | "A bit of everything — whatever works for this child, today" | `--arch-weaver` (#8A8A7E) |

**Below the Card Row:**

A pull-quote in a frosted glass well, centered, max-width 640px:
> "Most families are a blend of two or three archetypes. The Compass Quiz finds your unique combination — and then the app uses it to shape every lesson we generate for your family."
> — [Founder Name], M.Ed., EdD Candidate

Then the primary CTA again:
- Button: **Discover My Archetype** — Free, 5 Minutes
- Sub-text: "Taken by 2,000+ homeschool families" *(update with real number at launch)*

---

### Section 4: Three-Step How It Works

**Purpose:** Rapidly explain the product loop without overwhelming. Three steps, each with a small embedded UI preview.

**Layout:** Section label + H2 centered. Then three columns on desktop, stacked on mobile. Each column has a step number, heading, body, and embedded UI mockup.

**Section Copy:**
- Eyebrow: "How It Works"
- H2: "From Your Philosophy to a Lesson Plan. In Two Minutes."

**Step 1: Take the Compass Quiz**
- Number: "01" (Cormorant SC, large, `--accent-primary`, faded behind content)
- Heading: "Discover Your Teaching Archetype"
- Body: "20 thoughtfully designed questions reveal how you naturally approach education — your philosophy, your rhythms, your strengths. No teaching degree required to take it."
- Visual: Small mockup of a quiz question card (Cormorant SC heading, radio buttons styled in brand, soft lavender background). HTML/CSS mockup — not a screenshot.

**Step 2: Tell Us What to Teach**
- Number: "02"
- Heading: "Type a Topic. Pick a Subject. Hit Generate."
- Body: "Type anything: 'frogs,' 'the American Revolution,' 'fractions.' Select the subject and your child's grade. We handle the philosophy, the standards, and the structure."
- Visual: Small mockup of the generate input — a rounded text field with placeholder "What is your child curious about today?", a subject selector, and an ink-colored Generate button.

**Step 3: Teach with Confidence**
- Number: "03"
- Heading: "A Complete Lesson, Ready to Use"
- Body: "Your lesson arrives with learning objectives, activities matched to your philosophy, materials, a standards alignment note, and print-ready formatting. In two minutes, not two hours."
- Visual: Small mockup of a lesson output card — title, a colored philosophy badge, a short activity description, and a standards chip. Frosted glass surface.

**Connector:** Between each step pair, a subtle hand-drawn arrow or dotted line in `--accent-secondary`. The steps should feel like a path, not a slide deck.

---

### Section 5: Feature Deep Dive

**Purpose:** Address the parent who needs to be convinced on depth before converting. Three feature rows, alternating left/right text-visual layout.

**Section Copy:**
- Eyebrow: "Built on Real Pedagogy"
- H2: "Not a ChatGPT Wrapper. A Master Educator's Methodology."

Use the brand voice directly here. The founder spent 14 years learning these philosophies. This section is where that expertise is substantiated.

**Feature Row 1: Philosophy-Matched Generation**
- Visual side (right): A two-panel comparison. Left panel: a generic ChatGPT-style lesson snippet (labeled "Generic AI"). Right panel: an archetype-matched lesson with philosophy tag, hands-on activities, concrete-to-abstract progression. The difference is immediately visible.
- Headline: "Every Lesson Speaks Your Philosophy's Language"
- Body: "Montessori math doesn't just 'include manipulatives' — it follows Maria Montessori's concrete-to-abstract sequence, extracted from her original writings. Charlotte Mason lessons use living books, short sessions, and narration. Classical lessons build on the trivium. We didn't read Wikipedia. We read 29 foundational texts and extracted 253 core teaching principles. That's what powers every lesson."
- Subtle sub-note (italic, `--text-tertiary`): "This is the answer to 'why not just use ChatGPT?'"

**Feature Row 2: Standards Without Sacrifice**
- Visual side (left): A standards chip cluster — colorful badges like "2.OA.1 — Operations & Algebraic Thinking" and "NGSS — LS1.A" appearing alongside a nature-based lesson excerpt. The visual shows standards woven into a beautiful, philosophy-aligned lesson — not replacing it.
- Headline: "Your State's Standards. Quietly, Behind Every Lesson."
- Body: "363,000+ standards across all 50 states, mapped to the K-12 scope. You choose the philosophy. We make sure the standards are covered — without turning your lesson into a worksheet. Standards alignment is a quiet background guarantee, not the whole point."
- Proof: "All 50 states · 363,000+ standards · Automatically updated"

**Feature Row 3: The Compass Quiz + Explore Star Map**
- Visual side (right): A stylized glimpse of the Explore star map — constellation-like nodes on a deep teal background (`--hue-explore`), representing curricula, philosophies, and principles. It should look beautiful, not technical.
- Headline: "Explore the Universe of Educational Philosophy"
- Body: "The Explore map lets you navigate 100+ curricula scored against your archetype, the 8 philosophy models, and the principles that connect them. It's not a dropdown list. It's a visual space for discovery — so you can find the curriculum that actually fits your family, not just the one that came up first on Google."
- Secondary line: "Paired with the Compass Quiz, it answers the question every new homeschool parent has: *where do I even begin?*"

---

### Section 6: Social Proof

**Purpose:** Establish peer credibility with real testimonials. Avoid the LearnSpark mistake (3 quotes from 2 people). Aim for diversity of archetype and philosophy.

**Layout:** 3 testimonial cards in a row (desktop), stacked (mobile). Below: a founder pull-quote in a full-width well.

**Section Copy:**
- Eyebrow: "From Homeschool Families"
- H2: "What Happens When Your Lessons Finally Fit"

**Testimonial Card Template:**
```
┌──────────────────────────────────────────────────────┐
│  [Archetype badge — e.g., "The Cultivator"]          │
│                                                      │
│  "[Quote — 2-3 sentences, specific and concrete]"   │
│                                                      │
│  [Photo] [Name, State]                               │
│           [Children's ages]                          │
└──────────────────────────────────────────────────────┘
```

- Archetype badge: small pill, arch color background at 15% opacity, arch color text, Cormorant SC
- Quote: Cormorant italic, 1.1rem, `--ink`
- Attribution: Inter, 0.8rem, `--text-secondary`
- Card: frosted glass, `--shadow-card`

**Placeholder Testimonials (replace with real beta testimonials):**

Card 1 (The Storyteller — Charlotte Mason family):
> "I've tried every planning app and always ended up back at my notebook. This is the first tool that actually understands that my lessons are supposed to be short, rich, and rooted in living books. The Generated lesson for our nature study this week was better than anything I could have planned myself."
> — Sarah M., Michigan · Ages 8 & 11

Card 2 (The Free Spirit — Unschooling-adjacent):
> "I don't 'do school.' But when my son got obsessed with volcanoes, I wanted to go deeper without spending my Sunday mapping standards. I typed 'volcanoes' and had a complete, age-appropriate lesson in two minutes. He didn't know it was aligned to Oregon's science standards. He just thought it was cool."
> — Jen K., Oregon · Age 9

Card 3 (The Weaver — Eclectic):
> "Three kids, three completely different ways of learning. The multi-child lesson feature changed our mornings. I generate one lesson, it differentiates for a 2nd grader and a 5th grader, and we actually do school together now instead of me running between workbooks."
> — Rachel T., Texas · Ages 7, 10 & 13

**Below the cards — Founder pull-quote well:**

Full-width, parchment-colored well with left border in `--accent-secondary`:
> "I'm not trying to replace you. You're still the teacher — and you're a good one. I'm trying to give you back the hours you spend planning, so you can spend them teaching."
> — [Founder Name], M.Ed., EdD Candidate

---

### Section 7: Founder Section

**Purpose:** This is the trust anchor of the entire page. In the homeschool market, the founder's credentials are the product. This section should feel personal, not corporate.

**Layout:** Two-column on desktop — photo left (or right), credentials + story right. Full-width background wash using `--hue-about` (soft rose-mauve) to distinguish it from the rest of the page.

**Visual:** A warm, natural-light photo of the founder — at a desk with books and curriculum materials, or at a kitchen table with a child, or in a co-op setting. Not a corporate headshot. The photo should feel like it belongs in the homeschool world she describes.

**Right Column Copy:**

Eyebrow: "Built by an Educator. For Educators."

H2: "I've Spent 14 Years Learning What You're Trying to Figure Out."

Body (first-person, founder's voice):
> When I started teaching, curriculum planning took hours every week. Not because I didn't know education — I had a master's in it. But because matching the right activity to the right child, the right philosophy to the right standard, is genuinely hard. I did it across three states, in my own home, in micro schools, and in co-ops. I read every major text on educational philosophy — Montessori, Steiner, Charlotte Mason, the classical trivium, place-based education. I tracked 253 core principles. I mapped 363,000 state standards.
>
> Then I built the tool I wished I'd had.

Credential chips row (inline, styled as small frosted cards):
- "M.Ed. in Education"
- "EdD Candidate"
- "14 Years Teaching"
- "Homeschooled Own Children"
- "Ran Micro Schools"
- "Taught Across 3 States"

Each chip: Inter, 0.75rem, `--text-secondary`, `--surface-card`, 8px border-radius, `--border-default`, subtle `--shadow-sm`.

Below chips — a single line in `--accent-primary`, Inter italic, 0.9rem:
> "The AI is the delivery mechanism. My 14 years of expertise is the product."

**Mobile:** Stack photo above text. Photo is circular-cropped at 200px on mobile.

---

### Section 8: Pricing Preview

**Purpose:** Remove the price anxiety before the final CTA. Don't hard-sell — show that the free tier is real and the paid tier is reasonably priced.

**Layout:** Centered section heading. Three cards in a row (or 2+1 emphasized center). "Start free" is the message, not "buy now."

**Section Copy:**
- Eyebrow: "Simple, Fair Pricing"
- H2: "Start Free. Upgrade When You're Ready."
- Lead: "The Compass Quiz and your first three lessons are completely free. No credit card. No trial countdown. Just start teaching."

**Pricing Cards:**

Card 1: Compass (Free)
- Heading: "Compass"
- Price: "$0 / forever"
- Key features (3 bullets):
  - "Full Compass Quiz + archetype discovery"
  - "3 lesson generations per month"
  - "Top curriculum matches for your philosophy"
- CTA: "Start Free →"
- Card style: Standard `--surface-card`, `--border-default`

Card 2: Hearth — **most popular, visually emphasized**
- Heading: "Hearth"
- Price: "$14.99 / month" (or $149 / year)
- Annual note: "Save 17% annually — plan your full curriculum year"
- Key features (4 bullets):
  - "30 lessons per month (unlimited on annual)"
  - "Up to 4 children, multi-child differentiation"
  - "Full standards tracking across all 50 states"
  - "Private community access"
- CTA: "Start Hearth →"
- Card style: Slightly elevated. `--accent-primary` thin border. "Most Popular" badge in `--accent-tertiary`.

Card 3: Homestead
- Heading: "Homestead"
- Price: "$24.99 / month"
- Key features (3 bullets):
  - "Unlimited lessons, up to 6 children"
  - "Full standards coverage reports"
  - "Monthly AMA with the founder"
- CTA: "Start Homestead →"
- Card style: Standard `--surface-card`

Below the cards — a reassurance line (Inter, 0.82rem, `--text-tertiary`, centered):
> "All plans include all 8 teaching philosophies, the full Compass Quiz, and the Explore star map. Cancel anytime."

**Note on price anchoring vs. competitors:** At $14.99/month, we are less than half the price of LearnSpark ($39/month, credit-based). Do not state this explicitly on the pricing section — let it be implicit. The pricing page (separate) can address it directly.

---

### Section 9: Final CTA

**Purpose:** The emotional close. Repeat the primary CTA one last time after the parent has seen everything.

**Layout:** Full-width section. Warm parchment background with a more saturated watercolor wash (`hue-home` at higher opacity). Centered content, max-width 640px.

**Copy:**

H2 (Cormorant SC, large):
> You've been figuring this out on your own.
> You don't have to anymore.

Body (Cormorant italic, 1.15rem):
> Take the free Compass Quiz. Find your teaching archetype. Generate your first lesson in two minutes.

Primary CTA button (centered, larger than page CTAs — 1.1rem, padding 0.8rem 2.5rem):
- **Take the Compass Quiz — It's Free**

Sub-text:
> 5 minutes · No credit card · Discover your archetype

Secondary micro-line below sub-text (Inter, 0.75rem, `--text-tertiary`):
> Already know your philosophy? → Jump straight to lesson generation

---

### Section 10: Footer

**Layout:** Three-column on desktop, stacked on mobile. Full-width, `--ink` background, `--parchment` text.

Column 1 — Brand:
- Logo mark (compass rose watercolor icon + "The Sage's Compass" in Cormorant SC)
- Short brand statement (1 sentence, Cormorant italic): "Custom curriculum built on real pedagogy, for real families."
- Founder credit: "Created by [Founder Name], M.Ed., EdD Candidate"

Column 2 — Navigation:
- The Compass Quiz
- How It Works
- Pricing
- About [Founder Name]
- Blog (Philosophy Guides)
- State Standards Guides

Column 3 — Community & Support:
- Join the Community (Facebook Group link)
- Email Support
- Privacy Policy
- Terms of Service
- "Built by an educator, for families like yours."

Bottom bar: Copyright. Inter, 0.75rem, `rgba(249,246,239,0.5)`.

---

## 4. Copy Recommendations

### Brand Voice Principles (from docs)

All hero copy must pass four tests:
1. Could the founder say this out loud, in her own kitchen, to a parent she just met? (Warmth test)
2. Does it reference expertise without using jargon? (Credibility test)
3. Does it show rather than claim? (Proof test)
4. Does it make the parent feel seen, not sold to? (Resonance test)

**Never use:** "leverage," "optimize," "disrupt," "game-changing," "revolutionary AI," "just let the AI handle it."

**Always prefer:** First-person founder voice for longer copy. Second-person ("your family," "your child") for CTAs and subheadlines. Concrete specifics ("14 years," "29 foundational texts," "363,000 standards") over vague claims ("years of experience," "comprehensive content").

### Headline Candidates

**H1 Options (final choice depends on A/B testing at launch):**

Option A (Recommended — identity-first):
> Every family teaches differently. Now your lessons can too.

Option B (Problem-solution):
> Stop spending your Sunday nights planning lessons you're not sure fit your philosophy.

Option C (Authority-forward):
> 14 years of teaching expertise. Distilled into a lesson plan for your family. In two minutes.

Option D (Quiz-first):
> What kind of teacher are you? Discover your archetype. Generate your curriculum.

**Recommendation:** Option A leads with the product's core truth (personalization) without being about technology or the founder first. The founder credibility arrives one section later. This sequencing earns trust without leading with ego.

### Subheadline

Current recommendation:
> Discover your teaching archetype. Generate custom, standards-aligned lesson plans for any philosophy — Montessori, Charlotte Mason, Classical, and more — in two minutes.

This earns its length because it contains three specific, scannable claims:
- "discover your teaching archetype" (the quiz — unique differentiator)
- "any philosophy — [named examples]" (calls out the philosophies parents already identify with)
- "two minutes" (time commitment, concrete, credible)

### CTA Copy Options

Primary CTA (quiz entry):
- **Take the Compass Quiz** (clean, brand-forward)
- **Discover My Teaching Archetype** (benefit-led)
- **Find Your Teaching Style — Free** (accessibility-focused)

Recommended: "Take the Compass Quiz" for hero. "Discover My Archetype" for the archetype showcase section CTA. Variation creates freshness without confusion.

Secondary CTA (scroll):
- "See how it works →" (functional)
- "Watch a lesson get generated →" (curiosity-driver, if video demo is available)

### Philosophy Mention Strategy

Name specific philosophies explicitly in the subheadline and feature copy. Homeschool parents self-identify strongly with their philosophy — hearing "Montessori" or "Charlotte Mason" named is an immediate signal that this product understands their world. Generic tools say "adaptable to multiple approaches." We say the names.

---

## 5. Archetype Visual Treatment

### Hero Ring Arrangement

On the right side of the hero, the 8 archetype characters are arranged in a **circular ring**, 8 positions evenly spaced (45° apart). This creates:

- A compass-like visual (ties directly to the brand name)
- A sense of completeness (all 8 visible)
- Invitation to explore ("which one am I?")
- No hierarchy — all archetypes are equally valid

**Technical spec:**

Ring diameter: 400px on desktop (scales down on tablet/mobile).
Character image circles: 72px × 72px each, circular crop (`border-radius: 50%`).
Ring center: Empty or a subtle compass rose icon in `--accent-primary` at low opacity.

Each character sits on the ring circumference. Position formula:
```
x = centerX + radius * cos(angle)
y = centerY + radius * sin(angle)
```
Where angle = (index × 45°) - 90° (so The Guide starts at top).

**Archetype order on the ring (clockwise from top):**
1. Top: The Guide (classical, structured — north)
2. Top-right: The Storyteller
3. Right: The Architect
4. Bottom-right: The Explorer
5. Bottom: The Free Spirit (most unstructured — south, opposite The Guide)
6. Bottom-left: The Naturalist
7. Left: The Cultivator
8. Top-left: The Weaver

This ordering places philosophically opposite archetypes roughly opposite each other on the ring (The Guide / The Free Spirit; The Architect / The Naturalist), which feels intentional and adds meaning without explanation.

**Hover behavior:** On hover over any character, the character image scales to 1.1×, a tooltip appears with the archetype name and 1-line hook, and that character's arch color pulses as a glow ring behind the image.

**Name labels:** Each character has a name label in Cormorant SC, 0.7rem, below the image circle. Color matches the arch color token.

**Image source:** `/archetypes/{slug}.png` for watercolor character portraits. These are the watercolor PNGs referenced in the brief. Circular crop applied via `border-radius: 50%` with `object-fit: cover`.

### Archetype Showcase Row (Section 3)

For the horizontal scroll row of 8 archetype cards (full detail in Section 3 above), the image treatment is:
- Character image: 80px × 80px, circular crop, centered at top of card
- Below image: A short arch-colored underline (2px, 32px wide, arch color, centered)
- Name in Cormorant SC 600
- Hook line in Inter 0.75rem

The visual effect should feel like trading cards or character profiles — personal, distinctive, identity-driven.

### Do Not Use

- Emoji icons as the primary archetype visual on the hero ring (emojis in the archetypes.ts file are for internal use / fallbacks; watercolor PNGs are the canonical hero visual)
- Generic abstract icons or stock photography
- All 8 archetypes in the same color (each must be rendered in its arch color)

---

## 6. Implicit Competitor Positioning

Based on the LearnSpark teardown and competitive analysis, the following competitor weaknesses should be addressed **implicitly** through our design and copy choices — never named, never attacked.

### What Competitors Do (and we don't)

| Competitor Weakness | Our Implicit Counter |
|---|---|
| Generic "trusted by families worldwide" with zero numbers | We use specific numbers: 363,000 standards, 253 principles, 29 foundational texts. Every claim is grounded. |
| No philosophy depth — "adaptable to Montessori, PBL" is surface-level | We name the philosophies, describe the principles, and show the methodology. Depth is visible. |
| No quiz, no archetype, no identity — the parent is anonymous | The Compass Quiz and archetype system make every parent feel seen and personally matched. Identity is central. |
| Credit-based pricing ($39/mo for ~50 lessons feels restrictive) | We lead with free tier and use "30 lessons/month" language for Hearth. No credits. No meter anxiety. |
| Soulless SaaS aesthetic — could be any product | Watercolor, Cormorant SC, parchment, warmth. This is unmistakably an educator's product, not a startup's. |
| No founder story — or founder is a "former school district administrator" | Our founder's credentials are in every section. Not once, prominently, as a bio — woven throughout as proof. |
| No curriculum matching — they generate lessons but don't match to curricula | We surface curriculum matching as a named feature. "100+ curricula matched to your philosophy." |
| No video anywhere | We should include at minimum a 90-second founder video in Section 7 or the final CTA. |
| All testimonials from same 2 people | We show 3 testimonials from 3 different archetypes, different states, different ages. |
| 14 sections — information overload | We use 9 sections, each with one job. |

### The Positioning Gap We Own

Our page should visually communicate the upper-right quadrant of the positioning map from the brand doc:

```
           PHILOSOPHY-SPECIFIC
                   |
    ★ The Sage's Compass  ←  We're here
                   |
MANUAL ────────────┼──────────────── AI-POWERED
                   |
           PHILOSOPHY-AGNOSTIC
```

No competitor occupies this space with our depth. The visual and copy system of the hero page should make this obvious without stating it: we are the only tool that is simultaneously deeply AI-powered AND deeply philosophy-grounded.

---

## 7. Three-Layer Value Prop

These three layers map directly to the positioning layers in the brand strategy doc. Each layer targets a different visitor at a different stage of attention.

### Layer 1: The 5-Second Hook

**Where it lives:** The H1 headline and the hero archetype ring visual. Together they must stop the scroll.

**What it must communicate:** This tool is personalized to how I teach, not generic.

**Recommended execution:**

Headline: "Every family teaches differently. Now your lessons can too."

Visual: The 8-archetype ring immediately signals: "this product knows there are different types of educators." A parent who self-identifies as a Montessori educator, sees a gentle watercolor character that resonates with them, and reads a headline about personalization — they stop. They read more.

**What it must NOT do:** Mention AI, use jargon, explain features, or ask for anything. Not even a button is required within 5 seconds — the hook is the job of the first screenful.

---

### Layer 2: The 30-Second Explainer

**Where it lives:** The hero subheadline, the eyebrow label, and the trust badge row — all visible without scrolling.

**What it must communicate:** How it works, why it's credible, what the first step is.

**The 30-second read (in order):**

1. Eyebrow: "Designed by a Master Educator. Built for Your Family." → Credibility signal
2. H1: "Every family teaches differently. Now your lessons can too." → Core promise
3. Subheadline: "Discover your teaching archetype. Generate custom, standards-aligned lesson plans for any philosophy — Montessori, Charlotte Mason, Classical, and more — in two minutes." → Mechanism + specifics
4. Trust badges: "14 Years of Teaching Experience · Master's in Education · Homeschooled Her Own Children" → Founder proof
5. CTA: "Take the Compass Quiz — It's Free / No credit card required · 5 minutes" → Low-risk first step

Together these elements answer the parent's first three questions:
- "What is this?" (personalized, philosophy-matched curriculum)
- "Why should I trust it?" (built by a real educator with real credentials)
- "What do I do?" (take a free 5-minute quiz)

---

### Layer 3: The 2-Minute Deep Dive

**Where it lives:** Sections 3 through 7 — the archetypes showcase, how it works, feature deep dive, social proof, and founder section.

**What it must communicate:** The depth of the knowledge graph, the specificity of the philosophy matching, the founder's methodology, and the social proof from real families.

**Narrative arc for the deep-dive reader:**

1. **Archetype section (Section 3):** "There are 8 types of educators. Let me show you which one you are." — Creates identity investment. The parent sees their archetype reflected back at them before they've even taken the quiz.

2. **How It Works (Section 4):** "The process is simple. Quiz → generate → teach." — Removes process anxiety. The product isn't complicated.

3. **Feature Deep Dive (Section 5):** "Here's why this is different from ChatGPT and every other lesson plan generator." — Addresses the educated parent's skepticism. 253 principles. 29 texts. 363,000 standards. These are not marketing claims; they are methodology claims.

4. **Social Proof (Section 6):** "Real families. Real archetypes. Real results." — Peer proof from families who look like them.

5. **Founder (Section 7):** "Here's who built this and why she's the right person to build it." — The trust anchor. After 2 minutes of reading, the parent should feel like they know the founder personally and trust her expertise completely.

**What the deep-dive reader learns that the 5-second reader doesn't:**
- The philosophy matching is powered by a knowledge graph built from 29 foundational texts — not a generic prompt
- The Compass Quiz is a psychometric instrument designed by someone with an M.Ed.
- The standards alignment covers all 50 states automatically
- The founder homeschooled her own children — she is the customer

---

## 8. Implementation Notes

### Priority Order for Build

1. **Hero section** (Section 1) — the highest-leverage page element. Nail the headline, CTA, and archetype ring first.
2. **Archetype ring animation** — critical for the right-column visual. Use CSS transforms (no JS library needed). Stagger with `animation-delay` on each character's fade-in.
3. **Archetype showcase row** (Section 3) — second most important. This is the differentiator section.
4. **Founder section** (Section 7) — photo must be real. Placeholder should be warm/illustrative, not a grey box.
5. **Social proof** (Section 6) — collect real testimonials from beta users before launch. Do not launch with placeholders.

### What Requires Real Assets Before Launch

| Asset | Status | Notes |
|---|---|---|
| 8 archetype watercolor PNGs at `/archetypes/{slug}.png` | Check current build | Confirm all 8 are final-quality, not placeholders |
| Founder photo (warm, natural light) | Needs to be taken | Critical for Section 7 — cannot be stock |
| 3 beta testimonials (real names, real archetypes, real specifics) | Collect from beta users | Do not launch without |
| Founder video (90 seconds, kitchen table or desk) | Phase 2 enhancement | Nice for launch; required by Phase 3 per GTM plan |

### Mobile-First Considerations

- Hero archetype ring: scale to 85vw, min 300px, max 380px
- All frosted glass cards: reduce `backdrop-filter: blur(12px)` to `blur(8px)` on mobile for performance
- Trust badges: scroll horizontally on mobile, do not stack 3-column
- Pricing cards: stack vertically, lead with Hearth (middle tier) on mobile

### Accessibility

- All archetype images: `alt="Watercolor illustration of [Archetype Name] — [1-line description]"`
- CTA buttons: minimum 44px touch target on mobile
- Color contrast: verify all `--text-secondary` (#5A5A5A) on `--parchment` (#F9F6EF) meets AA (4.5:1). Computed ratio is approximately 4.6:1 — marginally passes.
- Archetype ring: provide keyboard navigation (tab through characters, enter to expand tooltip)

### Analytics Instrumentation (at launch)

Track these events for post-launch optimization:
- `hero_cta_click` — primary CTA in hero
- `archetype_card_hover` — which archetype(s) a visitor hovers on (proxy for self-identification)
- `archetype_quiz_cta_click` — CTA in Section 3
- `pricing_card_view` — which pricing tier is in viewport longest
- `final_cta_click` — Section 9 CTA
- `scroll_depth` — 25%, 50%, 75%, 100% events

The `archetype_card_hover` event is particularly valuable: if visitors consistently hover on The Cultivator or The Storyteller before clicking the quiz CTA, it tells us which archetypes are most common in our early audience and should be featured first in future creative.

---

*This spec is derived from: `brand-product-marketing-strategy.md`, `competitive-learnspark-teardown.md`, `competitive-marketing-analysis.md`, `go-to-market-plan.md`, `web/src/lib/compass/archetypes.ts`, and `web/public/brand-guide.html`. All copy and design recommendations are grounded in the documented brand voice, competitive analysis, and design token system.*
