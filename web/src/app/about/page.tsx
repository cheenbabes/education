import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the founders of The Sage's Compass — a master educator and engineer building personalized homeschool curriculum tools for families.",
};

// ── Design tokens (match app palette) ────────────────────────────────────────
const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "14px",
  padding: "2rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

// ── Founder data ─────────────────────────────────────────────────────────────
const FOUNDERS = [
  {
    name: "Audarya Baibourine",
    title: "Co-Founder & Education Director",
    blurb: "Audarya has over 14 years of teaching experience across Montessori and Waldorf schools. She founded and directed a nature-based micro-school in North Carolina, where she taught for five years. She has also homeschooled her own children and currently teaches them, along with other students, in a learning pod.\n\nShe holds a master\u2019s degree in Foundations of Education, with a focus on evidence-based alternative teaching practices, and is currently pursuing her Doctorate in Education.\n\nHer dream is to help communities and parents find the teaching pathway that fits them and their students. She believes there is no single \u201Cright\u201D way to teach\u200A\u2014\u200Aand that leaning into your strengths, and your students\u2019 propensities, is the key to great learning.",
  },
  {
    name: "Eugene Baibourine",
    title: "Co-Founder & Engineering",
    blurb: "Eugene has spent over a decade as a software engineer, building products for companies ranging from scrappy startups to tech giants. He has a passion for creating tools that solve real problems and empower users, and has been deeply involved in the education space for years, both as a parent and through various projects.\n\nEugene is driven by the belief that technology can be a powerful force for good in education, but only when it is designed with empathy and a deep understanding of the needs of educators and families. He is committed to building tools that are not only effective but also intuitive and enjoyable to use.",
  },
];

const FAMILY_PHOTOS = [
  { src: "/team/family-1.jpg", alt: "Eugene and Audarya at the beach" },
  { src: "/team/family-7.jpg", alt: "Kids playing in the park" },
  { src: "/team/family-2.jpg", alt: "Eugene and Audarya on the farm" },
  { src: "/team/family-4.jpg", alt: "Family looking out over the lake" },
  { src: "/team/family-5.jpg", alt: "Hiking with the family" },
  { src: "/team/family-6.jpg", alt: "Kids exploring by the water" },
];

export default function AboutPage() {
  return (
    <Shell hue="home">
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1rem 5rem" }}>

        {/* ── Mission header ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
            Our Story
          </p>
          <h1 className="font-cormorant-sc" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: "1.25rem" }}>
            Built by educators, for families.
          </h1>
        </div>

        {/* ── Intro text + founders photo side by side ── */}
        <div className="about-intro-grid" style={{ display: "grid", gap: "2.5rem", alignItems: "center", marginBottom: "4rem" }}>
          <p className="font-cormorant" style={{ fontSize: "1.15rem", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Eugene and Audarya have been married for 14 years and have four children. For over a decade, they have collaborated on educational projects, exploring ways to support children and families in learning. Recently, they combined their unique skills&mdash;Eugene&apos;s expertise as a software engineer and Audarya&apos;s passion for teaching&mdash;to create an app designed to empower families and communities to take an active role in their children&apos;s education.
          </p>
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
            borderRadius: "14px",
            overflow: "hidden",
            background: "rgba(0,0,0,0.06)",
          }}>
            <Image
              src="/team/founders.jpg"
              alt="Eugene and Audarya Baibourine"
              fill
              style={{ objectFit: "cover", objectPosition: "top" }}
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
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {founder.blurb.split("\n\n").map((para, i) => (
                  <p key={i} style={{ margin: 0 }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Family photos ── */}
        <div style={{ marginBottom: "4rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", textAlign: "center", marginBottom: "1.5rem" }}>
            Life behind the app
          </p>
          <div className="about-photo-grid" style={{ display: "grid", gap: "1rem" }}>
            {FAMILY_PHOTOS.map((photo, i) => (
              <div key={i} style={{
                ...frostCard,
                padding: 0,
                position: "relative",
                aspectRatio: "4/3",
                overflow: "hidden",
              }}>
                <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: "cover", objectPosition: "center 20%" }} />
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
            Every family has a unique teaching philosophy, and every child learns differently. Curriculum should serve your values&mdash;not the other way around. We built The Sage&apos;s Compass so that creating a lesson perfectly matched to your child, your philosophy, and your standards takes minutes, not hours. Beyond their work, Eugene and Audarya love adventuring in nature, gardening, and tackling projects together&mdash;bringing creativity, curiosity, and a sense of wonder into both their family life and their educational endeavors.
          </p>
          <Link href="/compass" style={{ display: "inline-block", background: "#0B2E4A", color: "#F9F6EF", borderRadius: "10px", padding: "0.65rem 1.75rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            Find Your Teaching Archetype
          </Link>
        </div>

      </div>
    </Shell>
  );
}
