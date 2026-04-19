import { loadGrowth } from "../_queries/growth";
import { KpiCard } from "../_components/kpi-card";
import { DailyLineChart } from "../_components/daily-line-chart";
import type { Range } from "../_lib/range";

function fmtDelta(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs prior window`;
}

export async function GrowthTab({ range }: { range: Range }) {
  const data = await loadGrowth(range);
  const k = data.kpis;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Total users" value={k.totalUsers.toLocaleString()} />
        <KpiCard
          label="New users (range)"
          value={k.usersInRange.toLocaleString()}
          sub={fmtDelta(k.usersDeltaPct)}
        />
        <KpiCard label="Total lessons" value={k.totalLessons.toLocaleString()} />
        <KpiCard
          label="New lessons (range)"
          value={k.lessonsInRange.toLocaleString()}
          sub={fmtDelta(k.lessonsDeltaPct)}
        />
        <KpiCard label="Total quiz takers" value={k.totalQuizzes.toLocaleString()} />
      </div>

      <Section title="New users per day">
        <DailyLineChart data={data.newUsersDaily} />
      </Section>

      <Section title="New lessons per day">
        <DailyLineChart data={data.newLessonsDaily} color="#16a34a" />
      </Section>

      <Section title="New quiz takers per day">
        <DailyLineChart data={data.newQuizzesDaily} color="#9333ea" />
      </Section>

      <Section title="Cumulative users">
        <DailyLineChart data={data.cumulativeUsers} color="#0891b2" />
      </Section>

      <Section title="Daily active users (distinct lesson creators)">
        <DailyLineChart data={data.dau} color="#d97706" />
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
