"use client";

import { useState } from "react";
import Link from "next/link";

type BillingPeriod = "annual" | "monthly";

interface Plan {
  name: string;
  price: string | null;
  annualPrice: string | null;
  annualBilled: string | null;
  period: string | null;
  badge?: string;
  featured: boolean;
  descriptor?: string;
  features: string[];
  cta: string;
  ctaHref: string;
}

const CHECKOUT_HOMESTEAD = process.env.NEXT_PUBLIC_CHECKOUT_HOMESTEAD ?? "/#pricing";
const CHECKOUT_SCHOOLHOUSE = process.env.NEXT_PUBLIC_CHECKOUT_SCHOOLHOUSE ?? "/#pricing";

const PLANS: Plan[] = [
  {
    name: "Compass",
    price: "Free",
    annualPrice: null,
    annualBilled: null,
    period: "forever",
    featured: false,
    features: [
      "Full Compass Quiz + archetype discovery",
      "3 lesson generations per month",
      "Top 3 curriculum matches for your philosophy",
      "Interactive Explore star map",
    ],
    cta: "Start Free →",
    ctaHref: "/compass",
  },
  {
    name: "Homestead",
    price: "$21.99",
    annualPrice: "$16.58",
    annualBilled: "$199/year",
    period: "/ month",
    badge: "Most Popular",
    featured: true,
    features: [
      "30 lessons per month",
      "5 worksheets per month",
      "Up to 4 children with full profiles",
      "Full curriculum matching (70+ curricula)",
      "State standards tracking, all 50 states",
      "Private community access",
    ],
    cta: "Start Homestead →",
    ctaHref: CHECKOUT_HOMESTEAD,
  },
  {
    name: "Schoolhouse",
    price: "$29.99",
    annualPrice: "$23.25",
    annualBilled: "$279/year",
    period: "/ month",
    featured: false,
    features: [
      "60 lessons per month",
      "15 worksheets per month",
      "Up to 8 children with full profiles",
      "Full curriculum matching (70+ curricula)",
      "State standards tracking, all 50 states",
      "Priority support",
    ],
    cta: "Start Schoolhouse →",
    ctaHref: CHECKOUT_SCHOOLHOUSE,
  },
  {
    name: "Co-op",
    price: null,
    annualPrice: null,
    annualBilled: null,
    period: null,
    featured: false,
    descriptor: "For homeschool groups, micro schools, and co-ops.",
    features: [
      "Multiple teacher accounts",
      "Shared student rosters",
      "Custom lesson volume",
    ],
    cta: "Get in touch →",
    ctaHref: "/contact",
  },
];

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("annual");
  const isAnnual = billing === "annual";

  return (
    <section style={{
      padding: "5rem 1.5rem",
      background: "rgba(255,255,255,0.35)",
      borderTop: "1px solid rgba(0,0,0,0.05)",
      borderBottom: "1px solid rgba(0,0,0,0.05)",
    }}>
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            Simple, Fair Pricing
          </p>
          <h2 className="font-cormorant-sc" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)", marginBottom: "0.75rem" }}>
            Start Free. Upgrade When You&apos;re Ready.
          </h2>
          <p className="font-cormorant" style={{ fontSize: "1.05rem", fontStyle: "italic", color: "var(--text-secondary)" }}>
            The Compass Quiz and your first three lessons are completely free. No credit card. No trial countdown.
          </p>
        </div>

        {/* Annual / monthly toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
          <div style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "10px",
            padding: "3px",
          }}>
            {(["annual", "monthly"] as BillingPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setBilling(period)}
                style={{
                  padding: "0.4rem 1.1rem",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                  background: billing === period ? "var(--night)" : "transparent",
                  color: billing === period ? "var(--parchment)" : "var(--text-secondary)",
                }}
              >
                {period === "annual" ? "Annual — Save 2 Months" : "Monthly"}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="pricing-grid">
          {PLANS.map(({ name, price, annualPrice, annualBilled, period, badge, featured, descriptor, features, cta, ctaHref }) => (
            <div
              key={name}
              className={`pricing-card${featured ? " pricing-card-featured" : ""}`}
              style={{
                padding: featured ? "2.25rem 1.75rem" : "1.75rem 1.5rem",
                borderRadius: "14px",
                border: featured ? "none" : "1px solid rgba(255,255,255,0.5)",
                boxShadow: featured ? "0 12px 40px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.04)",
                background: featured ? "var(--night)" : "rgba(255,255,255,0.72)",
                backdropFilter: featured ? "none" : "blur(12px)",
                WebkitBackdropFilter: featured ? "none" : "blur(12px)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Badge row — only show plan badge, never repeat the savings (toggle already says it) */}
              <div style={{ minHeight: "1.2rem", marginBottom: "0.4rem" }}>
                {badge && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4AF37" }}>
                    {badge}
                  </span>
                )}
                {false && isAnnual && annualPrice && (
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: featured ? "rgba(212,175,55,0.85)" : "var(--accent-secondary)",
                    float: badge ? "right" : "none",
                  }}>
                    Save 2 months
                  </span>
                )}
              </div>

              {/* Plan name */}
              <div className="font-cormorant-sc" style={{ fontSize: "1.2rem", fontWeight: 600, color: featured ? "var(--parchment)" : "var(--ink)", marginBottom: "0.3rem" }}>
                {name}
              </div>

              {/* Price */}
              {price ? (
                <div style={{ marginBottom: "1.25rem" }}>
                  <span className="font-cormorant-sc" style={{ fontSize: "1.75rem", fontWeight: 700, color: featured ? "var(--parchment)" : "var(--ink)" }}>
                    {isAnnual && annualPrice ? annualPrice : price}
                  </span>
                  {period && (
                    <span style={{ fontSize: "0.82rem", color: featured ? "rgba(249,246,239,0.5)" : "var(--text-tertiary)" }}>
                      {" "}{period}
                    </span>
                  )}
                  {isAnnual && annualBilled && (
                    <div style={{ fontSize: "0.72rem", color: featured ? "rgba(249,246,239,0.45)" : "var(--text-tertiary)", marginTop: "0.2rem" }}>
                      billed {annualBilled}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: "1rem" }}>
                  {descriptor && (
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      {descriptor}
                    </p>
                  )}
                </div>
              )}

              {/* Features */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                {features.map((f) => (
                  <li key={f} style={{ fontSize: "0.82rem", color: featured ? "rgba(249,246,239,0.75)" : "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: featured ? "#D4AF37" : "var(--accent-secondary)", flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={ctaHref}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  background: featured ? "rgba(212,175,55,0.9)" : name === "Co-op" ? "transparent" : "var(--night)",
                  color: featured ? "var(--night)" : name === "Co-op" ? "var(--accent-primary)" : "var(--parchment)",
                  border: name === "Co-op" ? "1px solid rgba(110,110,158,0.3)" : "none",
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                  boxSizing: "border-box",
                }}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "1.5rem" }}>
          All plans include all 8 teaching philosophies, the full Compass Quiz, and the interactive Explore star map.
          Worksheets available on Homestead and Schoolhouse plans. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
