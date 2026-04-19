---
title: Cost
---

## KPIs (last 30 days)

```sql spend_kpis
with lesson_agg as (
  select coalesce(sum(generation_cost_usd), 0)::double as total, count(generation_cost_usd)::int as cnt
  from railway.lessons where created_at >= current_date - interval '30 days'
),
ws_agg as (
  select coalesce(sum(cost_usd), 0)::double as total, count(cost_usd)::int as cnt
  from railway.worksheets where created_at >= current_date - interval '30 days'
),
active as (
  select count(distinct user_id)::int as n from railway.lessons where created_at >= current_date - interval '30 days'
)
select
  l.total + w.total as total_spend,
  case when l.cnt > 0 then l.total / l.cnt else 0 end as avg_per_lesson,
  case when w.cnt > 0 then w.total / w.cnt else 0 end as avg_per_worksheet,
  case when a.n > 0 then (l.total + w.total) / a.n else 0 end as cost_per_active_user
from lesson_agg l, ws_agg w, active a
```

<BigValue data={spend_kpis} value=total_spend title="Total spend (30d)" fmt=usd2 />
<BigValue data={spend_kpis} value=avg_per_lesson title="Avg / lesson" fmt=usd2 />
<BigValue data={spend_kpis} value=avg_per_worksheet title="Avg / worksheet" fmt=usd2 />
<BigValue data={spend_kpis} value=cost_per_active_user title="Cost / active user" fmt=usd2 />

## Daily AI spend (lessons vs worksheets, last 90d)

```sql daily_spend
select day,
       coalesce(sum(case when kind='lesson' then cost end), 0)::double as lessons,
       coalesce(sum(case when kind='worksheet' then cost end), 0)::double as worksheets
from (
  select date_trunc('day', created_at)::date as day, generation_cost_usd as cost, 'lesson' as kind
    from railway.lessons where generation_cost_usd is not null and created_at >= current_date - interval '90 days'
  union all
  select date_trunc('day', created_at)::date, cost_usd, 'worksheet'
    from railway.worksheets where cost_usd is not null and created_at >= current_date - interval '90 days'
) x
group by 1 order by 1
```

<BarChart data={daily_spend} x=day y={['lessons','worksheets']} type=stacked />

## Top 10 most expensive users (last 30d)

```sql top_users
with costs as (
  select user_id, coalesce(sum(generation_cost_usd),0)::double as total,
         count(generation_cost_usd)::int as n_lessons, 0 as n_ws
    from railway.lessons where generation_cost_usd is not null
      and created_at >= current_date - interval '30 days'
    group by user_id
  union all
  select user_id, coalesce(sum(cost_usd),0)::double, 0, count(cost_usd)::int
    from railway.worksheets where cost_usd is not null
      and created_at >= current_date - interval '30 days'
    group by user_id
)
select u.email,
       sum(c.n_lessons)::int as lessons,
       sum(c.n_ws)::int as worksheets,
       sum(c.total)::double as total_cost
  from costs c join railway.users u on u.id = c.user_id
  group by u.id, u.email
  order by total_cost desc
  limit 10
```

<DataTable data={top_users}>
  <Column id=email />
  <Column id=lessons align=right />
  <Column id=worksheets align=right />
  <Column id=total_cost fmt=usd2 align=right />
</DataTable>
