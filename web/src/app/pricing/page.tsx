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

      <style>{`
        .pricing-main { padding: 3rem 1.5rem 4rem; }
        @media (min-width: 1024px) { .pricing-main { padding-right: 440px; } }
      `}</style>
      <main className="pricing-main" style={{ flex: 1 }}>
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
                colorBackground: "rgba(249,246,239,0.85)",
                colorText: "#1a1a2e",
                colorTextSecondary: "#5A5A7A",
                fontFamily: '"Inter", sans-serif',
                borderRadius: "12px",
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
            maxWidth: "860px",
            marginLeft: "auto",
            marginRight: "auto",
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
          <div style={{ textAlign: "center", marginTop: "1.75rem", maxWidth: "860px", marginLeft: "auto", marginRight: "auto" }}>
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

    </div>
  );
}
