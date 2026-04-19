---
title: Growth
---

## KPIs

```sql kpis
select
  (select count(*) from railway.users where created_at >= current_date - interval '30 days') as new_users_30d,
  (select count(*) from railway.lessons where created_at >= current_date - interval '30 days') as new_lessons_30d,
  (select count(*) from railway.compass_results where created_at >= current_date - interval '30 days') as new_quizzes_30d,
  (select count(*) from railway.users where created_at >= current_date - interval '7 days') as new_users_7d,
  (select count(*) from railway.lessons where created_at >= current_date - interval '7 days') as new_lessons_7d
```

<BigValue data={kpis} value=new_users_30d title="New users (30d)" />
<BigValue data={kpis} value=new_users_7d title="New users (7d)" />
<BigValue data={kpis} value=new_lessons_30d title="New lessons (30d)" />
<BigValue data={kpis} value=new_lessons_7d title="New lessons (7d)" />
<BigValue data={kpis} value=new_quizzes_30d title="Quiz takers (30d)" />

## New users per day (last 90d)

```sql new_users_daily
select date_trunc('day', created_at)::date as day, count(*)::int as users
from railway.users
where created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={new_users_daily} x=day y=users />

## New lessons per day (last 90d)

```sql new_lessons_daily
select date_trunc('day', created_at)::date as day, count(*)::int as lessons
from railway.lessons
where created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={new_lessons_daily} x=day y=lessons lineColor=#16a34a />

## New quiz takers per day (last 90d)

```sql new_quizzes_daily
select date_trunc('day', created_at)::date as day, count(*)::int as quizzes
from railway.compass_results
where created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={new_quizzes_daily} x=day y=quizzes lineColor=#9333ea />

## Daily active users (distinct lesson creators)

```sql dau
select date_trunc('day', created_at)::date as day,
       count(distinct user_id)::int as dau
from railway.lessons
where created_at >= current_date - interval '90 days'
group by 1 order by 1
```

<LineChart data={dau} x=day y=dau lineColor=#d97706 />

## Cumulative users

```sql cumulative
with daily as (
  select date_trunc('day', created_at)::date as day, count(*) as c from railway.users group by 1
)
select day, sum(c) over (order by day)::int as total_users from daily
where day >= current_date - interval '180 days' order by day
```

<AreaChart data={cumulative} x=day y=total_users />
