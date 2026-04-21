import { getPostHogServerClient } from "./posthog-server";

// ── Client-side ─────────────────────────────────────────────────────────────
// In React components, use:
//   import { useFeatureFlagEnabled } from "posthog-js/react";
//   const worksheetsEnabled = useFeatureFlagEnabled("worksheets_enabled");

// ── Server-side (API routes) ────────────────────────────────────────────────
export async function isWorksheetsEnabled(userId: string): Promise<boolean> {
  const client = getPostHogServerClient();
  if (!client) return false;
  const enabled = await client.isFeatureEnabled("worksheets_enabled", userId);
  return enabled === true;
}
