"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { CompassDashboard } from "./compass-dashboard";
import { PaidDashboard } from "./paid-dashboard";

interface TierData {
  tier: string;
  childrenCount: number;
  childrenLimit: number;
  lessonsUsed: number;
  lessonsLimit: number;
  worksheetsUsed: number;
  worksheetsLimit: number;
  resetsAt: string;
}

export default function DashboardPage() {
  const [tierData, setTierData] = useState<TierData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/tier")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tier) setTierData(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <Shell hue="dashboard" fullWidth>
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
          <p style={{ color: "#5A5A5A" }}>Loading…</p>
        </div>
      </Shell>
    );
  }

  // Anonymous or tier fetch failed: render the compass (free) view with safe
  // defaults. The compass flow handles anon users gracefully.
  const effective: TierData = tierData ?? {
    tier: "compass",
    childrenCount: 0,
    childrenLimit: 0,
    lessonsUsed: 0,
    lessonsLimit: 3,
    worksheetsUsed: 0,
    worksheetsLimit: 0,
    resetsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  };

  return (
    <Shell hue="dashboard" fullWidth>
      {effective.tier === "compass" ? (
        <CompassDashboard tierData={effective} />
      ) : (
        <PaidDashboard tierData={effective} />
      )}
    </Shell>
  );
}
