# Parking Lot

Items deferred for later — not forgotten, just not now.

---

## Performance & Caching

**Problem:** Pages take 800ms–1s+ to load locally. Multiple causes:
1. `next dev` JIT compilation (dev-only artifact — production is much faster)
2. 3–4 uncached parallel API calls per page mount (`/api/user`, `/api/user/tier`, `/api/user/archetype`, `/api/children`)
3. No client-side caching — every navigation refetches cold
4. No performance monitoring — flying blind

**Planned fixes (do in this order):**
1. Add timing middleware to all API routes — logs `[GET /api/lessons] 234ms` — diagnose before optimizing
2. Consolidate `/api/user` + `/api/user/tier` + `/api/user/archetype` into `/api/user/profile` — one DB query instead of three
3. Add SWR or React Query for stale-while-revalidate client caching (tier + archetype change rarely)
4. Next.js `cache()` / server components for data that doesn't need client-side reactivity

**Notes:** Verify production performance first — most of the local slowness is dev-mode JIT compilation and won't exist in production.
