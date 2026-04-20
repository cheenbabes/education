"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string | number | boolean | null | undefined | string[]>;
};

/**
 * Client-only <Link> wrapper that fires a PostHog event on click. Lets
 * server components emit analytics without being converted to client
 * components wholesale. Use for primary CTAs, nav items, or any link
 * where we care about the click in addition to the landing pageview.
 */
export function TrackedLink({ event, eventProps, onClick, children, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
