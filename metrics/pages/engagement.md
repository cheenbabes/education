---
title: Engagement
---

## KPIs (last 30 days)

```sql eng_kpis
with l as (select count(*)::int as n from railway.lessons where created_at >= current_date - interval '30 days'),
     c as (select count(*)::int as n, coalesce(avg(star_rating),0)::double as avg_stars
             from railway.completions where completed_at >= current_date - interval '30 days'),
     f as (select count(*)::int as n from railway.lessons
             where favorite = true and created_at >= current_date - interval '30 days'),
     s as (select count(distinct ce.lesson_id)::int as n
             from railway.calendar_entries ce join railway.lessons ll on ll.id = ce.lesson_id
             where ll.created_at >= current_date - interval '30 days')
select
  case when l.n > 0 then round(100.0 * c.n / l.n) else 0 end as completion_pct,
  round(c.avg_stars, 2) as avg_stars,
  case when l.n > 0 then round(100.0 * f.n / l.n) else 0 end as favorites_pct,
  case when l.n > 0 then round(100.0 * s.n / l.n) else 0 end as scheduled_pct
from l, c, f, s
```

<BigValue data={eng_kpis} value=completion_pct title="Completion rate" fmt=pct0 />
<BigValue data={eng_kpis} value=avg_stars title="Avg stars (1-5)" />
<BigValue data={eng_kpis} value=favorites_pct title="Favorites rate" fmt=pct0 />
<BigValue data={eng_kpis} value=scheduled_pct title="% scheduled" fmt=pct0 />

## Lessons completed per day (last 90d)

```sql completions_daily
select date_trunc('day', completed_at)::date as day, count(*)::int as completions
from railway.completions
where completed_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={completions_daily} x=day y=completions lineColor=#16a34a />

## Star rating distribution (all time)

```sql star_dist
select cast(star_rating as text) as stars, count(*)::int as completions
from railway.completions group by star_rating order by star_rating
```

<BarChart data={star_dist} x=stars y=completions />

## Lessons per user (distribution, all time)

```sql per_user
with counts as (select user_id, count(*)::int as n from railway.lessons group by user_id),
bucketed as (
  select case
    when n = 1 then '1'
    when n between 2 and 3 then '2-3'
    when n between 4 and 6 then '4-6'
    when n between 7 and 15 then '7-15'
    else '16+'
  end as bucket,
  case
    when n = 1 then 1
    when n between 2 and 3 then 2
    when n between 4 and 6 then 3
    when n between 7 and 15 then 4
    else 5
  end as sort
  from counts
)
select bucket, min(sort) as sort, count(*)::int as users from bucketed
group by bucket order by min(sort)
```

<BarChart data={per_user} x=bucket y=users />
