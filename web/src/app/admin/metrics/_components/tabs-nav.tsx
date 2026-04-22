import Link from "next/link";
import { RANGES, type Range, rangeLabel } from "../_lib/range";

export const TABS = [
  { id: "growth", label: "Growth" },
  { id: "lessons", label: "Lessons" },
  { id: "engagement", label: "Engagement" },
  { id: "compass", label: "Compass" },
  { id: "mix", label: "Product mix" },
  { id: "quality", label: "Quality" },
  { id: "cost", label: "Cost" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function parseTab(v: string | undefined): TabId {
  const found = TABS.find((t) => t.id === v);
  return found ? found.id : "growth";
}

export function TabsNav({ active, range }: { active: TabId; range: Range }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200">
      <nav className="flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/metrics?tab=${t.id}&range=${range}`}
            className={
              "px-3 py-2 text-sm font-medium transition-colors " +
              (t.id === active
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-neutral-600 hover:text-neutral-900")
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex gap-1 pb-2">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/metrics?tab=${active}&range=${r}`}
            className={
              "rounded-md px-2 py-1 text-xs font-medium " +
              (r === range
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200")
            }
            title={rangeLabel(r)}
          >
            {r}
          </Link>
        ))}
      </div>
    </div>
  );
}
