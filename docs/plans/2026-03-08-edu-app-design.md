# Edu App — MVP Design Document

## Problem

Homeschooling parents — especially new or overwhelmed ones — lack teacher training. They don't know what state standards are, which apply to their child's grade, or how to build a lesson plan that connects their child's interests to meaningful learning objectives. Tools like ChatGPT can generate lessons, but require the parent to already know what to ask for, produce inconsistent results, and offer no way to track progress over time.

## Solution

A web app that guides parents through generating high-quality, interest-driven lesson plans grounded in real state standards and educational philosophy frameworks. The app embeds the "teacher knowledge" so parents don't have to have it.

---

## Core Features (MVP)

### 1. User Accounts & Child Profiles

**Account level:**
- Email/password auth
- State selection (shared across all children)

**Child profiles (multiple per account):**
- Name
- Date of birth
- Grade level (may not match age for homeschoolers)
- State standards opt-in/opt-out

### 2. Lesson Generation

**Inputs (chosen fresh per lesson, not saved to profile):**
- Which child(ren) — supports multi-age
- Child's current interest (free text — dinosaurs, fire trucks, trees, etc.)
- Subject(s) — Math, Science, Language Arts, Social Studies
- Educational philosophy:
  - Flexible (no specific philosophy)
  - Waldorf-adjacent (with disclaimer about not perfectly aligning with traditional Waldorf sequencing)
  - Montessori-inspired
  - Project-based learning
  - Place/nature-based learning
- Multi-subject optimization toggle (opt-in to intentionally cover multiple subjects)

