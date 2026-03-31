import { Shell } from "@/components/shell";

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
};

const teamMembers = [
  {
    name: "Jane Archer",
    role: "Founder & Curriculum Director",
    bio: "A lifelong educator with 15 years of experience spanning Montessori, classical, and Charlotte Mason traditions. Jane created Sage\u2019s Compass to help families find the teaching path that fits them best.",
  },
  {
    name: "Marcus Hale",
    role: "Lead Developer",
    bio: "Full-stack engineer and homeschool dad. Marcus builds the tools that bring the Compass vision to life, from lesson generation to the knowledge-graph explorer.",
  },
  {
    name: "Sofia Reyes",
    role: "Content & Community Lead",
    bio: "Former co-op organizer and curriculum reviewer. Sofia ensures every piece of content is inclusive, accurate, and genuinely helpful for independent educators.",
  },
];

export default function AboutPage() {
  return (
    <Shell hue="compass">
      <div className="max-w-5xl mx-auto space-y-12 py-4">
        {/* Header */}
        <div className="space-y-3">
          <h1
            className="font-cormorant-sc text-4xl"
            style={{ color: "#0B2E4A" }}
          >
            About Sage&apos;s Compass
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Sage&apos;s Compass is a platform for homeschool parents, co-op
            organizers, and micro-school teachers who want to make thoughtful,
            personalized curriculum decisions. We combine educational philosophy,
            standards alignment, and smart tooling so you can focus on what
            matters most&nbsp;&mdash;&nbsp;teaching.
          </p>
        </div>

        {/* Mission section */}
        <section className="space-y-4">
          <h2
            className="font-cormorant-sc text-2xl"
            style={{ color: "#0B2E4A" }}
          >
            Our Mission
          </h2>
          <div style={frostCard} className="space-y-3">
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              We believe every family deserves access to the same depth of
              curriculum guidance that the best private schools enjoy. Our tools
              help you discover your teaching archetype, explore philosophies,
              generate differentiated lesson plans, and track standards
              coverage&nbsp;&mdash;&nbsp;all in one place.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Whether you lean toward nature-based learning, classical rigor, or
              something entirely your own, Sage&apos;s Compass meets you where
              you are and helps you chart a path forward.
            </p>
          </div>
        </section>

        {/* Team section */}
        <section className="space-y-4">
          <h2
            className="font-cormorant-sc text-2xl"
            style={{ color: "#0B2E4A" }}
          >
            The Team
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} style={frostCard} className="space-y-3">
                {/* Avatar placeholder */}
                <div
                  className="mx-auto flex items-center justify-center"
                  style={{
                    width: "5rem",
                    height: "5rem",
                    borderRadius: "50%",
                    background: "rgba(11,46,74,0.08)",
                    border: "2px solid rgba(196,152,61,0.25)",
                  }}
                >
                  <span
                    className="font-cormorant-sc text-xl"
                    style={{ color: "#0B2E4A" }}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>

                {/* Info */}
                <div className="text-center space-y-1">
                  <p
                    className="font-cormorant-sc text-lg"
                    style={{ color: "#0B2E4A", fontWeight: 600 }}
                  >
                    {member.name}
                  </p>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "#C4983D", fontWeight: 500 }}
                  >
                    {member.role}
                  </p>
                </div>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Consultation booking */}
        <section className="space-y-4">
          <h2
            className="font-cormorant-sc text-2xl"
            style={{ color: "#0B2E4A" }}
          >
            Book a Consultation
          </h2>
          <div
            style={{
              ...frostCard,
              borderLeft: "3px solid #C4983D",
              display: "flex",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            {/* Photo placeholder */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(196,152,61,0.12)",
                border: "2px solid rgba(196,152,61,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "1.5rem", color: "#C4983D" }}>JA</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3
                className="font-cormorant-sc"
                style={{ fontSize: "1.1rem", color: "#0B2E4A", marginBottom: "0.35rem" }}
              >
                1-on-1 with the Founder
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}
              >
                Book a one-hour consultation with Jane to go deep on philosophy
                selection, curriculum planning, teaching strategies, or
                multi-age differentiation. Whether you&apos;re just starting out or
                rethinking your approach mid-year, get personalized guidance from
                a master educator with 15 years of experience across Montessori,
                Classical, Charlotte Mason, and more.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <a
                  href="https://calendly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#0B2E4A",
                    color: "#F9F6EF",
                    borderRadius: "10px",
                    padding: "0.5rem 1.2rem",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Book a Call
                </a>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                  $160 / hour &middot; Philosophy, curriculum &amp; teaching strategy
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Values section */}
        <section className="space-y-4 pb-8">
          <h2
            className="font-cormorant-sc text-2xl"
            style={{ color: "#0B2E4A" }}
          >
            What We Value
          </h2>
          <div style={frostCard}>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li className="flex items-start gap-2">
                <span style={{ color: "#C4983D", flexShrink: 0 }}>&bull;</span>
                <span>
                  <strong style={{ color: "#0B2E4A", fontWeight: 500 }}>Respect for the teacher.</strong>{" "}
                  You know your children best. Our tools inform; they never prescribe.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#C4983D", flexShrink: 0 }}>&bull;</span>
                <span>
                  <strong style={{ color: "#0B2E4A", fontWeight: 500 }}>Philosophy-first design.</strong>{" "}
                  Every feature is grounded in real pedagogical traditions, not trends.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#C4983D", flexShrink: 0 }}>&bull;</span>
                <span>
                  <strong style={{ color: "#0B2E4A", fontWeight: 500 }}>Transparency.</strong>{" "}
                  Open data, honest recommendations, and no hidden agendas.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </Shell>
  );
}
