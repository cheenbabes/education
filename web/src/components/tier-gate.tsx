"use client";

import { useEffect, useState } from "react";
import { UPGRADE_URL } from "@/lib/upgradeUrl";

type Tier = "compass" | "homestead" | "schoolhouse" | "unlimited";

const TIER_ORDER: Record<Tier, number> = {
  compass: 0,
  homestead: 1,
  schoolhouse: 2,
  unlimited: 3,
};

interface TierGateProps {
  requiredTier: Tier;
  pageName: string;
  description: string;
  children: React.ReactNode;
}

export function TierGate({ requiredTier, pageName, description, children }: TierGateProps) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/tier")
      .then((r) => r.json())
      .then((data) => {
        setTier(data.tier as Tier);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (tier && TIER_ORDER[tier] >= TIER_ORDER[requiredTier]) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
      padding: "2rem 1rem",
    }}>
      <div
        className="frost-card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}
      >
        {/* Lock icon */}
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.6 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Heading */}
        <h2
          className="font-cormorant-sc"
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: "0.5rem",
            letterSpacing: "0.04em",
          }}
        >
          Unlock {pageName}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: "0.9rem",
          color: "var(--text-secondary, #5A5A5A)",
          lineHeight: 1.6,
          marginBottom: "1.5rem",
        }}>
          {description}
        </p>

        {/* Benefits list */}
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
          textAlign: "left",
        }}>
          {[
            "Track up to 4 children",
            "Schedule lessons on the calendar",
            "Monitor standards coverage",
            "30 lessons per month",
          ].map((benefit) => (
            <li key={benefit} style={{
              fontSize: "0.85rem",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <span style={{ color: "var(--accent-secondary, #6E6E9E)", flexShrink: 0 }}>&#10003;</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <a
          href={UPGRADE_URL}
          className="btn-night"
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "0.75rem",
            borderRadius: "10px",
            background: "var(--night)",
            color: "var(--parchment)",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.02em",
            boxSizing: "border-box",
          }}
        >
          Upgrade to Homestead — $21.99/mo
        </a>

        {/* Ghost link */}
        <a
          href="/sign-in"
          style={{
            display: "inline-block",
            marginTop: "0.75rem",
            fontSize: "0.78rem",
            color: "var(--text-tertiary, #999)",
            textDecoration: "none",
          }}
        >
          Already upgraded? Sign out and back in
        </a>
      </div>
    </div>
  );
}
