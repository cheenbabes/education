---
title: Compass quiz
---

## KPIs (all time)

```sql compass_kpis
select
  count(*)::int as total_quizzes,
  count(account_id)::int as converted,
  case when count(*) > 0 then round(100.0 * count(account_id) / count(*)) else 0 end as conversion_pct
from railway.compass_results
```

<BigValue data={compass_kpis} value=total_quizzes title="Total quiz takers" />
<BigValue data={compass_kpis} value=converted title="Created account" />
<BigValue data={compass_kpis} value=conversion_pct title="Conversion rate" fmt=pct0 />

## Quiz completions per day (last 90d)

```sql quiz_daily
select date_trunc('day', created_at)::date as day, count(*)::int as quizzes
from railway.compass_results
where created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={quiz_daily} x=day y=quizzes lineColor=#9333ea />

## Archetype distribution (all time)

```sql archetypes
select archetype, count(*)::int as count from railway.compass_results
group by archetype order by count desc
```

<BarChart data={archetypes} x=archetype y=count />
