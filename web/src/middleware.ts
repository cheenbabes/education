import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/compass(.*)",          // includes /compass/sample/[philosophy]
  "/archetypes(.*)",
  "/explore(.*)",
  "/create",               // anon can reach the form; server still gates lesson creation
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/data-deletion",
  "/curriculum(.*)",       // public: full curriculum browser linked from compass results
  "/curriculum-review",
  "/api/webhooks/(.*)",
  "/api/contact",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
