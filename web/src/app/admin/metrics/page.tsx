import { requireAdminPage } from "./_lib/admin-guard";
import { parseRange, rangeLabel } from "./_lib/range";
import { TabsNav, parseTab } from "./_components/tabs-nav";
import { GrowthTab } from "./_tabs/growth-tab";
import { CostTab } from "./_tabs/cost-tab";
import { EngagementTab } from "./_tabs/engagement-tab";
import { CompassTab } from "./_tabs/compass-tab";
import { MixTab } from "./_tabs/mix-tab";
import { QualityTab } from "./_tabs/quality-tab";
import { LessonsTab } from "./_tabs/lessons-tab";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Metrics · Admin" };

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: { tab?: string; range?: string };
}) {
  await requireAdminPage();

  const tab = parseTab(searchParams.tab);
  const range = parseRange(searchParams.range);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Metrics</h1>
          <p className="text-sm text-neutral-500">
            Internal database analytics · {rangeLabel(range)}
          </p>
        </header>

        <TabsNav active={tab} range={range} />

        {tab === "growth" && <GrowthTab range={range} />}
        {tab === "lessons" && <LessonsTab range={range} />}
        {tab === "cost" && <CostTab range={range} />}
        {tab === "engagement" && <EngagementTab range={range} />}
        {tab === "compass" && <CompassTab range={range} />}
        {tab === "mix" && <MixTab range={range} />}
        {tab === "quality" && <QualityTab range={range} />}
      </main>
    </div>
  );
}
