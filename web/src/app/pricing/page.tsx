"use client";

import { Shell } from "@/components/shell";
import { PricingTable } from "@clerk/nextjs";
import Link from "next/link";

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

export default function PricingPage() {
  return (
    <Shell hue="generate">
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 0 4rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent-primary)",
            marginBottom: "0.75rem",
          }}>
            Simple, Honest Pricing
          </p>
          <h1 className="font-cormorant-sc" style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1.2,
            marginBottom: "1rem",
          }}>
            Choose Your Plan
          </h1>
          <p className="font-cormorant" style={{
            fontSize: "1.1rem",
            fontStyle: "italic",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            maxWidth: "480px",
            margin: "0 auto",
          }}>
            Philosophy-first lessons for every family size. Cancel or change plans any time.
          </p>
        </div>

        {/* Clerk PricingTable */}
        <div style={{ ...frostCard, padding: "2rem 1.5rem" }}>
          <PricingTable />
        </div>

        {/* Reassurance row */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          flexWrap: "wrap",
          marginTop: "1.75rem",
        }}>
          {[
            "No commitment — cancel any time",
            "Annual plans save ~25%",
            "Upgrade or downgrade instantly",
          ].map((note) => (
            <span key={note} style={{
              fontSize: "0.75rem",
              color: "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}>
              <span style={{ color: "var(--accent-secondary)", fontSize: "0.7rem" }}>✓</span>
              {note}
            </span>
          ))}
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/#pricing" style={{
            fontSize: "0.8rem",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}>
            ← Compare all plan features
          </Link>
        </div>

      </div>
    </Shell>
  );
}
