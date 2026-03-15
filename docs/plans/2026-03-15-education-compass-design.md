# Education Compass — Design Document

## Overview

The Education Compass is a two-part quiz that helps parents, teachers, and educators in alternative learning environments discover their teaching philosophy "type" and get matched with curricula that fit their style and practical needs.

### Purpose

1. **Philosophy discovery** — Users get a shareable teaching profile (archetype name + dimension scores + philosophy blend chart) that helps them understand how they naturally approach education.
2. **Curriculum matching** — Based on philosophy fit and practical preferences, users get a comparison table of vetted curricula for literacy and math (with optional science and social studies), each with affiliate links.
3. **App funnel** — The results page positions EduApp as the tool for building interest-driven lessons around whatever curriculum they choose, or as the primary tool for unschooling/child-led families.

### Audience

Primarily homeschool parents, but inclusive of co-op organizers, micro school teachers, small private school educators, and anyone making independent curriculum decisions. Language throughout uses "teaching" and "education" rather than "homeschool" specifically.

---

## Part 1: Philosophy Discovery (8-10 scenario-based questions)

### The Five Dimensions

Each question scores the user on five spectrums (scored 0-100, not binary):

| Dimension | Left pole | Right pole |
|-----------|-----------|------------|
| Structure | Prescriptive | Adaptive |
| Modality | Hands-on | Books-first |
| Subject approach | Integrated | Subject-focused |
| Direction | Teacher-directed | Child-directed |
| Social | Community/Collaborative | Individual |

**Structure/Flow split:** The Structure dimension captures nuance when users prefer prescriptive approaches for foundational skills (literacy/math) but adaptive approaches for other subjects. When answers diverge by subject context, the results display a single bar with a callout:

> **Structure: Prescriptive ←——●————→ Adaptive**
> *You lean prescriptive for literacy and math, adaptive for other subjects — a common and practical approach.*

### The Eight Philosophies

- Montessori-inspired
- Waldorf-adjacent
- Project-based learning
- Place/nature-based
- Classical
- Charlotte Mason
- Unschooling/child-led
- Eclectic/Flexible

### How Scoring Works

Each answer choice distributes weighted points across dimensions AND philosophies simultaneously. For example, an answer about letting a child follow a rabbit trail of curiosity might score: Adaptive +3, Child-directed +2, Montessori +2, Unschooling +3.

Part 1 produces two outputs from the same questions:
- **Dimension scores** — five percentages that determine the archetype type name
- **Philosophy blend** — weighted percentages across the 8 philosophies that drive the pie chart

### Question Themes

Each question probes different dimensions through relatable scenarios with 4 answer choices:

1. **Responding to a child's spontaneous interest** (Structure, Direction)
2. **What a typical morning looks like** (Structure, Modality)
3. **How a child should learn to read** (Modality, Direction)
4. **Approach when a child struggles with a concept** (Direction, Modality)
5. **Role of outdoor time and the physical world** (Modality, Social)
6. **How subjects should relate to each other** (Subject approach)
7. **Feelings about testing and assessment** (Structure, Direction)
8. **What "a good day of learning" looks like** (all dimensions)
9. **Working with other families or independently** (Social)
10. **How you'd handle a topic the child has no interest in** (Structure, Direction)

Example question:

> *"Your child becomes fascinated with birds after seeing a hawk in the yard. How would you ideally respond?"*
> - Set up a bird observation journal and field guide, letting them classify and sketch what they find *(Montessori +3, Place/Nature +2)*
> - Read living books about birds together, then go on a nature walk to observe *(Charlotte Mason +3, Place/Nature +2)*
> - Help them research hawks and build a bird feeder, turning it into a week-long project *(Project-based +3, Unschooling +1)*
> - Use it as a jumping-off point for a zoology block with stories, watercolor painting, and songs *(Waldorf +3)*

### Archetypes

