import Link from "next/link";
import { loadLessons } from "../_queries/lessons";
import { KpiCard } from "../_components/kpi-card";
import { DataTable } from "../_components/data-table";
import { SimpleBarChart } from "../_components/bar-chart";
import type { Range } from "../_lib/range";

const usd = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `$${n.toFixed(3)}`;

export async function LessonsTab({ range }: { range: Range }) {
  const data = await loadLessons(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <KpiCard label="Lessons (range)" value={k.total.toLocaleString()} />
        <KpiCard label="Avg sections" value={k.avgSections} />
        <KpiCard label="Avg duration" value={`${k.avgDurationMin} min`} />
        <KpiCard label="Avg standards" value={k.avgStandards} />
        <KpiCard label="Avg cost" value={usd(k.avgCostUsd)} />
        <KpiCard label="Philosophy connection" value={`${k.phConnPct}%`} sub="≥1 section has it" />
        <KpiCard label="Empty seeds" value={`${k.emptySeedsPct}%`} sub={`${k.emptySeeds} lessons`} />
      </div>

      <Section title="Recent lessons (last 50 in range)">
        <DataTable
          rows={data.recent}
          columns={[
            { key: "when", label: "When" },
            { key: "email", label: "User", maxWidth: "16ch" },
            { key: "child", label: "Child" },
            { key: "philosophy", label: "Philosophy" },
            { key: "subjects", label: "Subjects", maxWidth: "18ch" },
            { key: "seed", label: "Seed (interest)", maxWidth: "32ch" },
            { key: "sections", label: "§", align: "right" },
            { key: "duration", label: "min", align: "right" },
            { key: "standards", label: "std", align: "right" },
            {
              key: "cost",
              label: "Cost",
              align: "right",
              format: (v) => (typeof v === "number" ? usd(v) : "—"),
            },
            {
              key: "stars",
              label: "★",
              align: "right",
              format: (v) => (typeof v === "number" ? v.toFixed(1) : "—"),
            },
            {
              key: "id",
              label: "",
              render: (row) => (
                <Link
                  href={`/lessons/${row.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 hover:underline"
                  title="Open lesson in a new tab"
                >
                  view →
                </Link>
              ),
            },
          ]}
        />
      </Section>

      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Top seed words (stopwords filtered)">
          <SimpleBarChart data={data.topSeeds} color="#2563eb" />
        </Section>

        <Section title="Seed length distribution">
          <SimpleBarChart data={data.seedLengths} color="#8b5cf6" />
        </Section>
      </div>

      <Section title="Most expensive lessons (top 10 in range)">
        <DataTable
          rows={data.expensive}
          columns={[
            { key: "when", label: "When" },
            { key: "email", label: "User", maxWidth: "22ch" },
            { key: "philosophy", label: "Philosophy" },
            { key: "seed", label: "Seed (interest)", maxWidth: "36ch" },
            {
              key: "cost",
              label: "Cost",
              align: "right",
              format: (v) => (typeof v === "number" ? usd(v) : "—"),
            },
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
                  view →
                </Link>
              ),
            },
          ]}
          emptyLabel="No lessons with recorded cost in range."
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
