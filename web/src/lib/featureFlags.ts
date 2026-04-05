import { PostHog } from "posthog-node";

// ── Client-side ─────────────────────────────────────────────────────────────
// In React components, use:
//   import { useFeatureFlagEnabled } from "posthog-js/react";
//   const worksheetsEnabled = useFeatureFlagEnabled("worksheets_enabled");

// ── Server-side (API routes) ────────────────────────────────────────────────
let _client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
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

export async function isWorksheetsEnabled(userId: string): Promise<boolean> {
  const client = getPostHogClient();
  if (!client) return false;
  const enabled = await client.isFeatureEnabled("worksheets_enabled", userId);
  return enabled === true;
}
