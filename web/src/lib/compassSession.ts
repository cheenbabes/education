// Client-side session ID for correlating anonymous compass quiz submissions
// with later account signups. One UUID per browser, persisted in localStorage.

const KEY = "compass_session_id";

export function getCompassSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEY, id);
  return id;
}
