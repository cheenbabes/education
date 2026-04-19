# Local Metrics Dashboard

Evidence.dev dashboard backed by the app's Postgres DB. Same metrics as `/admin/metrics`, rendered as a static site you can share.

## Setup

```bash
cd metrics
npm install
cp .env.example .env
# edit .env with your DB connection details
```

## Run locally (live dev)

```bash
npm run sources   # refresh data from Postgres
npm run dev       # opens http://localhost:3000
```

## Build & share

```bash
npm run sources
npm run build     # outputs static site to build/
npm run preview   # serve the built site locally
```

The `build/` directory is a static site — zip + send, deploy to Vercel/Netlify, or host on Railway as a static service.

## Data sources

`sources/railway/connection.yaml` reads Postgres from env vars (see `.env.example`).

- **Local** → point at `localhost:5433` (docker-compose Postgres)
- **Prod** → copy pieces from Railway's `DATABASE_URL`

⚠️ When pointing at prod, queries are read-only but run live. Be mindful of load during business hours.

## Pages

- `pages/index.md` — landing + global totals
- `pages/growth.md` — users, lessons, quiz takers, DAU
- `pages/cost.md` — AI spend, top spenders
- `pages/engagement.md` — completion rate, stars, power users
- `pages/compass.md` — quiz funnel, archetypes
- `pages/mix.md` — philosophy, subjects, grades, states
- `pages/quality.md` — feedback, low ratings, dedup

Queries live inline in each markdown page (Evidence convention).
