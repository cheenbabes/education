---
title: Sages Compass — Internal Metrics
---

Snapshot of database-truth metrics. Updated on every build.

## Sections

- [Growth](/growth) — users, lessons, quiz takers, DAU
- [Cost](/cost) — AI spend, per-lesson, top spenders
- [Engagement](/engagement) — completion rate, star ratings, power users
- [Compass](/compass) — quiz funnel, archetypes
- [Product mix](/mix) — philosophy, subjects, grades, states
- [Quality](/quality) — feedback, low ratings, dedup

```sql totals
select
  (select count(*) from railway.users) as users,
  (select count(*) from railway.lessons) as lessons,
  (select count(*) from railway.compass_results) as quiz_takers,
  (select count(*) from railway.worksheets) as worksheets
```

<BigValue data={totals} value=users title="Total users" />
<BigValue data={totals} value=lessons title="Total lessons" />
<BigValue data={totals} value=quiz_takers title="Quiz takers" />
<BigValue data={totals} value=worksheets title="Worksheets" />
