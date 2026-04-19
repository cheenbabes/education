import { loadCost } from "../_queries/cost";
import { KpiCard } from "../_components/kpi-card";
import { StackedBarChart } from "../_components/stacked-bar-chart";
import { DataTable } from "../_components/data-table";
import type { Range } from "../_lib/range";

const usd = (n: number) => `$${n.toFixed(2)}`;

export async function CostTab({ range }: { range: Range }) {
  const data = await loadCost(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total spend (range)" value={usd(k.totalSpend)} />
        <KpiCard label="Avg cost / lesson" value={usd(k.avgPerLesson)} />
        <KpiCard label="Avg cost / worksheet" value={usd(k.avgPerWorksheet)} />
        <KpiCard label="Cost / active user" value={usd(k.costPerActiveUser)} />
      </div>

      <Section title="Daily AI spend (lessons vs worksheets)">
        <StackedBarChart
          data={data.dailySpend}
          series={[
            { key: "lesson", label: "Lessons", color: "#2563eb" },
            { key: "worksheet", label: "Worksheets", color: "#f59e0b" },
          ]}
        />
      </Section>

      <Section title="Top 10 most expensive users (in range)">
        <DataTable
          rows={data.topUsers}
          columns={[
            { key: "email", label: "Email" },
            { key: "lessons", label: "Lessons", align: "right" },
            { key: "worksheets", label: "Worksheets", align: "right" },
            { key: "total", label: "Total", align: "right", format: (v) => usd(Number(v)) },
          ]}
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
