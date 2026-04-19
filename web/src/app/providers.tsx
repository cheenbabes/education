"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";

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
