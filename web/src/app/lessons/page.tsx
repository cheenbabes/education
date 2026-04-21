import { redirect } from "next/navigation";

// The old /lessons library page is now merged into /dashboard (labeled "Home"
// in the nav). Query params preserve deep links — e.g. /lessons?tab=favorites
// → /dashboard?tab=favorites. The reference implementation of the standalone
// library lives at _lessons-library.tsx until the Home-tab refactor lands.
export default function LessonsRedirectPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v) && v.length > 0) qs.set(k, v[0]);
  }
  const query = qs.toString();
  redirect(query ? `/dashboard?${query}` : "/dashboard");
}
