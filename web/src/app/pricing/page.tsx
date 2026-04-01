"use client";

import { PricingTable } from "@clerk/nextjs";
import { Nav } from "@/components/nav";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div
      className="watercolor-page hue-generate"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Nav />

      <main style={{ flex: 1, padding: "3rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

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
              maxWidth: "460px",
              margin: "0 auto",
            }}>
              Philosophy-first lessons for every family size.
              Cancel or change plans any time.
            </p>
          </div>

          {/* Clerk PricingTable — appearance matched to app palette */}
          <PricingTable
            appearance={{
              variables: {
                colorPrimary: "#0B2E4A",
                colorBackground: "rgba(249,246,239,0.82)",
                colorText: "#1a1a2e",
                colorTextSecondary: "#5A5A7A",
                fontFamily: '"Inter", sans-serif',
                borderRadius: "12px",
              },
              elements: {
                pricingTableRoot: {
                  background: "transparent",
                },
                planCard: {
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.55)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                },
                planCardActiveBadge: {
                  background: "#0B2E4A",
                  color: "#F9F6EF",
                },
              },
            }}
          />

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
          <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
            <Link href="/#pricing" style={{
              fontSize: "0.8rem",
              color: "var(--text-tertiary)",
              textDecoration: "none",
            }}>
              ← Compare all plan features
            </Link>
          </div>

        </div>
      </main>

      {/* Minimal inline footer — doesn't clip Clerk's side panel */}
      <footer style={{
        background: "#082f4e",
        padding: "1rem 1.5rem",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: "64rem",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          fontSize: "0.75rem",
          color: "rgba(249,246,239,0.4)",
        }}>
          <span>© {new Date().getFullYear()} The Sage&apos;s Compass</span>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {([["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]] as const).map(([label, href]) => (
              <Link key={label} href={href} style={{ color: "rgba(249,246,239,0.4)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