8-10 named archetypes based on the most common/meaningful dimension combinations. Each gets a name, an icon, and a short description. Examples:

- **"The Guide"** — structured, teacher-directed, subject-focused
- **"The Explorer"** — child-led, hands-on, integrated
- **"The Cultivator"** — structured but hands-on, blending teacher guidance with tactile learning
- **"The Naturalist"** — child-led, nature-centered, flow-based

Final archetype names will be determined when dimension combinations are mapped against real philosophy patterns.

### Part 1 Results: "Your Education Compass"

Displayed immediately after Part 1 questions:

- **Archetype name and icon** — e.g., "The Explorer"
- **Five dimension bars** — visual sliders showing where they fall on each spectrum (with Structure/Flow split callout when applicable)
- **Philosophy blend pie chart** — percentages across the 8 philosophies with brief descriptions for top 2-3
- A note: *"Most educators are a blend — your compass reflects your natural tendencies, not a rigid category."*

---

## Part 2: Practical Preferences (6-8 questions)

Appears after the user sees their Part 1 compass results. Direct questions, not scenarios. Philosophy blend from Part 1 carries forward silently into the matching algorithm.

### Questions

1. **Subjects needed** — "Which subjects are you looking for curriculum for?" Multi-select: Literacy/Language Arts, Math, Science, Social Studies. *(Literacy and Math always shown in results; the others only if selected.)*

2. **Single vs. integrated** — "How do you prefer to organize your curriculum?" Options:
   - One program covering everything
   - Pick the best for each subject separately
   - Open to either

3. **Prep time (reality-grounded)** — "Think about a typical week. After everything else — work, meals, errands, life — how much time do you realistically have to prepare for teaching?"
   - Almost none — I need to open it and go
   - About 15-30 minutes per week
   - About 1-2 hours per week
   - I enjoy planning and will make the time — 3+ hours is fine

4. **Religious preference** — "Do you have a preference for faith-based or secular materials?"
   - Secular only
   - Faith-based (Christian)
   - Faith-based (other)
   - No preference

5. **Faith integration depth** *(only shown if faith-based selected)* — "How integrated should faith be in the curriculum?"
   - Woven into every subject and lesson
   - Christian worldview but subjects taught straightforwardly
   - Light integration — prayers or devotionals alongside standard content

6. **Budget** — "What's your budget range per subject per year?"
   - Under $50
   - $50–150
   - $150–300
   - Over $300
   - Not a factor

7. **Grade level(s)** — "What grade level(s) are you teaching?" Multi-select K–12 or range picker.

8. **Teaching setting** — "What best describes your setting?"
   - Home-based family
   - Co-op or learning group
   - Micro school
   - Small private school
   - Other

---

## Email Capture & Results Flow

### After Part 2 Completes — Archetype Teaser

Immediately show:
- Their archetype name + icon
- A one-sentence teaser — e.g., *"You're The Explorer — a child-led, hands-on educator who thrives on curiosity-driven learning."*

### Email Gate

> *"Enter your email to unlock your full Education Compass — detailed dimension breakdown, philosophy blend, and personalized curriculum recommendations."*
>
> `[Email input]`
>
> `[Unlock My Full Results]`

### After Email Submission

- Full results page loads with everything
- An email is sent with complete results — archetype graphic, dimension bars, philosophy chart, and curriculum recommendations with affiliate links
- For existing logged-in EduApp users: skip the email gate, results save to profile automatically

---

## Results Page

### Section 1: Your Education Compass

Always visible at the top as context for recommendations.

- Archetype name + icon + description
- Five dimension bars (with Structure/Flow split callout when applicable)
- Philosophy blend pie chart with top 2-3 described

### Section 2: Curriculum Matches

Matching algorithm scores each curriculum: **(philosophy alignment from Part 1 x practical filters from Part 2)**.

**If user selected "one program covering everything":**
- Integrated/all-in-one programs shown first as a comparison table
- Below: "Or build your own by subject" with per-subject tables

