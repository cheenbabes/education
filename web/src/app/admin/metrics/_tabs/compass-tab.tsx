import { loadCompass } from "../_queries/compass";
import { KpiCard } from "../_components/kpi-card";
import { DailyLineChart } from "../_components/daily-line-chart";
import { SimpleBarChart } from "../_components/bar-chart";
import type { Range } from "../_lib/range";

export async function CompassTab({ range }: { range: Range }) {
  const data = await loadCompass(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total quiz takers" value={k.totalQuizzes.toLocaleString()} />
        <KpiCard label="Quiz → account conversion" value={`${k.conversionPct}%`} />
        <KpiCard label="Top archetype" value={k.topArchetype} />
        <KpiCard
          label="Funnel"
          value={`${data.funnel.converted} / ${data.funnel.total}`}
          sub={`${data.funnel.unconverted} did not create account`}
        />
      </div>

      <Section title="Quiz completions per day">
        <DailyLineChart data={data.daily} color="#9333ea" />
      </Section>

      <Section title="Archetype distribution">
        <SimpleBarChart data={data.archetypes} color="#9333ea" />
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
