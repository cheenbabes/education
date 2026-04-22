import Link from "next/link";
import { loadQuality } from "../_queries/quality";
import { KpiCard } from "../_components/kpi-card";
import { StackedBarChart } from "../_components/stacked-bar-chart";
import { DataTable } from "../_components/data-table";
import type { Range } from "../_lib/range";

export async function QualityTab({ range }: { range: Range }) {
  const data = await loadQuality(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Low-rated completions" value={k.lowRatedCount} sub="stars ≤ 2 (in range)" />
        <KpiCard label="Total feedback" value={k.totalFeedback} />
        <KpiCard label="Dedup rate" value={`${k.dedupPct}%`} sub={`${k.dupes} duplicate contentHashes`} />
      </div>

      <Section title="Feedback by category per day">
        <StackedBarChart
          data={data.feedbackByDay}
          series={[
            { key: "bug", label: "Bug", color: "#dc2626" },
            { key: "feature", label: "Feature", color: "#2563eb" },
            { key: "general", label: "General", color: "#6b7280" },
          ]}
        />
      </Section>

      <Section title="Recent feedback (last 20, all time)">
        <DataTable
          rows={data.recentFeedback}
          columns={[
            { key: "when", label: "Date" },
            { key: "category", label: "Category" },
            { key: "email", label: "Email" },
            { key: "message", label: "Message" },
          ]}
        />
      </Section>

      <Section title="Low-rated completions (stars ≤ 2, in range)">
        <DataTable
          rows={data.lowRated}
          columns={[
            { key: "when", label: "Date" },
            { key: "stars", label: "★", align: "right" },
            {
              key: "lesson",
              label: "Lesson",
              render: (row) => (
                <Link
                  href={`/lessons/${row.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 hover:underline"
                >
                  {row.lesson}
                </Link>
              ),
            },
            { key: "notes", label: "Notes" },
          ]}
          emptyLabel="No low-rated completions in range."
        />
      </Section>

      <Section title="Content-hash collisions (same lesson JSON produced ≥2x)">
        <DataTable
          rows={data.collisions}
          columns={[
            { key: "hash", label: "Hash" },
            { key: "count", label: "Copies", align: "right" },
            { key: "first", label: "First seen" },
            { key: "last", label: "Last seen" },
            {
              key: "id",
              label: "",
              render: (row) => (
                <Link
                  href={`/lessons/${row.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 hover:underline"
                >
                  sample →
                </Link>
              ),
            },
          ]}
          emptyLabel="No contentHash collisions in range."
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">{title}</h2>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">{children}</div>
    </section>
  );
}
