import { Shell } from "@/components/shell";
import Image from "next/image";
import Link from "next/link";

// ── Design tokens (match app palette) ────────────────────────────────────────
const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "14px",
  padding: "2rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

// ── Founder data — fill in placeholders ──────────────────────────────────────
const FOUNDERS = [
  {
    name: "[FOUNDER NAME]",
    title: "[FOUNDER TITLE]",
    blurb: "[FOUNDER BLURB — replace with real copy about their background, mission, and what drove them to build The Sage's Compass]",
  },
  {
    name: "[CO-FOUNDER NAME]",
    title: "[CO-FOUNDER TITLE]",
    blurb: "[CO-FOUNDER BLURB — replace with real copy]",
  },
];

const FAMILY_PHOTOS = [
  { src: "/team/family-1.jpg", alt: "Founders with family" },
  { src: "/team/family-2.jpg", alt: "Family learning together" },
  { src: "/team/family-3.jpg", alt: "Homeschool life" },
];

export default function AboutPage() {
  return (
    <Shell hue="home">
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 0 5rem" }}>

        {/* ── Mission header ── */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
            Our Story
          </p>
          <h1 className="font-cormorant-sc" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: "1.25rem" }}>
            Built by educators, for families.
          </h1>
          <p className="font-cormorant" style={{ fontSize: "1.15rem", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
            The Sage&apos;s Compass started with a simple question: why is it so hard to plan a lesson that actually fits your child, your values, and your life?
          </p>
        </div>

        {/* ── Combined founders photo ── */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            aspectRatio: "3/2",
            borderRadius: "14px",
            overflow: "hidden",
            background: "rgba(0,0,0,0.06)",
          }}>
            <Image
              src="/team/founders.jpg"
              alt="The founders of The Sage's Compass"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        {/* ── Founder blurbs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "4rem" }}>
          {FOUNDERS.map((founder) => (
            <div key={founder.name} style={frostCard}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.4rem" }}>
                {founder.title}
              </p>
              <h2 className="font-cormorant-sc" style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "1rem", letterSpacing: "0.03em" }}>
                {founder.name}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
                {founder.blurb}
              </p>
            </div>
          ))}
        </div>

        {/* ── Family photos ── */}
        <div style={{ marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", textAlign: "center", marginBottom: "1.5rem" }}>
            Life behind the app
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {FAMILY_PHOTOS.map((photo, i) => (
              <div key={i} style={{
                ...frostCard,
                padding: 0,
                position: "relative",
                aspectRatio: "4/3",
                overflow: "hidden",
              }}>
                <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Mission statement ── */}
        <div style={{ ...frostCard, textAlign: "center" }}>
          <h2 className="font-cormorant-sc" style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "1rem" }}>
            What We Believe
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: "620px", margin: "0 auto 1.5rem" }}>
            Every family has a unique teaching philosophy, and every child learns differently. Curriculum should serve your values — not the other way around. We built The Sage&apos;s Compass so that creating a lesson that&apos;s perfectly matched to your child, your philosophy, and your standards takes minutes, not hours.
          </p>
          <Link href="/compass" style={{ display: "inline-block", background: "#0B2E4A", color: "#F9F6EF", borderRadius: "10px", padding: "0.65rem 1.75rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            Find Your Teaching Archetype
          </Link>
        </div>

      </div>
    </Shell>
  );
}
