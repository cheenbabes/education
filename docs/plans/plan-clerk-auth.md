# Clerk Authentication Integration Plan

## Overview
Integrate Clerk for user authentication across the app. Currently using hardcoded `userId: "demo-user"`.

We should inetgreate with Facebook and Google to start. do not allow username / password

We should also add a little badge to the top nav to show thge user's picture / name

## Pages Requiring User Identity

### Must-Have (Core Functionality)
1. **Lessons Page** (`/lessons`) — track lesson count per user, enforce tier limits
2. **Create Page** (`/create`) — count generations against monthly limits
3. **Children Page** (`/children`) — each user's children are private
4. **Dashboard** (`/dashboard`) — user-specific data
5. **Standards Page** (`/standards`) — per-child progress tracking
6. **Calendar Page** (`/calendar`) — user-specific lesson schedule

### Should-Have (Enhanced Experience)
7. **Compass Quiz** (`/compass/quiz`) — save quiz results to user profile
8. **Compass Results** (`/compass/results`) — persist archetype, load on return
9. **Explore Map** (`/explore`) — highlight user's archetype pathways/stars, show personalized curriculum matches

### Nice-to-Have
10. **Home Page** (`/`) — show "Welcome back" vs "Get Started" based on auth state
11. **Pricing Section** — show current plan, link to upgrade

## Implementation Approach

### 1. Install & Configure
```bash
npm install @clerk/nextjs
```
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env`
- Wrap app in `<ClerkProvider>` in `layout.tsx`

### 2. Middleware
Create `middleware.ts` at project root:
- Public routes: `/`, `/compass`, `/archetypes`, `/explore`, `/about`, `/contact`
- Protected routes: `/lessons`, `/create`, `/children`, `/dashboard`, `/standards`, `/calendar`

### 3. Replace `userId: "demo-user"`
Files that hardcode userId and need Clerk's `auth()` or `useUser()`:
- `src/app/api/lessons/route.ts` (GET + POST)
- `src/app/api/lessons/[id]/route.ts`
- `src/app/api/lessons/[id]/complete/route.ts`
- `src/app/api/lessons/[id]/favorite/route.ts`
- `src/app/api/children/route.ts`
- `src/app/api/standards/route.ts`
- `src/app/lessons/page.tsx` (fetch call)
- `src/app/dashboard/page.tsx` (fetch call)
- `src/app/create/page.tsx` (save call)

### 4. Database
- The `User` model already exists in Prisma schema
- On first Clerk sign-in, create a User record via Clerk webhook or on-demand
- Map Clerk's `userId` to the Prisma `User.id`

### 5. Tier Enforcement
- Store subscription tier in User model or Clerk metadata
- Check lesson count in POST /api/lessons before generating
- Compass: 3/month, Homestead: 30/month, Schoolhouse: 100/month

## Migration Path
1. Install Clerk, wrap in provider (no breaking changes)
2. Add middleware with all routes public initially
3. Add sign-in/sign-up pages
4. Gradually protect routes and replace userId
5. Add tier enforcement last
