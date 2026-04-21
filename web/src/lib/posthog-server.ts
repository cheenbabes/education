import { PostHog } from "posthog-node";

import type { AnalyticsEvent } from "./analytics";

// Server-side PostHog singleton. Reused across: analytics event capture,
// feature-flag evaluation, and anywhere else a server context needs PostHog.
//
// Flush behavior: we set flushAt=1 + flushInterval=0 so events ship on the
// next tick. Next.js route handlers can fire-and-forget; captureServerEvent
// awaits nothing by default, but you can await shutdownPostHog() if you want
// to guarantee delivery before the process exits (rarely needed — Node keeps
// the event loop alive until the queue drains).

let _client: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  if (_client) return _client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  _client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return _client;
}

type EventProps = Record<string, string | number | boolean | null | undefined | string[]>;

/**
 * Capture a server-side PostHog event. Never throws — analytics must never
 * break a request. `distinctId` should be the Clerk user id for authed flows,
 * or the anonymous compass sessionId for pre-signup flows (so stitching works
 * after the anon user identifies).
 */
export function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  props?: EventProps,
): void {
  try {
    const client = getPostHogServerClient();
    if (!client) return;
    client.capture({ distinctId, event, properties: props });
  } catch {
    /* never let analytics break a request */
  }
}

export async function shutdownPostHog(): Promise<void> {
  if (!_client) return;
  await _client.shutdown();
  _client = null;
}
