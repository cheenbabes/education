export const SITE_NAME = "Sage's Compass";
export const SITE_ORIGIN = "https://sagescompass.com";
export const SITE_HOSTNAME = new URL(SITE_ORIGIN).hostname;

const LEGACY_SITE_ORIGINS = [
  "https://thesagescompass.com",
  "https://www.sagescompass.com",
  "https://www.thesagescompass.com",
] as const;
const LEGACY_SITE_HOSTS = new Set(
  LEGACY_SITE_ORIGINS.map((origin) => new URL(origin).hostname),
);

export function toSiteUrl(path = "/"): string {
  return new URL(path, SITE_ORIGIN).toString();
}

export function isLegacySiteHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  return LEGACY_SITE_HOSTS.has(hostname.toLowerCase());
}