**If user selected "pick the best for each subject" or "open to either":**
- Per-subject comparison tables: Literacy first, then Math, then Science and Social Studies if selected

**Each comparison table shows 3-5 curricula with columns:**
- Curriculum name + one-line description
- Philosophy fit badge ("Strong match" / "Good match" / "Partial match")
- Prep level (open-and-go / light / moderate / heavy)
- Secular or faith-based label
- Grade range covered
- Price range
- Affiliate link button — "Learn More" or "See Pricing"

### Prep Mismatch Warnings

When philosophy points toward curricula requiring more prep than the user indicated:

> *"Your compass points toward Waldorf-adjacent approaches, which typically require significant preparation. Here are some Waldorf-inspired options adapted for lower prep, and some open-and-go alternatives that share similar values."*

### Section 3: Unschooling/Child-Led Results

If compass leans heavily toward Unschooling, curriculum recommendations are minimal. Instead:

> *"Your teaching style is inherently child-led — you don't need a boxed curriculum. You need a way to turn your child's interests into meaningful, standards-aligned lessons on the fly. That's exactly what EduApp does."*

CTA to sign up.

### Section 4: EduApp Pitch (for everyone)

> *"Have your foundational curriculum for literacy and math? Use EduApp to create interest-driven lessons for everything else — science, social studies, art, and whatever your child is curious about today. Built around your child's interests, aligned to your state standards, shaped by your teaching philosophy."*

For existing users: save compass results and selected curricula to profile.

---

## Curriculum Database

### Entry Structure

Each curriculum record contains:

| Field | Description |
|-------|-------------|
| name | Curriculum name |
| publisher | Publisher name |
| description | One-line description |
| subjects | Array: literacy, math, science, social_studies, or all-in-one |
| grade_range | e.g., K-6, K-12 |
| philosophy_scores | JSONB: 0-1 score against each of 8 philosophies |
| prep_level | open-and-go / light / moderate / heavy |
| religious_type | secular / christian / other |
| faith_depth | none / light / worldview / fully-integrated |
| price_range | per subject per year |
| quality_score | From review research (Cathy Duffy, Reddit, retailer ratings, blogs) |
| affiliate_url | Affiliate link |
| setting_fit | Array: individual, co-op, micro-school, private-school |
| notes | Caveats (e.g., "requires manipulatives kit sold separately") |

### Build Process

1. AI researches and compiles 30-50 curricula across literacy, math (primary), science, social studies (secondary), and integrated programs
2. For each: pull review sentiment, pricing, philosophy alignment, prep requirements, religious/secular status
3. Quality gate — only curricula with generally positive reviews and active availability make the cut
4. Editorial review — approve, reject, adjust tags, add affiliate links
5. Stored as structured data in Postgres `curricula` table, seeded from a curated JSON file

### Quality Gate

During research phase, each curriculum is evaluated for:
- Review sentiment from Cathy Duffy Reviews, Reddit (r/homeschool), retailer ratings, homeschool blogs
- Active availability (still in print/sold)
- Only curricula clearing the quality threshold enter the database
- No ongoing automated feedback loop — maintenance is manual/editorial

---

## App Integration

When an EduApp user has taken the compass:

- **Compass saved to profile** — archetype, dimension scores, philosophy blend
- **Selected curricula saved** — e.g., "I'm using Math-U-See for math and All About Reading for literacy"
- **Lesson generator respects curriculum selection** — When generating a math lesson, the app knows the user follows Math-U-See and generates supplemental, interest-driven lessons that complement it (reinforcing concepts, filling gaps, connecting to interests). The curriculum acts as a context/guardrail, not a replacement.
- **Philosophy carries through** — Compass philosophy becomes the default for lesson generation, no need to select per lesson
- **"Unlocked" subjects** — Subjects without a foundational curriculum selected are fully generated by the app using the child's interests and compass philosophy. This is the core EduApp value proposition.

