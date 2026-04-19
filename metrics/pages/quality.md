---
title: Quality
---

## KPIs

```sql qual_kpis
with dedup as (
  select count(*)::int as total, count(distinct content_hash)::int as distinct_hashes from railway.lessons
),
low as (select count(*)::int as n from railway.completions where star_rating <= 2),
fb as (select count(*)::int as n from railway.feedback where id != '__placeholder__')
select
  low.n as low_rated,
  fb.n as total_feedback,
  (dedup.total - dedup.distinct_hashes) as duplicate_lessons,
  case when dedup.total > 0 then round(100.0 * (dedup.total - dedup.distinct_hashes) / dedup.total) else 0 end as dedup_pct
from dedup, low, fb
```

<BigValue data={qual_kpis} value=low_rated title="Low-rated (≤2★)" />
<BigValue data={qual_kpis} value=total_feedback title="Total feedback" />
<BigValue data={qual_kpis} value=duplicate_lessons title="Duplicate lessons" />
<BigValue data={qual_kpis} value=dedup_pct title="Dedup rate" fmt=pct0 />

## Feedback by category per day (last 90d)

```sql feedback_daily
select date_trunc('day', created_at)::date as day,
       coalesce(sum(case when category='bug' then 1 end),0)::int as bug,
       coalesce(sum(case when category='feature' then 1 end),0)::int as feature,
       coalesce(sum(case when category='general' then 1 end),0)::int as general
from railway.feedback
where id != '__placeholder__' and created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<BarChart data={feedback_daily} x=day y={['bug','feature','general']} type=stacked />

## Recent feedback (last 20)

```sql recent_feedback
select created_at::date as date, category, email, left(message, 120) as message
from railway.feedback where id != '__placeholder__' order by created_at desc limit 20
```

<DataTable data={recent_feedback} rows=20>
  <Column id=date />
  <Column id=category />
  <Column id=email />
  <Column id=message wrap=true />
</DataTable>

## Low-rated completions (last 30d)

```sql low_rated
select c.completed_at::date as date, c.star_rating as stars,
       l.philosophy as philosophy, coalesce(c.notes, '—') as notes
from railway.completions c join railway.lessons l on l.id = c.lesson_id
where c.star_rating <= 2 and c.completed_at >= current_date - interval '30 days'
order by c.completed_at desc
```

<DataTable data={low_rated}>
  <Column id=date />
  <Column id=stars align=right />
  <Column id=philosophy />
  <Column id=notes wrap=true />
</DataTable>
