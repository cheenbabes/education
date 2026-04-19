import { loadMix } from "../_queries/mix";
import { KpiCard } from "../_components/kpi-card";
import { SimpleBarChart } from "../_components/bar-chart";
import type { Range } from "../_lib/range";

export async function MixTab({ range }: { range: Range }) {
  const data = await loadMix(range);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Multi-subject rate" value={`${data.multiSubjectPct}%`} sub={`of ${data.totalLessonsInRange} lessons in range`} />
        <KpiCard label="Top philosophy" value={data.philosophy[0]?.label ?? "—"} />
        <KpiCard label="Top subject" value={data.subjects[0]?.label ?? "—"} />
      </div>

      <Section title="Philosophy breakdown">
        <SimpleBarChart data={data.philosophy} color="#2563eb" />
      </Section>

      <Section title="Subject popularity (top 15)">
        <SimpleBarChart data={data.subjects} color="#16a34a" />
      </Section>

      <Section title="Grade level distribution (children)">
        <SimpleBarChart data={data.grades} color="#d97706" />
      </Section>

      <Section title="User state distribution (top 15)">
        <SimpleBarChart data={data.states} color="#0891b2" />
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