**Output — consistent template every time:**
- Title (engaging, interest-connected)
- Subject(s) covered
- Grade level(s)
- Standards addressed (if opted in, shown in plain language)
- Learning objectives ("Your child will be able to...")
- Materials needed (with household alternatives)
- Estimated duration
- Introduction/Hook (connecting to the child's interest)
- Main activity (step-by-step instructions for the parent)
- Discussion questions
- Assessment (informal, parent-friendly)
- Extensions (optional deeper activities)
- Educational philosophy alignment note

**Constraints:**
- No duplicate lessons — system checks past lessons per child and ensures meaningful difference
- Monthly horizon encouraged — app discourages bulk-generating a full year's lessons
- Age-appropriate regardless of standards opt-in — developmental milestones and grade level always inform difficulty

### 3. Calendar & Lesson Management

- Weekly calendar view — see each day's lessons for the month
- Drill down to day or week for full lesson details
- Multi-age lessons appear on all assigned children's records
- All generated lessons are saved permanently

### 4. Lesson Completion & Feedback

- **Rating IS the completion action** — parent taps lesson, star rating (1-5) appears
- Rating marks lesson complete and credits objectives to child(ren)
- Optional notes field after rating (free text — "she loved this", "too hard", "we modified it")
- Ratings + notes stored for future model training

### 5. State Standards Tracking (opt-in)

- Detailed checklist per subject per child — every standard in plain language, checked off as lessons cover them
- Multi-subject credit — one lesson can check off objectives across multiple subjects
- Natural overlap recognition (default) — app detects when a lesson naturally covers objectives in other subjects
- Intentional multi-subject optimization (opt-in toggle) — AI designs lessons to hit objectives across subjects
- Objectives can be revisited — "covered" doesn't mean locked
- App shows which objectives are covered and which remain
- Parents can fully opt out — standards tracking disappears completely

### 6. Age-Appropriateness (universal, not opt-in)

Even when standards are opted out, lessons are calibrated to the child's grade and age using developmental milestones. A reading level check validates generated content against the target grade level regardless of standards setting.

---

## Architecture

### Services (Railway)

```
Railway Project
├── web (Next.js + TypeScript) — UI, auth, calendar, profiles
├── kg-service (Python/FastAPI) — Kuzu graph DB + Claude API calls
└── postgres — user data, lessons, completion tracking, ratings
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + clean functional components (skinning deferred to UI Max Pro / Stitch / 21st.dev) |
| Auth | NextAuth.js (Auth.js) |
| Database | PostgreSQL (user data, lessons, tracking) |
| ORM | Prisma |
| Knowledge Graph | Kuzu (embedded graph DB, Python) |
| AI | Claude API (Anthropic) — Sonnet for generation, Haiku for validation |
| KG Service | Python / FastAPI |
| Hosting | Railway (all services) |

### Knowledge Graph (Kuzu)

**Purpose:** Store all domain knowledge — standards, philosophy principles, activity types, developmental milestones. Queried at runtime for zero-LLM-cost context retrieval.

**Node Types:**
- State
- Grade
- Subject
- Standard (hierarchical — domain > cluster > standard)
- Philosophy
- Principle (e.g., "outdoor observation", "sensory materials", "sustained inquiry")
- ActivityType (e.g., "nature walk", "hands-on building", "journaling")
- MaterialType (e.g., "natural materials", "measuring tools", "art supplies")
- DevelopmentalMilestone (age-based cognitive/motor/language benchmarks)

**Key Relationships:**
- State -[HAS_STANDARDS]-> Standard
- Standard -[FOR_GRADE]-> Grade
- Standard -[FOR_SUBJECT]-> Subject
- Standard -[OVERLAPS_WITH]-> Standard (cross-subject connections)
- Philosophy -[VALUES]-> Principle
- Principle -[SUGGESTS]-> ActivityType
- ActivityType -[USES]-> MaterialType
- Grade -[DEVELOPMENTAL_STAGE]-> DevelopmentalMilestone

**Ingestion Pipeline (designed for easy additions):**

```
docs/philosophy-references/<philosophy>/*.pdf
    │
    ▼
kg-service/ingest/extract.py
    ├── PDF text extraction (PyMuPDF/pdfplumber)
    ├── Claude extracts structured data → JSON
    │   (principles, activity types, material types, age ranges)
    └── Cached in kg-service/extracted/<philosophy>/
    │
    ▼
kg-service/ingest/rebuild.py
    ├── Hash detection (skip rebuild if unchanged)
    ├── Load static data (states, grades, subjects)
    ├── Load standards (Common Standards Project JSON)
    ├── Load extracted philosophy data
    └── Build Kuzu database
```

**Adding new documents:** Drop PDFs into the appropriate philosophy folder, run the extraction pipeline. The rebuild detects new files via hash comparison and rebuilds the graph.

### Standards Data

**Source:** Common Standards Project (JSON API, all 50 states)
**Coverage:** Common Core (ELA/Math), NGSS (Science), state-specific standards
**Gap:** Need to verify coverage for grades 9-12 and Social Studies across all states

### Philosophy Documents

**Current inventory (29 PDFs across 5 philosophies):**
- Flexible: Core Knowledge Sequence (K-8), CDC Milestones (birth-5), Core Knowledge Science (K-5)
- Waldorf-adjacent: 6 documents covering principles, development stages, curriculum guides
- Montessori-inspired: 7 documents including public domain originals, AMS principles, materials checklists
- Project-based learning: 6 documents including PBLWorks Gold Standard framework, MDRC literature review
- Place/nature-based: 6 documents including Natural Start Alliance guidebook, ERIC research papers

**Known gaps:**
- Flexible: Current docs only cover up to K-8. Need high school developmental/content references (grades 9-12). The Core Knowledge Sequence ends at grade 8 and CDC milestones end at age 5.
- Waldorf: Need more upper grades content
- All philosophies: Will be supplemented by the founder's own EdD-informed documents

**The ingestion pipeline is designed to easily add new documents** — drop PDFs in the folder and re-run extraction.

### Lesson Generation Pipeline

```
Parent input (interest, subject, grade, philosophy, children)
    │
    ▼
Postgres: fetch child profiles, past lessons (for dedup check)
    │
    ▼
Kuzu Graph Traversal (<100ms, $0)
    ├── Standards for state/grade/subject (if opted in)
    ├── Philosophy principles + preferred activity types
    ├── Developmental milestones for age
    ├── Cross-subject standard overlaps
    └── Past lesson signatures (dedup)
    │
    ▼
LLM Call — Sonnet (the creative step, ~$0.04)
    Input: all graph context + interest + constraints
    Output: complete lesson plan following template
    │
    ▼
Validation — Haiku (~$0.004)
    ├── Standards codes match real ones in graph
    ├── Reading level appropriate for grade
    ├── Activities align with philosophy
    └── Age-appropriate content check
    │
    ▼
Postgres: save lesson, link to children, map objectives
```

**Cost per lesson: ~$0.04-0.06**

### Multi-Age Lesson Handling

When multiple children are selected:
1. Graph retrieves standards for EACH child's grade level
2. LLM designs activities that work across the age range
3. Each child gets their own objective mappings at their grade level
4. Lesson appears on all selected children's records

---

## Data Model (Postgres)

### Tables

**accounts**
- id, email, password_hash, state, created_at, updated_at

**children**
- id, account_id, name, date_of_birth, grade_level, standards_opt_in, created_at, updated_at

**lessons**
- id, account_id, title, interest, philosophy, subjects (array), content (JSONB — full lesson plan), multi_subject_optimized, created_at
- content_hash (for dedup detection)

**lesson_children** (junction — multi-age support)
- lesson_id, child_id

**lesson_objectives** (which objectives a lesson covers, per child)
- id, lesson_id, child_id, standard_id (references KG), subject, description_plain

**completions**
- id, lesson_id, child_id, star_rating (1-5), notes (text), completed_at

**calendar_entries**
- id, lesson_id, scheduled_date, account_id

---

## Pricing

At ~$0.05/lesson and 5 lessons/week/child (20/month/child):

| Tier | Price | Children | Lessons/mo | AI Cost | Margin |
|------|-------|----------|------------|---------|--------|
| Starter | $9.99/mo | 1 | 20 | $1.00 | ~90% |
| Family | $29.99/mo | 3 | 60 | $3.00 | ~90% |
| Unlimited | $79.99/mo | Unlimited | ~150 | $7.50 | ~91% |

---

## Deferred to V2

- Onboarding flow / first-time user experience
- Sharing / exporting (PDF export, co-parent sharing, co-op groups)
- Monetization infrastructure (Stripe integration)
- Social features (sharing lesson plans between families)
- Mobile app (wrap web app)
- Fine-tuning on rated lesson data
- Batch generation API for cost reduction
