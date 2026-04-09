import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { PricingSection } from "@/components/pricing-section";
import { ArchetypeRingResponsive } from "@/components/archetype-ring-responsive";

export const metadata: Metadata = {
  title: "The Sage's Compass — Homeschool Curriculum for Your Family",
  description:
    "Discover your teaching archetype and create personalized, standards-aligned lesson plans matched to your philosophy and your child's interests.",
};

// Archetype ring order: Weaver at top (12 o'clock), Storyteller upper-right, Guide upper-left (last)
const RING_ORDER = [
  "the-weaver",
  "the-storyteller",
  "the-architect",
  "the-free-spirit",
  "the-naturalist",
  "the-cultivator",
  "the-explorer",
  "the-guide",
];

const ringArchetypes = RING_ORDER.map(
  (id) => ARCHETYPES.find((a) => a.id === id)!
);

export default function Home() {
  return (
    <div className="watercolor-page hue-home" style={{ minHeight: "100vh" }}>
      <Nav />

      {/* ── Section 1: Hero ────────────────────────────────────────────── */}
      <section className="home-hero-section" style={{ padding: "5rem 1.5rem 4rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="home-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>

          {/* Left: copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              whiteSpace: "normal",
            }}>
              Designed by a Master Educator. Built for Your Teaching Style.
            </p>

            <h1 className="font-cormorant-sc" style={{
              fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "0.04em",
              color: "var(--ink)",
            }}>
              Lessons that adapt to you and your students.
            </h1>

            <p className="font-cormorant" style={{
              fontSize: "1.2rem",
              fontStyle: "italic",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}>
              Discover your teaching archetype, explore curricula, create custom, standards-aligned lesson plans for any philosophy — Montessori, Charlotte Mason, Classical, and more — in two minutes.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link href="/compass" className="btn-night" style={{
                fontSize: "1rem",
                padding: "0.85rem 2rem",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                Take the Compass Quiz — It&apos;s Free
              </Link>
              <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", textAlign: "center" }}>
                No credit card required · 5 minutes · Discover your archetype
              </p>
            </div>

            <Link href="#how-it-works" style={{
              fontSize: "0.88rem",
              color: "var(--accent-primary)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}>
              See how it works →
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Built for</span>
              {[
                { label: "Homeschool Families", color: "var(--accent-primary)" },
                { label: "Micro Schools & Co-ops", color: "var(--accent-secondary)" },
                { label: "Worldschooling Families", color: "var(--accent-tertiary)" },
              ].map(({ label, color }) => (
                <span key={label} style={{
                  fontSize: "0.7rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.65)",
                  border: `1px solid ${color}40`,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: archetype ring — responsive size via client component */}
          <div className="archetype-ring-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <ArchetypeRingResponsive archetypes={ringArchetypes} />
            <p style={{
              fontSize: "0.78rem",
              color: "var(--text-tertiary)",
              fontFamily: "'Cormorant', serif",
              fontStyle: "italic",
            }}>
              Which one are you?
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Stats bar ───────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(0,0,0,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(255,255,255,0.45)",
        padding: "1.75rem 1.5rem",
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
          className="home-stats-grid">
          {[
            { stat: "363,000+", desc: "State Standards Integrated." },
            { stat: "Based on Foundational Texts", desc: "A library of materials supporting each pedagogy." },
            { stat: "70+ Curricula", desc: "Matched to Your Philosophy." },
          ].map(({ stat, desc }) => (
            <div key={stat}>
              <div className="font-cormorant-sc" style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)" }}>
                {stat}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Archetype showcase ─────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            The Compass Quiz
          </p>
          <h2 className="font-cormorant-sc" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)", marginBottom: "0.75rem" }}>
            Eight Ways to Teach. One That&apos;s Yours.
          </h2>
          <p className="font-cormorant" style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto", lineHeight: 1.6 }}>
            After 14 years in classrooms, co-ops, and micro schools, I found that every educator falls into one of eight archetypes. Which one describes you?
          </p>
        </div>

        {/* 8-column grid — responsive via .home-archetype-grid */}
        <div className="home-archetype-grid">
          {ARCHETYPES.map((a) => (
            <div key={a.id} style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "14px",
              borderBottom: `3px solid ${a.color}`,
              padding: "0.85rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              textAlign: "center",
            }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.5)" }}>
                <Image src={a.imagePath} alt={a.name} width={56} height={56} style={{ objectFit: "cover", objectPosition: "top" }} />
              </div>
              <div className="font-cormorant-sc" style={{ fontSize: "0.72rem", fontWeight: 600, color: a.color, letterSpacing: "0.03em" }}>
                {a.name}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {archetypeHook(a.id)}
              </div>
            </div>
          ))}
        </div>

        {/* Pull quote + CTA */}
        <div style={{
          margin: "2.5rem auto 0",
          maxWidth: "600px",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderLeft: "4px solid var(--accent-secondary)",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          textAlign: "center",
        }}>
          <p className="font-cormorant" style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--ink)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
            &ldquo;Great education starts with knowing yourself as a teacher&rdquo;
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>— Founder</p>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/compass" className="btn-night" style={{ fontSize: "0.95rem", padding: "0.75rem 2rem", borderRadius: "12px" }}>
            Discover My Archetype — Free, 5 Minutes
          </Link>
        </div>
      </section>

      {/* ── Section 4: How it works ────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: "5rem 1.5rem",
        background: "rgba(255,255,255,0.35)",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
              How It Works
            </p>
            <h2 className="font-cormorant-sc" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)" }}>
              From Your Philosophy to a Lesson Plan. In Two Minutes.
            </h2>
          </div>

          <div className="home-how-grid">
            {[
              {
                num: "01",
                heading: "Discover Your Teaching Archetype",
                body: "20 thoughtfully designed questions reveal how you naturally approach education — your philosophy, your rhythms, your strengths. No teaching degree required.",
                preview: (
                  <div className="wc-card wc-card-lavender" style={{ borderRadius: "10px", padding: "1rem", fontSize: "0.72rem" }}>
                    <div style={{ height: "3px", background: "rgba(0,0,0,0.1)", borderRadius: "2px", marginBottom: "0.75rem" }}>
                      <div style={{ width: "35%", height: "100%", background: "var(--accent-primary)", borderRadius: "2px" }} />
                    </div>
                    <div className="font-cormorant" style={{ fontSize: "0.88rem", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                      Your 8-year-old is ready for math. Which feels right?
                    </div>
                    {["Structured lessons with clear steps", "Hands-on manipulatives and discovery", "Real-world problems from daily life"].map((opt) => (
                      <div key={opt} style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "8px", padding: "0.4rem 0.6rem", marginBottom: "0.35rem", cursor: "pointer" }}>{opt}</div>
                    ))}
                  </div>
                ),
              },
              {
                num: "02",
                heading: "Type a Topic. Pick a Subject. Hit Create.",
                body: "Type anything: 'frogs,' 'the American Revolution,' 'fractions.' Select the subject and grade. We handle the philosophy, standards, and structure.",
                preview: (
                  <div className="wc-card wc-card-parchment" style={{ borderRadius: "10px", padding: "1rem", fontSize: "0.72rem" }}>
                    {/* Topic input */}
                    <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "0.5rem 0.65rem", marginBottom: "0.5rem", color: "var(--text-tertiary)" }}>
                      What is your child curious about today?
                    </div>
                    {/* Subject pills */}
                    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.5rem" }}>
                      {["Science", "History", "Math"].map((s, i) => (
                        <span key={s} style={{ fontSize: "0.65rem", padding: "0.25rem 0.5rem", borderRadius: "6px", background: i === 0 ? "var(--night)" : "rgba(255,255,255,0.7)", color: i === 0 ? "var(--parchment)" : "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.4)" }}>{s}</span>
                      ))}
                    </div>
                    {/* Philosophy selector */}
                    <div style={{ marginBottom: "0.6rem" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.35rem" }}>Philosophy</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {[
                          { label: "Charlotte Mason", color: "#B07A8A" },
                          { label: "Montessori",      color: "#7D6B9E" },
                          { label: "Classical",       color: "#5B5E8A" },
                          { label: "Project-Based",   color: "#5A7FA0" },
                          { label: "Waldorf",         color: "#C4983D" },
                          { label: "Nature",          color: "#5A947A" },
                        ].map(({ label, color }, i) => (
                          <span key={label} style={{
                            fontSize: "0.6rem",
                            padding: "0.2rem 0.45rem",
                            borderRadius: "5px",
                            background: i === 0 ? `${color}22` : "rgba(255,255,255,0.6)",
                            color: i === 0 ? color : "var(--text-secondary)",
                            border: i === 0 ? `1px solid ${color}44` : "1px solid rgba(0,0,0,0.07)",
                            fontWeight: i === 0 ? 600 : 400,
                          }}>{label}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "var(--night)", color: "var(--parchment)", borderRadius: "8px", padding: "0.5rem", textAlign: "center", fontWeight: 500 }}>Create Lesson</div>
                  </div>
                ),
              },
              {
                num: "03",
                heading: "A Complete Lesson, Ready to Use",
                body: "Two minutes of planning, not two hours. You get a structured, philosophy-aligned lesson — activities, materials, and a narration prompt — ready to teach. No blank page, no second-guessing. Just open it and go.",
                preview: (
                  <div className="wc-card wc-card-sage" style={{ borderRadius: "10px", padding: "1rem", fontSize: "0.72rem" }}>
                    <div className="font-cormorant-sc" style={{ fontSize: "0.88rem", marginBottom: "0.35rem" }}>The Life Cycle of a Frog</div>
                    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.45rem", borderRadius: "5px", background: "rgba(176,122,138,0.15)", color: "#B07A8A", border: "1px solid rgba(176,122,138,0.25)" }}>Charlotte Mason</span>
                      <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.45rem", borderRadius: "5px", background: "rgba(255,255,255,0.6)", color: "var(--text-tertiary)", border: "1px solid rgba(0,0,0,0.06)" }}>Grade 2 · Science</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "8px", padding: "0.5rem 0.65rem", marginBottom: "0.35rem" }}>
                      <div style={{ fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.6rem", color: "var(--text-tertiary)", marginBottom: "0.2rem" }}>Nature Observation</div>
                      Find a pond or damp area and look for tadpoles at different stages…
                    </div>
                    <div style={{ background: "rgba(110,110,158,0.08)", border: "1px solid rgba(110,110,158,0.15)", borderRadius: "6px", padding: "0.3rem 0.5rem", fontSize: "0.62rem", color: "var(--accent-primary)" }}>
                      ✓ NGSS-LS1.A · K-2 Life Science
                    </div>
                  </div>
                ),
              },
            ].map(({ num, heading, body, preview }) => (
              <div key={num} className="frost-card" style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.75rem 1.5rem",
                gap: "1rem",
              }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "'Cormorant SC', serif", color: "rgba(110,110,158,0.18)", lineHeight: 1 }}>{num}</div>
                <div style={{ flex: 1 }}>
                  <h3 className="font-cormorant-sc" style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.5rem", letterSpacing: "0.03em" }}>{heading}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{body}</p>
                </div>
                {preview}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Feature deep dive ──────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            Built on Real Pedagogy
          </p>
          <h2 className="font-cormorant-sc" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)" }}>
            Lessons created through a master educator&apos;s methodology.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {[
            /* 1. Philosophy-driven lessons */
            {
              right: true,
              headline: "Every Lesson Reflects Your Unique Teaching Philosophy",
              body: "Montessori math doesn't just include manipulatives. It follows Maria Montessori's concrete-to-abstract sequence, extracted from her original writings. Charlotte Mason lessons use living books, short sessions, and narration. Classical lessons build on critical thinking. A library of materials for each pedagogy — that's what powers every lesson.",
              note: undefined,
              visual: (
                <div className="wc-card wc-card-sage frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div className="font-cormorant-sc" style={{ fontSize: "1rem", color: "var(--ink)" }}>The Life Cycle of a Butterfly</div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {[
                      { label: "Charlotte Mason", color: "#B07A8A" },
                      { label: "Grade 2 · Science", color: "var(--text-tertiary)" },
                    ].map(({ label, color }) => (
                      <span key={label} style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "5px", background: "rgba(255,255,255,0.7)", color, border: "1px solid rgba(0,0,0,0.07)" }}>{label}</span>
                    ))}
                  </div>
                  {[
                    { type: "Nature Observation", desc: "Go outside and look for caterpillars or chrysalises. Sketch what you find in your nature journal." },
                    { type: "Living Book", desc: "Read aloud from a picture book about metamorphosis. Ask your child to narrate it back in their own words." },
                    { type: "Handwork", desc: "Create a watercolor lifecycle diagram — egg, caterpillar, chrysalis, butterfly." },
                  ].map(({ type, desc }) => (
                    <div key={type} style={{ background: "rgba(255,255,255,0.75)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B07A8A", marginBottom: "0.25rem" }}>{type}</div>
                      <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                  <div style={{ fontSize: "0.65rem", color: "var(--accent-primary)", background: "rgba(110,110,158,0.08)", borderRadius: "6px", padding: "0.3rem 0.5rem" }}>
                    ✓ NGSS-LS1.B · K-2 Life Science
                  </div>
                </div>
              ),
            },
            /* 2. Any of 8 philosophies — nobody else does this */
            {
              right: false,
              headline: "Create Lessons in Any of Eight Philosophies. On Demand.",
              body: "You're not locked into one approach. Your Compass Quiz reveals your archetype, but you can create lessons rooted in any philosophy — Montessori, Charlotte Mason, Classical, Waldorf, Project-Based, Nature-Based, Unschooling, or Adaptive — and switch between them freely. Every philosophy is built from primary sources and real pedagogical frameworks. No other tool creates consistent, high-quality lessons across all eight.",
              note: "8 philosophies · Switch freely · Every lesson grounded in real pedagogy",
              visual: (
                <div className="wc-card wc-card-lavender frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>Same topic, different philosophy</div>
                  <div className="font-cormorant-sc" style={{ fontSize: "0.95rem", color: "var(--ink)", marginBottom: "0.15rem" }}>Fractions — Grade 3</div>
                  {[
                    { phil: "Montessori", color: "#7D6B9E", activity: "Fraction circles and bead chains — concrete to abstract" },
                    { phil: "Charlotte Mason", color: "#B07A8A", activity: "Halve a recipe together, then narrate the math" },
                    { phil: "Classical", color: "#5B5E8A", activity: "Chant fraction families, then solve word problems" },
                    { phil: "Project-Based", color: "#5A7FA0", activity: "Design a pizza menu with fractional toppings" },
                  ].map(({ phil, color, activity }) => (
                    <div key={phil} style={{ background: "rgba(255,255,255,0.75)", borderRadius: "8px", padding: "0.5rem 0.65rem", borderLeft: `3px solid ${color}40` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 600, color, padding: "0.1rem 0.4rem", borderRadius: "4px", background: `${color}12`, border: `1px solid ${color}25` }}>{phil}</span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{activity}</div>
                    </div>
                  ))}
                </div>
              ),
            },
            /* 3. Multi-age differentiation */
            {
              right: true,
              headline: "One Lesson, Multiple Ages. Differentiated Automatically.",
              body: "Teaching a 5-year-old and a 9-year-old at the same time? Select both children, and every lesson is automatically differentiated — age-appropriate activities, separate standards, and tailored expectations — all woven into one cohesive lesson you teach together.",
              note: "Multi-age · Per-child differentiation · One lesson, every child challenged",
              visual: (
                <div className="wc-card wc-card-sage frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="font-cormorant-sc" style={{ fontSize: "1rem", color: "var(--ink)" }}>Exploring Ecosystems</div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "5px", background: "rgba(90,148,122,0.15)", color: "#5A947A", border: "1px solid rgba(90,148,122,0.25)" }}>Science</span>
                    <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "5px", background: "rgba(255,255,255,0.7)", color: "var(--text-tertiary)", border: "1px solid rgba(0,0,0,0.06)" }}>Multi-Age</span>
                  </div>
                  {[
                    { name: "Emma (Age 5)", note: "Draw the animals you see. Count how many legs each one has.", grade: "K" },
                    { name: "Jack (Age 9)", note: "Create a food web diagram showing predator-prey relationships.", grade: "4" },
                  ].map(({ name, note: n, grade }) => (
                    <div key={name} style={{ background: "rgba(255,255,255,0.75)", borderRadius: "8px", padding: "0.5rem 0.65rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--ink)" }}>{name}</span>
                        <span style={{ fontSize: "0.55rem", padding: "0.15rem 0.35rem", borderRadius: "4px", background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)" }}>Grade {grade}</span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{n}</div>
                    </div>
                  ))}
                </div>
              ),
            },
            /* 4. Standards — find, align, trust (merged) */
            {
              right: false,
              headline: "363,000 Standards. Search Them. Every Lesson Covers Them.",
              body: "Every lesson is automatically aligned to your state's standards — quietly, in the background, without turning it into a worksheet. But when you want control, type what you want to teach in plain language and find the exact standards across your state's framework. Select the ones you want, hit create, and get a lesson built around them. Standards alignment is both a guarantee and a tool.",
              note: "All 50 states · Natural language search · Automatic alignment",
              visual: (
                <div className="wc-card wc-card-parchment frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {/* Search bar mockup */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "0.5rem 0.65rem" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink)" }}>animal habitats</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: "#C4983D", fontWeight: 600, letterSpacing: "0.05em" }}>AI SEARCH</span>
                  </div>

                  {/* Results with checkboxes */}
                  {[
                    { code: "2-LS4-1", desc: "Your child observes living things in different places and compares what she finds.", score: 95, checked: true },
                    { code: "2-ESS2-1", desc: "Your child can compare different ways people try to stop wind or water from changing the land.", score: 88, checked: true },
                    { code: "K-2-ETS1-2", desc: "Your child can draw or build a simple model to show how shape helps something do its job.", score: 72, checked: false },
                  ].map(({ code, desc, score, checked }) => (
                    <div key={code} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", background: checked ? "rgba(196,152,61,0.06)" : "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "0.45rem 0.6rem", border: checked ? "1px solid rgba(196,152,61,0.2)" : "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: checked ? "2px solid #C4983D" : "2px solid rgba(0,0,0,0.15)", background: checked ? "#C4983D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1rem" }}>
                        {checked && <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#059669", fontWeight: 600 }}>{code}</span>
                          <span style={{ fontSize: "0.5rem", padding: "0.1rem 0.3rem", borderRadius: "4px", background: "rgba(5,150,105,0.1)", color: "#059669" }}>{score}%</span>
                        </div>
                        <p style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.35, marginTop: "0.1rem" }}>{desc}</p>
                      </div>
                    </div>
                  ))}

                  {/* Standard pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {["2.OA.1", "NGSS-LS1.A", "CCSS.ELA.RI.3.1", "MI.SS.3.H1"].map((s) => (
                      <span key={s} style={{ fontSize: "0.58rem", padding: "0.2rem 0.45rem", borderRadius: "5px", background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(110,110,158,0.18)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              ),
            },
            /* 5. Worksheets — hidden behind feature flag, will re-add when ready */
            /* 6. Per-child progress tracking */
            {
              right: true,
              headline: "Track Every Child's Progress Across Standards",
              body: "Every completed lesson automatically tracks which standards each child has covered. See gaps at a glance, know exactly where they are in the scope and sequence, and never wonder 'have we covered this?' again.",
              note: "Per-child tracking · Visual progress · Gaps identified automatically",
              visual: (
                <div className="wc-card wc-card-parchment frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div className="font-cormorant-sc" style={{ fontSize: "0.9rem", color: "var(--ink)", marginBottom: "0.25rem" }}>Jack&apos;s Progress — Grade 4 Math</div>
                  {[
                    { domain: "Operations & Algebraic Thinking", pct: 72 },
                    { domain: "Number & Base Ten", pct: 45 },
                    { domain: "Fractions", pct: 20 },
                    { domain: "Measurement & Data", pct: 60 },
                  ].map(({ domain, pct }) => (
                    <div key={domain}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        <span>{domain}</span>
                        <span style={{ fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: "3px", width: `${pct}%`, background: pct > 60 ? "#5A947A" : pct > 30 ? "#C4983D" : "#C07A42" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ),
            },
            /* 7. Learning notes */
            {
              right: false,
              headline: "Every Child Learns Differently. Now Your Lessons Can Reflect That.",
              body: "Add a learning note to any child's profile — their preferences, accommodations, or anything you know about how they learn best. Every lesson we create adapts around it. Not a rigid filter. Not a separate mode. Just a quiet, intelligent consideration woven into the lesson alongside your philosophy and their interests.",
              note: "Works especially well for 2E learners, ADHD, sensory differences, and any child who doesn't fit the standard mold.",
              visual: (
                <div className="wc-card wc-card-lavender frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* Child profile card */}
                  <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span className="font-cormorant-sc" style={{ fontSize: "0.9rem", color: "var(--ink)" }}>Elias</span>
                      <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "5px", background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)" }}>Grade 3</span>
                    </div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "0.3rem" }}>
                      Learning notes
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.55, fontStyle: "italic", background: "rgba(196,152,61,0.06)", borderRadius: "6px", padding: "0.5rem 0.65rem", border: "1px solid rgba(196,152,61,0.18)" }}>
                      &ldquo;Learns best with hands-on activities. Has ADHD — short bursts work better than one long session. Loves animals and anything he can build.&rdquo;
                    </div>
                  </div>
                  {/* Arrow */}
                  <div style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>↓ every lesson created</div>
                  {/* Lesson output card */}
                  <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-secondary)", marginBottom: "0.4rem" }}>
                      Adapted for Elias
                    </div>
                    {[
                      "Break the observation activity into two 10-minute segments with a movement break between them.",
                      "Let him handle the materials himself — resist the urge to demonstrate first.",
                      "Connect the building extension to something he can construct at home.",
                    ].map((tip) => (
                      <div key={tip} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: "var(--accent-secondary)", flexShrink: 0, fontSize: "0.7rem", marginTop: "0.1rem" }}>✓</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            /* 8. Explore map — last */
            {
              right: true,
              headline: "Explore the Universe of Educational Philosophy",
              body: "The Explore map is a visual space for discovery. Find the curriculum that fits your family.",
              note: "Paired with the Compass Quiz, it answers the question every new homeschool parent has: where do I even begin?",
              visual: (
                <div className="home-explore-card" style={{ position: "relative", borderRadius: "14px", overflow: "hidden", height: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "2px solid rgba(196,152,61,0.4)" }}>
                  <iframe
                    src="/explore?embed=true"
                    title="Explore the curriculum map"
                    scrolling="no"
                    className="home-explore-iframe"
                    style={{
                      border: "none",
                      width: "250%",
                      height: "1000px",
                      transform: "scale(0.4)",
                      transformOrigin: "top left",
                      pointerEvents: "none",
                      display: "block",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 40%, rgba(11,46,74,0.92) 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "1.5rem",
                  }}>
                    <div>
                      <p style={{ fontSize: "0.82rem", color: "rgba(249,246,239,0.75)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                        100+ curricula · scored to your archetype · free to explore
                      </p>
                      <Link href="/explore" style={{
                        fontSize: "0.9rem",
                        padding: "0.65rem 1.5rem",
                        borderRadius: "10px",
                        background: "transparent",
                        color: "#F9F6EF",
                        border: "2px solid rgba(196,152,61,0.7)",
                        display: "inline-block",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}>
                        Open the Explore Map →
                      </Link>
                    </div>
                  </div>
                </div>
              ),
            },
          ].map(({ right, headline, body, note, visual }) => (
            <div key={headline} className="home-feature-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
              {right ? (
                <>
                  <div className="home-feature-text">
                    <h3 className="font-cormorant-sc" style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--ink)", marginBottom: "1rem", letterSpacing: "0.03em" }}>{headline}</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{body}</p>
                    {note && <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>{note}</p>}
                  </div>
                  <div className="home-feature-visual">{visual}</div>
                </>
              ) : (
                <>
                  <div className="home-feature-visual">{visual}</div>
                  <div className="home-feature-text">
                    <h3 className="font-cormorant-sc" style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--ink)", marginBottom: "1rem", letterSpacing: "0.03em" }}>{headline}</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{body}</p>
                    {note && <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>{note}</p>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Full-width image ─────────────────────────────────── */}
      <section style={{ padding: "2rem 0", display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <img
          src="/kids-strip.png"
          alt="Children learning outdoors"
          style={{ width: "100%", maxWidth: "1000px", height: "auto", display: "block" }}
        />
      </section>

      {/* ── Section 7: Founder ─────────────────────────────────────────── */}
      <section className="home-founder-section" style={{ padding: "5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "4rem", alignItems: "start" }}>
          {/* Founder photo – decorative oval frame */}
          <div className="home-founder-photo" style={{ aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: "90%",
              aspectRatio: "3/4",
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 0 0 6px rgba(237,223,223,0.5), 0 0 0 12px rgba(237,223,223,0.25)",
            }}>
              <img
                src="/founder.jpg"
                alt="Founder portrait"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          </div>

          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
              Built by an Educator. For Educators.
            </p>
            <h2 className="font-cormorant-sc" style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--ink)", marginBottom: "1.25rem", lineHeight: 1.3 }}>
              I&apos;ve Spent 14 Years Learning What You&apos;re Trying to Figure Out.
            </h2>
            <p className="font-cormorant" style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
              Every week, lesson planning took hours. Matching the right activity to the right child, the right philosophy to the right standard, is genuinely hard. I taught across three states in my own home, in micro schools, and co-ops, and finally found a method that works.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {["M.Ed. in Education", "14 Years Teaching", "Homeschooled Own Children", "Directed Micro School Projects", "Taught Across 3 States"].map((chip) => (
                <span key={chip} style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem", borderRadius: "8px", background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.07)", color: "var(--text-secondary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  {chip}
                </span>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 8: Pricing ─────────────────────────────────────────── */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* ── Section 9: Final CTA ───────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 className="font-cormorant-sc" style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)", lineHeight: 1.3, marginBottom: "1.25rem" }}>
            You&apos;ve been figuring this out on your own.
            <br />You don&apos;t have to anymore.
          </h2>
          <p className="font-cormorant" style={{ fontSize: "1.15rem", fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Take the free Compass Quiz. Find your teaching archetype. Create your first lesson in two minutes.
          </p>
          <Link href="/compass" className="btn-night" style={{ fontSize: "1.05rem", padding: "0.9rem 2.5rem", borderRadius: "12px" }}>
            Take the Compass Quiz — It&apos;s Free
          </Link>
          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
            5 minutes · No credit card · Discover your archetype
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
            Already know your philosophy?{" "}
            <Link href="/create" style={{ color: "var(--accent-primary)" }}>
              Jump straight to lesson generation →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background: "#082f4e", color: "var(--parchment)", padding: "3rem 1.5rem" }}>
        <div className="home-footer-grid" style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div>
            <div className="font-cormorant-sc" style={{ fontSize: "1.1rem", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
              The Sage&apos;s Compass
            </div>
            <p style={{ fontSize: "0.82rem", color: "rgba(249,246,239,0.6)", lineHeight: 1.6, maxWidth: "260px" }}>
              Custom curriculum for homeschool families — matched to your philosophy, your child&apos;s curiosity, and your state&apos;s standards.
            </p>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(249,246,239,0.45)", marginBottom: "0.75rem" }}>Product</div>
            {[["Compass Quiz", "/compass"], ["Archetypes", "/archetypes"], ["Create Lessons", "/create"], ["Explore Map", "/explore"], ["Suggest a Curriculum", "/contact?subject=curriculum-suggestion"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "rgba(249,246,239,0.65)", marginBottom: "0.4rem", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(249,246,239,0.45)", marginBottom: "0.75rem" }}>Account</div>
            {[["Dashboard", "/dashboard"], ["Lessons", "/lessons"], ["Calendar", "/calendar"], ["Standards", "/standards"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "rgba(249,246,239,0.65)", marginBottom: "0.4rem", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(249,246,239,0.45)", marginBottom: "0.75rem" }}>Legal</div>
            {[["Privacy Policy", "/privacy"], ["Terms of Use", "/terms"], ["Contact", "/contact"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "rgba(249,246,239,0.65)", marginBottom: "0.4rem", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: "1100px", margin: "2rem auto 0", paddingTop: "1.5rem", borderTop: "1px solid rgba(249,246,239,0.1)", fontSize: "0.75rem", color: "rgba(249,246,239,0.35)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>© {new Date().getFullYear()} The Sage&apos;s Compass. All rights reserved.</span>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href="https://www.instagram.com/sages_compass/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61576395340974" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Hook lines per archetype ─────────────────────────────────────────────────
function archetypeHook(id: string): string {
  const hooks: Record<string, string> = {
    "the-guide": "Clear direction, rigorous academics, measurable milestones",
    "the-explorer": "The world is the classroom. It always has been",
    "the-cultivator": "Prepare the environment and let the child choose. Trust the process",
    "the-naturalist": "Seasons, soil, and sky teach better than any textbook",
    "the-storyteller": "Living books, narration, and the beauty of great ideas",
    "the-architect": "Learning means building something real",
    "the-free-spirit": "Trust. Curiosity. Freedom. Children know what they need",
    "the-weaver": "Adapting, blending, and drawing from every tool the teaching world offers",
  };
  return hooks[id] ?? "";
}
