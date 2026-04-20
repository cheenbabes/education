"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";
import { track } from "@/lib/analytics";

// Tracks pageviews on client-side navigation (required for Next.js App Router)
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      ph.capture("$pageview", { $current_url: window.location.href });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

// Identifies the logged-in Clerk user in PostHog
function PostHogIdentify() {
  const { user } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (user && ph) {
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
      // Fire signup_completed once per account, only for freshly-created
      // users (within the last 10 minutes). Combine Clerk's createdAt with a
      // localStorage marker so repeat logins on a second device don't re-fire.
      try {
        const created = user.createdAt ? new Date(user.createdAt).getTime() : 0;
        const fresh = created > 0 && Date.now() - created < 10 * 60 * 1000;
        const key = `ph_signup_seen_${user.id}`;
        if (fresh && !localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          track("signup_completed", {
            user_id: user.id,
            has_email: !!user.primaryEmailAddress?.emailAddress,
          });
        }
      } catch { /* ignore storage errors */ }
    } else if (!user && ph) {
      ph.reset();
    }
  }, [user, ph]);

  return null;
}

// On login, claim any anonymous compass submissions from this browser's sessionId.
// Runs once per mount; server is idempotent.
function CompassSessionLinker() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const sessionId = typeof window !== "undefined" ? localStorage.getItem("compass_session_id") : null;
    if (!sessionId) return;
    fetch("/api/compass/link-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  }, [user]);

  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        capture_pageview: false, // handled by PostHogPageView
        capture_pageleave: true,
        person_profiles: "identified_only", // no anonymous profiles — better privacy
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify />
      <CompassSessionLinker />
      {children}
    </PostHogProvider>
  );
}