---

## Technical Architecture

### Routes (Next.js)

- `/compass` — Landing/intro page explaining the quiz
- `/compass/quiz` — Multi-step quiz interface (Part 1 → compass reveal → Part 2 → archetype teaser → email gate → full results)
- `/compass/results` — Full results page (behind email gate for anonymous users)
- `/compass/results/:id` — Shareable/revisitable results via email link

### Frontend

- Quiz state managed client-side (React state)
- Scoring logic runs client-side — dimension scores and philosophy blend calculated from answer weights in real time
- Charts rendered with Recharts (pie chart for philosophy blend, bar charts for dimensions)
- No account needed until email capture or EduApp sign-up

### Backend (Next.js API routes)

- `POST /api/compass/submit` — Receives email + quiz results, stores in Postgres, triggers results email
- `GET /api/compass/results/:id` — Fetches saved results (for email link-back)
- `POST /api/compass/match` — Runs curriculum matching algorithm against database, returns ranked recommendations

### Database (Postgres — new tables)

```sql
compass_results
  id              UUID PRIMARY KEY
  email           VARCHAR
  archetype       VARCHAR
  dimension_scores JSONB    -- {structure: 72, modality: 35, ...}
  philosophy_blend JSONB    -- {montessori: 0.45, waldorf: 0.20, ...}
  part2_preferences JSONB   -- {subjects, prep_level, budget, ...}
  account_id      UUID FK (nullable, links to existing EduApp account)
  created_at      TIMESTAMP

curricula
  id              UUID PRIMARY KEY
  name            VARCHAR
  publisher       VARCHAR
  description     TEXT
  subjects        TEXT[]
  grade_range     VARCHAR
  philosophy_scores JSONB
  prep_level      VARCHAR
  religious_type  VARCHAR
  faith_depth     VARCHAR
  price_range     VARCHAR
  quality_score   FLOAT
  affiliate_url   VARCHAR
  setting_fit     TEXT[]
  notes           TEXT
  active          BOOLEAN DEFAULT true

compass_curriculum_picks
  id              UUID PRIMARY KEY
  compass_result_id UUID FK
  curriculum_id   UUID FK
  match_score     FLOAT
  subject         VARCHAR
```

### Matching Algorithm

```
For each curriculum in database:
  score = 0

  // Philosophy fit (weighted by Part 1 blend)
  for each philosophy:
    score += user_philosophy_weight x curriculum_philosophy_score

  // Hard filters (Part 2)
  if curriculum.religious_type doesn't match preference → exclude
  if curriculum.grade_range doesn't overlap user grades → exclude
  if curriculum.price > user budget → exclude

  // Soft scoring
  if curriculum.prep_level matches user prep → score += bonus
  if curriculum.setting_fit includes user setting → score += bonus
  if user wants integrated AND curriculum is all-in-one → score += bonus

  rank by score, return top 3-5 per subject
```

### Email Integration

Transactional email service (Resend, SendGrid, or similar) sends results email. Template includes archetype graphic, dimension bars, philosophy chart, and curriculum recommendations with affiliate links.

---

## Implementation Phases

### Phase 1: Curriculum Research (parallel)
- AI-assisted research of 30-50 curricula
- Tag each with all database fields
- Quality gate evaluation
- Output: curated JSON file ready for seeding

### Phase 2: Frontend & Backend Build (parallel with Phase 1)
- Database migration (new tables)
- Quiz UI (Part 1, Part 2, results page)
- Scoring engine (client-side)
- Charts and visualizations
- API routes for submit, match, results
- Email capture and transactional email

### Phase 3: Integration
- Connect curriculum JSON to database seed
- Wire matching algorithm to real data
- EduApp profile integration (save compass, selected curricula)
- Lesson generator curriculum awareness

### Phase 4: Editorial Review
- Review all curriculum entries
- Add affiliate links
- Finalize archetype names and descriptions
- QA the full flow
