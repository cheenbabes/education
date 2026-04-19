# Metrics Dashboard Design

Date: 2026-04-19

## Goal

Internal analytics across two surfaces:

1. **In-app** `/admin/metrics` — live, admin-only, queries Prisma directly.
2. **Local / shareable** — Evidence.dev project at `metrics/` that generates a static site. Same SQL, founder-friendly output.

Not a replacement for PostHog (product analytics). This is database-truth: lessons created, costs incurred, quiz archetypes, feedback. Things that live in Postgres.

## Architecture

### In-app

- Route: `web/src/app/admin/metrics/page.tsx`, server component.
- Auth: gate on `User.role === "admin"`. Non-admins get `notFound()`.
- Tabs: Growth · Cost · Engagement · Compass · Mix · Quality. Selected via `?tab=`.
- Date range: `?range=7d|30d|90d|all`. Default 30d.
- Charts: Recharts (already installed).
- Performance: parallel `Promise.all` over per-tab query modules. No caching — table sizes small.

### Local Evidence

- Folder: `metrics/` at repo root.
- Connects to Railway Postgres via `DATABASE_URL` env var.
- `npm run dev` for live preview, `npm run build` for static HTML to share.

### Shared SQL

Queries written once in `metrics/queries/*.sql` and mirrored (or imported) by the in-app query modules. Prisma's `$queryRaw` runs them verbatim.

## Metric catalog

### Growth
- KPIs: total users, users last 7d (%Δ prior 7d), total lessons, lessons last 7d, total quiz takers
- New users / day
- New lessons / day
- New quiz takers / day
- Cumulative users
- DAU proxy (distinct `Lesson.userId` per day)

### Cost
- KPIs: total spend 30d, avg cost / lesson, avg cost / worksheet, cost / active user 30d
- Daily AI spend split (lessons vs worksheets)
- Top 10 most expensive users
- Rolling 7d avg cost / lesson

### Engagement
- KPIs: completion rate, avg star rating, favorites rate, % lessons scheduled
- Lessons completed / day
- Star rating distribution
- Lessons-per-user histogram
- Calendar scheduling rate over time

### Compass funnel
- KPIs: total quiz takers, quiz→account conversion %, top archetype
- Archetype distribution
- Quiz completions / day
- Conversion funnel (quiz → account)
- Top philosophy blends

### Product mix
- Philosophy breakdown
- Subject popularity (from `subjectNames[]` via `unnest`)
- Grade-level distribution (from `Child.gradeLevel`)
- Multi-subject optimization rate
- User state distribution

### Quality
- KPIs: low-rating count (≤2), open feedback, dedup rate
- Feedback by category / day
- Recent feedback table (last 20)
- Dedup rate (`COUNT(*) - COUNT(DISTINCT contentHash)`)
- Low-rated lessons table

## File layout

```
web/src/app/admin/metrics/
  page.tsx
  _components/{kpi-card,daily-line-chart,bar-chart,data-table}.tsx
  _queries/{growth,cost,engagement,compass,mix,quality}.ts
  _lib/{range,admin-guard}.ts

metrics/                         # repo root
  package.json                   # evidence
  sources/railway/connection.yaml
  pages/{index,growth,cost,engagement,compass,mix,quality}.md
  queries/*.sql
  README.md
```

## Build order

1. Design doc (this file).
2. Foundation — `/admin/metrics` shell, page-level admin guard, tabs, range selector.
3. Growth tab end-to-end — proves the pattern.
4. Remaining tabs.
5. Evidence scaffold + port queries + README.

## Out of scope for v1

- No caching / materialized views. Add later if queries slow.
- No cohort or funnel analysis beyond simple conversion %.
- No retention curves (needs more event data — PostHog territory).
- No alerting.
