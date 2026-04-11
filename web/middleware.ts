import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isLegacySiteHost, SITE_HOSTNAME } from "@/lib/site";

const isPublicRoute = createRouteMatcher([
  "/",
  "/compass(.*)",
  "/archetypes(.*)",
  "/explore(.*)",
  "/about",
  "/contact",
  "/api/contact",
  "/api/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const canonicalRedirect = redirectToCanonicalHost(req);
  if (canonicalRedirect) return canonicalRedirect;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

function redirectToCanonicalHost(req: NextRequest) {
  if (!["GET", "HEAD"].includes(req.method) || req.nextUrl.pathname.startsWith("/api")) {
    return null;
  }

  const incomingHost =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;
  const hostname = incomingHost.split(",")[0]?.trim().split(":")[0];

  if (!isLegacySiteHost(hostname)) {
    return null;
  }

  const url = req.nextUrl.clone();
  url.protocol = "https";
  url.host = SITE_HOSTNAME;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
