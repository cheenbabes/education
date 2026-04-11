# KG Service Cleanup Follow-Up Plan

**Context:** Review of commit `429b7a4` (`security: route all kg-service calls through Next.js API with Clerk auth`).

**Goal:** Finish the security cleanup after moving KG service traffic behind the web app and making the KG service internal-only.

**Assumption:** Railway/private-networking work to remove the KG service public domain is being handled separately outside this repo.

**Reviewed related commits after initial draft:**

- `429b7a4` routed lesson generation and some standards lookups through authenticated Next.js API routes
- `b296f8f` added canonical host redirects and centralized site-origin handling
- `d7933ba` expanded KG service CORS defaults for production hostnames

**Result:** Those commits improved networking and host handling, but they did not by themselves fix the remaining standards ownership, generation-quota, or downstream-error issues. `/api/audit` also remained public, but that route was intentionally left unchanged in the implementation pass below to preserve the current public/private API surface.

---

## What The Commit Fixed

- Browser no longer calls `NEXT_PUBLIC_KG_SERVICE_URL` directly from lesson creation
- `POST /api/lessons/generate` proxies lesson generation through Next.js with Clerk auth
- `GET /api/standards/lookup` requires auth
- `POST /api/standards/search` requires auth
- Web code prefers server-only `KG_SERVICE_URL` env usage instead of browser-exposed KG URLs

---

## Status After Implementation

**Implemented in the web app:**

- Standards routes now enforce child ownership before returning progress or coverage data
- `POST /api/lessons/generate` now enforces the existing monthly lesson quota before calling the KG service
- `POST /api/lessons/generate` now returns sanitized client-safe errors instead of raw downstream failure text
- The lesson creation page now handles early monthly-limit responses and sanitized generation failures cleanly

**Intentionally not changed in this pass:**

- `/api/audit` remains public because the request was to avoid changing the current public/private API surface
- Additional burst throttling beyond the existing monthly lesson quota was not added for the same reason
- Global middleware behavior for `/api/*` routes was not changed in this pass

---

## Remaining Gaps

### 1. `GET /api/audit` is still public

**Severity:** Medium

**Problem:** The route remains publicly callable. This was left unchanged intentionally to preserve current behavior, but it is still a security/product-surface decision to revisit if `/audit` is meant to be internal tooling.

**Affected files:**

- `web/src/app/api/audit/route.ts`
- `web/middleware.ts`

**Impact:**

- Anonymous callers can still hit a KG-backed internal tooling route
- If `/audit` is meant to be staff-only, it is still exposed

**Fix options:**

- Add auth to `GET /api/audit`
- Or remove/disable `/audit` in production
- Or leave it public intentionally and treat it as a supported surface

---

### 2. Additional burst throttling for `POST /api/lessons/generate` is still optional

**Severity:** Medium

**Problem:** Monthly lesson quotas now apply before KG generation, but there is still no separate short-window burst throttle.

**Affected files:**

- `web/src/app/api/lessons/generate/route.ts`

**Impact:**

- High-frequency abuse within a valid monthly quota is still theoretically possible

**Fix:**

- Add burst throttling only if you are willing to change current request behavior for heavy users

---

## Follow-Up Tasks

1. Decide whether `/api/audit` should remain public or be gated/removed.
2. If you want stronger anti-abuse controls, add a separate burst throttle to `POST /api/lessons/generate` in a behavior-changing pass.
3. Revisit middleware so `/api/*` is protected by default and public routes are explicitly allowlisted, but only as a deliberate API-surface change.

---

## Suggested Verification

1. Signed-in user A should get `403` or `404` when requesting user B's `childId` on:
   - `/api/standards`
   - `/api/standards/search`
2. Users at their monthly lesson cap should get `429 monthly_limit` from `/api/lessons/generate` before the KG service is called.
3. Forced KG failure should return a generic client-safe error, while detailed context stays in logs.
4. Repeated anonymous access to `/api/audit` should still behave exactly as it does today until that route is intentionally changed.
