import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { ARCHETYPES } from "@/lib/compass/archetypes";

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
      <section style={{ padding: "5rem 1.5rem 4rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>

          {/* Left: copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
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
              Discover your teaching archetype, explore curricula, generate custom, standards-aligned lesson plans for any philosophy — Montessori, Charlotte Mason, Classical, and more — in two minutes.
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
          </div>

          {/* Right: archetype ring */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <ArchetypeRing archetypes={ringArchetypes} />
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
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem",
          textAlign: "center",
        }}>
          {[
            { stat: "363,000+", desc: "State Standards Integrated." },
            { stat: "29 Foundational Texts", desc: "A library of materials supporting each pedagogy." },
            { stat: "100+ Curricula", desc: "Matched to Your Philosophy." },
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

        {/* 8-column grid — all cards in one line, no scrollbar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "0.6rem",
        }}>
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
          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>— Founder, M.Ed., EdD Student</p>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", alignItems: "stretch" }}>
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
                heading: "Type a Topic. Pick a Subject. Hit Generate.",
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
                    <div style={{ background: "var(--night)", color: "var(--parchment)", borderRadius: "8px", padding: "0.5rem", textAlign: "center", fontWeight: 500 }}>Generate Lesson</div>
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
            Lessons generated through a master educator&apos;s methodology.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          {[
            {
              right: true,
              headline: "Every lesson reflects your unique teaching philosophy",
              body: "Montessori math doesn't just include manipulatives. It follows Maria Montessori's concrete-to-abstract sequence, extracted from her original writings. Charlotte Mason lessons use living books, short sessions, and narration. Classical lessons build on critical thinking. 29 foundational texts, a library of materials for each pedagogy — that's what powers every lesson.",
              note: undefined,
              visual: (
                <div className="wc-card wc-card-sage frost-card" style={{ borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {/* Sample lesson card */}
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
                    { type: "Handicraft", desc: "Create a watercolor lifecycle diagram — egg, caterpillar, chrysalis, butterfly." },
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
            {
              right: false,
              headline: "Your State's Standards. Quietly, Behind Every Lesson.",
              body: "363,000+ standards across all 50 states, mapped to the K-12 scope. You choose the philosophy. We make sure the standards are covered — without turning your lesson into a worksheet. Standards alignment is a quiet background guarantee, not the whole point.",
              note: "All 50 states · 363,000+ standards · Automatically updated",
              visual: (
                <div className="wc-card wc-card-parchment frost-card" style={{ borderRadius: "12px", padding: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                  {["2.OA.1 — Operations & Algebraic Thinking", "NGSS-LS1.A — Life Science", "CCSS.ELA.RI.3.1 — Reading Informational", "MI.SS.3.H1 — History & Geography", "2.MD.5 — Measurement"].map((s) => (
                    <span key={s} style={{ fontSize: "0.68rem", padding: "0.25rem 0.55rem", borderRadius: "6px", background: "rgba(110,110,158,0.1)", color: "var(--accent-primary)", border: "1px solid rgba(110,110,158,0.2)" }}>{s}</span>
                  ))}
                </div>
              ),
            },
            {
              right: true,
              headline: "Explore the Universe of Educational Philosophy",
              body: "The Explore map lets you navigate 100+ curricula scored against your archetype, the 8 philosophy models, and the principles that connect them. It's not a dropdown list — it's a visual space for discovery. Find the curriculum that actually fits your family.",
              note: "Paired with the Compass Quiz, it answers the question every new homeschool parent has: where do I even begin?",
              visual: (
                <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", height: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                  <iframe
                    src="/explore?embed=true"
                    title="Explore the curriculum map"
                    scrolling="no"
                    style={{
                      border: "none",
                      width: "167%",
                      height: "667px",
                      transform: "scale(0.6)",
                      transformOrigin: "top left",
                      pointerEvents: "none",
                      display: "block",
                    }}
                  />
                  {/* Gradient overlay + CTA */}
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
                      <Link href="/explore" className="btn-night" style={{ fontSize: "0.9rem", padding: "0.65rem 1.5rem", borderRadius: "10px" }}>
                        Open the Explore Map →
                      </Link>
                    </div>
                  </div>
                </div>
              ),
            },
          ].map(({ right, headline, body, note, visual }) => (
            <div key={headline} style={{ display: "grid", gridTemplateColumns: right ? "1fr 1fr" : "1fr 1fr", gap: "3rem", alignItems: "center" }}>
              {right ? (
                <>
                  <div>
                    <h3 className="font-cormorant-sc" style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--ink)", marginBottom: "1rem", letterSpacing: "0.03em" }}>{headline}</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{body}</p>
                    {note && <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>{note}</p>}
                  </div>
                  <div>{visual}</div>
                </>
              ) : (
                <>
                  <div>{visual}</div>
                  <div>
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
      <section style={{ padding: "2rem 0", display: "flex", justifyContent: "center" }}>
        <img
          src="/kids-strip.png"
          alt="Children learning outdoors"
          style={{ width: "1200x", maxWidth: "none", height: "auto", display: "block" }}
        />
      </section>

      {/* ── Section 7: Founder ─────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "4rem", alignItems: "start" }}>
          {/* Founder photo – decorative oval frame */}
          <div style={{ aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              Every week, lesson planning took hours — not from ignorance. I had a master&apos;s degree in education. It was hard because matching the right activity to the right child, the right philosophy to the right standard, is genuinely hard. I taught across three states, in my own home, in micro schools and co-ops.
              <br /><br />
              I spent years studying the philosophies I now build into every lesson. Eventually I stopped wishing for a better tool and built one.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {["M.Ed. in Education", "EdD Student", "14 Years Teaching", "Homeschooled Own Children", "Ran Micro Schools", "Taught Across 3 States"].map((chip) => (
                <span key={chip} style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem", borderRadius: "8px", background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.07)", color: "var(--text-secondary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                  {chip}
                </span>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 8: Pricing ─────────────────────────────────────────── */}
      <section style={{
        padding: "5rem 1.5rem",
        background: "rgba(255,255,255,0.35)",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: "1.25rem", alignItems: "stretch" }}>
            {[
              { name: "Compass", price: "$0", period: "/ forever", features: ["Full Compass Quiz + archetype discovery", "3 lesson generations per month", "Top curriculum matches for your philosophy"], cta: "Start Free →", featured: false },
              { name: "Homestead", price: "$17.99", period: "/ month", badge: "Most Popular", features: ["30 lessons per month (unlimited annually)", "Up to 4 children, multi-child differentiation", "Full standards tracking across all 50 states", "Private community access"], cta: "Start Homestead →", featured: true },
              { name: "Homeschool", price: "$24.99", period: "/ month", features: ["Unlimited lessons, up to 6 children", "Full standards coverage reports", "Monthly AMA with the founder"], cta: "Start Homeschool →", featured: false },
            ].map(({ name, price, period, badge, features, cta, featured }) => (
              <div key={name} style={{
                padding: featured ? "2.25rem 1.75rem" : "1.75rem 1.5rem",
                margin: featured ? "-1.25rem 0" : "0",
                borderRadius: "14px",
                border: featured ? "none" : "1px solid rgba(255,255,255,0.5)",
                boxShadow: featured ? "0 12px 40px rgba(0,0,0,0.18)" : "0 2px 10px rgba(0,0,0,0.04)",
                background: featured ? "var(--night)" : "rgba(255,255,255,0.72)",
                backdropFilter: featured ? "none" : "blur(12px)",
                WebkitBackdropFilter: featured ? "none" : "blur(12px)",
                display: "flex",
                flexDirection: "column",
                position: "relative" as const,
                zIndex: featured ? 1 : 0,
              }}>
                {badge && (
                  <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "0.6rem" }}>{badge}</div>
                )}
                <div className="font-cormorant-sc" style={{ fontSize: "1.2rem", fontWeight: 600, color: featured ? "var(--parchment)" : "var(--ink)", marginBottom: "0.25rem" }}>{name}</div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <span className="font-cormorant-sc" style={{ fontSize: "1.75rem", fontWeight: 700, color: featured ? "var(--parchment)" : "var(--ink)" }}>{price}</span>
                  <span style={{ fontSize: "0.82rem", color: featured ? "rgba(249,246,239,0.5)" : "var(--text-tertiary)" }}> {period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                  {features.map((f) => (
                    <li key={f} style={{ fontSize: "0.82rem", color: featured ? "rgba(249,246,239,0.75)" : "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: featured ? "#D4AF37" : "var(--accent-secondary)", flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/compass" style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  background: featured ? "rgba(212,175,55,0.9)" : "var(--night)",
                  color: featured ? "var(--night)" : "var(--parchment)",
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "0.02em",
                }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "1.5rem" }}>
            All plans include all 8 teaching philosophies, the full Compass Quiz, and the Explore star map. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Section 9: Final CTA ───────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 className="font-cormorant-sc" style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink)", lineHeight: 1.3, marginBottom: "1.25rem" }}>
            You&apos;ve been figuring this out on your own.
            <br />You don&apos;t have to anymore.
          </h2>
          <p className="font-cormorant" style={{ fontSize: "1.15rem", fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Take the free Compass Quiz. Find your teaching archetype. Generate your first lesson in two minutes.
          </p>
          <Link href="/compass" className="btn-night" style={{ fontSize: "1.05rem", padding: "0.9rem 2.5rem", borderRadius: "12px" }}>
            Take the Compass Quiz — It&apos;s Free
          </Link>
          <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
            5 minutes · No credit card · Discover your archetype
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
            Already know your philosophy?{" "}
            <Link href="/generate" style={{ color: "var(--accent-primary)" }}>
              Jump straight to lesson generation →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background: "var(--night)", color: "var(--parchment)", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "3rem" }}>
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
            {[["Compass Quiz", "/compass"], ["Archetypes", "/archetypes"], ["Generate Lessons", "/generate"], ["Explore Map", "/explore"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "rgba(249,246,239,0.65)", marginBottom: "0.4rem", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(249,246,239,0.45)", marginBottom: "0.75rem" }}>Account</div>
            {[["Dashboard", "/dashboard"], ["Lessons", "/lessons"], ["Calendar", "/calendar"], ["Standards", "/standards"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: "block", fontSize: "0.85rem", color: "rgba(249,246,239,0.65)", marginBottom: "0.4rem", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: "1100px", margin: "2rem auto 0", paddingTop: "1.5rem", borderTop: "1px solid rgba(249,246,239,0.1)", fontSize: "0.75rem", color: "rgba(249,246,239,0.35)" }}>
          © {new Date().getFullYear()} The Sage&apos;s Compass. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// ── Archetype ring component ─────────────────────────────────────────────────
// Characters that naturally face left — don't auto-flip even when on right side of ring
const NO_AUTO_FLIP = new Set(["the-free-spirit", "the-architect", "the-storyteller"]);

// Per-character crop offsets (top/left as % of nodeSize, negative = shift up/left)
// top: how far down to start the crop (negative = shift image up, showing more of top)
// left: horizontal offset (negative = shift image left; positive = shift right)
const CROP_OFFSET: Record<string, { top?: string; left?: string; width?: string }> = {
  "the-weaver":    { top: "-30%" },          // show upper body clearly
  "the-architect": { top: "5%", left: "18%" }, // centre her horizontally in the circle
};

function ArchetypeRing({ archetypes }: { archetypes: typeof ARCHETYPES }) {
  const size = 540;
  const center = size / 2;
  const radius = 178;
  const nodeSize = 112;
  const compassSize = 325;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Center compass — no circle, image floats freely over transparent bg */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}>
        <Image src="/archetypes/tools/compass.png" alt="Compass" width={compassSize} height={compassSize} style={{ objectFit: "contain", display: "block" }} />
      </div>

      {/* Character nodes */}
      {archetypes.map((a, i) => {
        const angle = (i / archetypes.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const autoFlip = Math.cos(angle) > 0.1 && !NO_AUTO_FLIP.has(a.id);
        const crop = CROP_OFFSET[a.id] ?? {};
        return (
          <div
            key={a.id}
            title={a.name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: autoFlip
                ? "translate(-50%, -50%) scaleX(-1)"
                : "translate(-50%, -50%)",
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${a.color}`,
              boxShadow: `0 2px 12px rgba(0,0,0,0.12)`,
              zIndex: 1,
            }}
          >
            {/* img inside div: top/left move which part of the image is visible */}
            {/* top: 0 = show from very top; top: -20% = shift image up 20% of nodeSize */}
            {/* left: 0 = left-aligned; left: 10% = shift image right */}
            <img
              src={a.imagePath}
              alt={a.name}
              style={{
                position: "absolute",
                width: "100%",   // fills circle width; height auto-scales (taller = crops bottom)
                height: "auto",
                top: crop.top ?? "0%",
                left: crop.left ?? "0%",
              }}
            />
          </div>
        );
      })}

      {/* Connecting ring guide */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width={size} height={size}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(110,110,158,0.1)" strokeWidth="1" strokeDasharray="3 8" />
      </svg>
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
    "the-storyteller": "Living books, narration, the beauty of the world, and great ideas",
    "the-architect": "Learning means building something real",
    "the-free-spirit": "Trust. Curiosity. Freedom. Children know what they need",
    "the-weaver": "I adapt and value all the tools I have in my teaching toolbox",
  };
  return hooks[id] ?? "";
}
