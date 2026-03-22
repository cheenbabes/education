# LearnSpark.io — Full Site Teardown (March 2026)

Crawled all 11 pages via Playwright. Analysis by 3 parallel agents.

## Key Stats
- **Price:** $39/month, 500 credits (~50 lessons), top-up 150 credits for $16
- **Org tier:** $10/student/month, $100 min
- **Trial:** 7-day free, no credit card
- **Entity:** LearnSpark LLC, Sheridan, Wyoming
- **Stack:** React SPA (Vite), Tailwind + shadcn/ui, separate app subdomain
- **Tracking:** GA4, Facebook Pixel, Intercom chat, custom analytics proxy

## Homepage Structure (14 sections!)

1. **Hero** — "The Right Next Lesson. Every Time." + full 3-column dashboard mockup (not a screenshot — built in HTML). Trust badge, dual CTA.
2. **Stats bar** — "8-12 hrs saved", "100% standards aligned", "1 platform replaces 5-8 tools"
3. **Three outcomes** — Know what to teach, know you're on track, know they'll love it
4. **Testimonials** — 3 quotes from only 2 real people (JC, Brooke, Paridhi)
5. **How SparkAI works** — 3-step flow with embedded UI mockups
6. **Competitor comparison table** — Directly names Khan Academy, IXL, ChatGPT/Claude, Outschool, Seesaw
7. **Lesson engine features** — Interest Weaver, Adaptive Resources, Feedback Loop
8. **Standards & progress** — Mastery Map, Gap Analysis, Schedule & Goals
9. **Promise section** — "Built for Progress, Not Just Play"
10. **Multi-child section** — Joint lessons, Smart Grouping pods
11. **Flexibility section** — Worldschooling, location-aware, data export
12. **Use cases tabs** — 8 audience segments with tab switching
13. **Final CTA** — "We Handle the Planning, Tracking, and Pedagogy."
14. **Footer** — 3-column links, legal

## What They Do Well

- **Dashboard mockup in hero** — shows the entire product workflow without a screenshot
- **Competitor comparison table** — bold move, positions them against known brands
- **"Be the Guide, Not the Enforcer"** — emotionally resonant headline on homeschool page
- **Mission/cross-subsidy model** — "Those who can pay, do — so those who can't, don't have to"
- **Interest Weaver** naming specific kid interests (Minecraft, Horses, Space)
- **Problem/Solution/Difference template** on every feature page — effective formula
- **Zero images** — all mockups are HTML/CSS, crisp at any resolution
- **"No credit card required"** under trial CTA

## Their Weaknesses (Our Opportunities)

- **Soulless design** — Clean SaaS template, could be any product. No personality.
- **Thin social proof** — Only 3 testimonials from 2 people (JC and Brooke), reused across pages. "Trusted by families worldwide" with zero numbers.
- **No video anywhere** — for a visual product, major gap
- **Credit-based pricing** — $39/mo for ~50 lessons feels restrictive and expensive
- **No philosophy depth** — "adaptable to Montessori, PBL" is surface-level marketing
- **No teaching archetype/personality quiz** — they don't know WHO the parent is
- **No curriculum matching** — they generate lessons but don't match to existing curricula
- **No visualization** — no star map, no interactive exploration
- **All testimonials from same person on homeschool page** — credibility risk
- **"Schedule Demo" for $39/mo product** — enterprise sales motion for consumer price
- **No annual discount** — standard SaaS practice, missing
- **No JSON-LD structured data** — SEO gap
- **No team bios on About page** — values only, no humans

## Structural Patterns Worth Borrowing

### Page flow (adapt to our voice, not theirs)
1. Hero with clear value prop + product preview
2. Social proof / stats bar
3. 3 core outcomes (what you get)
4. Testimonials
5. How it works (3 steps)
6. Feature sections with embedded visuals
7. Comparison table (optional, bold)
8. Final CTA

### UX patterns
- Trust badge above headline
- Dual CTA (primary action + secondary demo/learn more)
- "No credit card required" sub-text
- Problem/Solution/Difference template for feature pages
- Cross-links between feature pages to reduce bounce
- Tab system for multiple audiences
- Embedded UI mockups (HTML, not screenshots)

### What to deliberately avoid
- 12x CTA repetition (aggressive, feels desperate)
- Generic "trusted by families worldwide" with no proof
- Reusing same testimonial on multiple pages
- 14 sections on homepage (information overload)
- Corporate SaaS aesthetic
- "Schedule Demo" for a consumer product

## Our Advantages (from brand guide)

| Us | Them |
|---|---|
| 8 deep philosophies from 29 PDFs | "Adaptable to Montessori, PBL" |
| 20-question psychometric quiz → 8 archetypes | No quiz, no archetypes |
| 100+ curricula scored against your profile | No curriculum matching |
| 363K+ standards, all 50 states | "Some" standards |
| Interactive constellation star map | No visualization |
| Watercolor storybook — warm, soulful | Clean SaaS — polished but generic |
| $14.99/mo (planned) | $39/mo + credits |
| Knowledge graph: 253 principles, 265 activities | No KG |
