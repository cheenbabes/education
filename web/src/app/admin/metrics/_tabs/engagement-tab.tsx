import { loadEngagement } from "../_queries/engagement";
import { KpiCard } from "../_components/kpi-card";
import { DailyLineChart } from "../_components/daily-line-chart";
import { SimpleBarChart } from "../_components/bar-chart";
import type { Range } from "../_lib/range";

export async function EngagementTab({ range }: { range: Range }) {
  const data = await loadEngagement(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Completion rate" value={`${k.completionRate}%`} sub="completions / lessons created" />
        <KpiCard label="Avg star rating" value={k.avgStars} sub="1–5" />
        <KpiCard label="Favorites rate" value={`${k.favoritesRate}%`} />
        <KpiCard label="% lessons scheduled" value={`${k.scheduledRate}%`} />
      </div>

      <Section title="Lessons completed per day">
        <DailyLineChart data={data.dailyCompletions} color="#16a34a" />
      </Section>

      <Section title="Star rating distribution">
        <SimpleBarChart data={data.starDist} color="#f59e0b" />
      </Section>

      <Section title="Lessons per user (distribution)">
        <SimpleBarChart data={data.perUserBuckets} color="#0891b2" />
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
