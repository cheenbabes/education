---
title: Product mix
---

## Philosophy breakdown (last 30d)

```sql philosophy
select philosophy, count(*)::int as count from railway.lessons
where created_at >= current_date - interval '30 days'
group by philosophy order by count desc
```

<BarChart data={philosophy} x=philosophy y=count />

## Subject popularity — top 15 (last 30d)

```sql subjects
with exploded as (
  select unnest(string_split(subject_names_joined, '|')) as subject
  from railway.lessons
  where created_at >= current_date - interval '30 days' and subject_names_joined != ''
)
select subject, count(*)::int as count from exploded
where subject != ''
group by subject order by count desc limit 15
```

<BarChart data={subjects} x=subject y=count />

## Grade level distribution (children)

```sql grades
select grade_level as grade, count(*)::int as count from railway.children
group by 1
order by case grade_level when 'K' then 0 else try_cast(grade_level as int) end
```

<BarChart data={grades} x=grade y=count />

## User state distribution — top 15

```sql states
select coalesce(state, '—') as state, count(*)::int as count from railway.users
group by 1 order by count desc limit 15
```

<BarChart data={states} x=state y=count />

## Multi-subject rate (last 30d)

```sql multi
select
  count(*)::int as total,
  count(*) filter (where multi_subject_optimized)::int as multi,
  case when count(*) > 0 then round(100.0 * count(*) filter (where multi_subject_optimized) / count(*)) else 0 end as multi_pct
from railway.lessons where created_at >= current_date - interval '30 days'
```

<BigValue data={multi} value=multi_pct title="Multi-subject rate" fmt=pct0 />
<BigValue data={multi} value=total title="Total lessons (30d)" />
