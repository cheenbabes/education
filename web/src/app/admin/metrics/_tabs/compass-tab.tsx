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
        <KpiCard
          label="Total submissions"
          value={k.totalSubmissions.toLocaleString()}
          sub={`${k.uniqueSessions} unique browsers`}
        />
        <KpiCard
          label="Anonymous"
          value={k.anon.toLocaleString()}
          sub="no account yet"
        />
        <KpiCard
          label="With email"
          value={k.withEmail.toLocaleString()}
          sub={`${k.emailCapturePct}% of submissions`}
        />
        <KpiCard
          label="Account conversion"
          value={`${k.accountConversionPct}%`}
          sub={`${k.withAccount} signed up`}
        />
      </div>

      <Section title="Funnel">
        <div className="flex flex-col gap-2 text-sm">
          <FunnelStep label="Quiz submissions" value={k.totalSubmissions} pct={100} />
          <FunnelStep
            label="Gave email"
            value={k.withEmail}
            pct={k.totalSubmissions > 0 ? (k.withEmail / k.totalSubmissions) * 100 : 0}
          />
          <FunnelStep
            label="Created account"
            value={k.withAccount}
            pct={k.totalSubmissions > 0 ? (k.withAccount / k.totalSubmissions) * 100 : 0}
          />
        </div>
      </Section>

      <Section title="Quiz completions per day">
        <DailyLineChart data={data.daily} color="#9333ea" />
      </Section>

      <Section title="Archetype distribution">
        <SimpleBarChart data={data.archetypes} color="#9333ea" />
      </Section>

      {Object.keys(data.archetypesByVersion).length > 1 && (
        <Section title="Archetype distribution by scoring version">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(() => {
              const VERSION_COLORS: Record<string, string> = { v1: "#9333ea", v2: "#6366f1" };
              return Object.entries(data.archetypesByVersion).map(([version, rows]) => (
                <div key={version}>
                  <h3 className="mb-2 text-xs uppercase text-neutral-500">
                    {version} — {rows.reduce((s, r) => s + r.value, 0)} submissions
                  </h3>
                  <SimpleBarChart data={rows} color={VERSION_COLORS[version] ?? "#9333ea"} />
                </div>
              ));
            })()}
          </div>
        </Section>
      )}
    </div>
  );
}

function FunnelStep({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-neutral-600">
          {value.toLocaleString()} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded bg-neutral-100">
        <div className="h-2 rounded bg-purple-600" style={{ width: `${pct}%` }} />
      </div>
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
