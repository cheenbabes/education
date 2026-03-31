import { Nav } from "@/components/nav";

export default function TermsPage() {
  return (
    <div className="watercolor-page" style={{ minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        {/* Header */}
        <h1
          className="font-cormorant-sc"
          style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "0.5rem" }}
        >
          Terms of Use
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2.5rem" }}>
          Effective date: April 1, 2026
        </p>

        {/* Introduction */}
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "2rem" }}>
          These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of The Sage&rsquo;s
          Compass platform, including all lesson generation tools, curriculum planning features, and
          related content (collectively, the &ldquo;Service&rdquo;). By creating an account or using the
          Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        {/* Section 1 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          1. Eligibility and Acceptable Use
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          The Service is intended for K&ndash;12 home education purposes only. To create an account,
          you must be at least 18 years old and acting as a parent, guardian, or authorized educator
          for the children whose profiles you manage.{" "}
          <strong style={{ color: "var(--ink)" }}>Children under 13 may not create their own
          accounts.</strong> All child profiles must be created by a parent or guardian.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          You agree to use the Service only for lawful, educational purposes. You must not:
        </p>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>Attempt to generate content that is inappropriate, harmful, or unsuitable for children.</li>
          <li style={{ marginBottom: "0.5rem" }}>Use the Service for any purpose other than K&ndash;12 family education.</li>
          <li style={{ marginBottom: "0.5rem" }}>Circumvent, disable, or interfere with security features of the Service.</li>
          <li style={{ marginBottom: "0.5rem" }}>Attempt to access other users&rsquo; accounts or data.</li>
          <li style={{ marginBottom: "0.5rem" }}>Use automated scripts or bots to generate content in bulk.</li>
        </ul>

        {/* Section 2 — CRITICAL: No Resale */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          2. License and Restrictions on Generated Content
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Subject to these Terms and your active subscription, we grant you a limited, non-exclusive,
          non-transferable license to use lesson plans, worksheets, curriculum plans, and other
          content generated through the Service (&ldquo;Generated Content&rdquo;) for your own
          personal, non-commercial, family educational use.
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.75,
            marginBottom: "1rem",
            padding: "1rem 1.25rem",
            background: "rgba(11,46,74,0.05)",
            borderLeft: "3px solid var(--ink)",
            borderRadius: "0 6px 6px 0",
            color: "var(--text-secondary)",
          }}
        >
          <strong style={{ color: "var(--ink)" }}>No Resale or Commercial Use.</strong> Generated
          Content is licensed for personal, non-commercial, family educational use only. Resale,
          redistribution, or commercial use of Generated Content — including as part of a paid
          curriculum package, tutoring service, coaching program, or educational product — is
          strictly prohibited and constitutes a material breach of these Terms. This restriction
          applies regardless of how the content is modified or presented.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          You may print, save, and share Generated Content within your immediate family for
          educational purposes. Sharing with a small, informal home education co-op for non-commercial
          use is permitted provided no fees are charged for the content itself.
        </p>

        {/* Section 3 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          3. Our Lesson Generation Engine
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Our lesson generation engine is built on a curated knowledge base of educational philosophy
          texts, state standards frameworks, and pedagogical research. To produce complete, structured
          lesson plans from that knowledge base, our engine uses OpenAI&rsquo;s API. Every lesson
          reflects the philosophy, grade level, and subject parameters you provide — the output is
          shaped by our engine, not by a generic prompt.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Because our engine relies on AI-assisted generation, we cannot guarantee that every lesson
          will be perfectly complete or free of error. We encourage you to review each lesson before
          use and apply your own knowledge of your children&rsquo;s needs. You know your family best
          — our engine is designed to give you a thoughtful, well-structured starting point, not to
          replace your judgment as an educator. The parent or educator bears final responsibility for
          the educational suitability of all content used with their children.
        </p>

        {/* Section 4 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          4. Account and Sharing
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Each subscription is for use by one family household. You are responsible for maintaining
          the confidentiality of your account credentials and for all activity that occurs under
          your account. You may not share your account login with individuals outside your household.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Co-operative organizations, micro-schools, tutoring centers, or other multi-family or
          institutional uses require a Co-op plan. Using a standard family subscription to serve
          multiple unrelated families violates these Terms.
        </p>

        {/* Section 5 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          5. Subscriptions and Billing
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We offer the following subscription tiers:
        </p>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--ink)" }}>Compass</strong> — Free, with limited features.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--ink)" }}>Homestead</strong> — $21.99/month.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--ink)" }}>Schoolhouse</strong> — $29.99/month.
          </li>
        </ul>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Monthly plans renew automatically at the end of each billing period. Annual plans renew
          automatically on their anniversary date. You may cancel your subscription at any time
          through your account settings. Cancellation takes effect at the end of the current billing
          period; you retain access to paid features until that date. We do not offer refunds for
          partial billing periods unless required by applicable law.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We reserve the right to change subscription pricing with at least 30 days&rsquo; advance
          notice. Continued use of the Service after a price change takes effect constitutes
          acceptance of the new pricing.
        </p>

        {/* Section 6 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          6. Intellectual Property
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          The Service, including its design, features, underlying technology, and all non-generated
          content (interface text, educational philosophy descriptions, archetype assessments, and
          similar original material), is owned by The Sage&rsquo;s Compass and protected by
          applicable intellectual property laws. You may not copy, reproduce, or create derivative
          works from any part of the Service outside of the rights expressly granted in these Terms.
        </p>

        {/* Section 7 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          7. Termination
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          You may close your account at any time through your account settings or by contacting us.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We reserve the right to suspend or terminate your access to the Service at any time, with
          or without notice, for conduct that we believe violates these Terms, is harmful to other
          users, or is otherwise objectionable. In the case of a material breach (including
          unauthorized commercial use of Generated Content), we may terminate your account
          immediately. Upon termination, your license to use Generated Content also terminates.
        </p>

        {/* Section 8 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          8. Disclaimer of Warranties
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
          either express or implied, including but not limited to warranties of merchantability,
          fitness for a particular purpose, or non-infringement. We do not warrant that the Service
          will be uninterrupted, error-free, or that Generated Content will be accurate or complete.
        </p>

        {/* Section 9 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          9. Limitation of Liability
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          To the fullest extent permitted by law, The Sage&rsquo;s Compass shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages arising out of or
          related to your use of the Service or Generated Content, even if we have been advised of
          the possibility of such damages. Our total liability to you for any claims arising under
          these Terms shall not exceed the amount you paid us in the three months preceding the
          claim.
        </p>

        {/* Section 10 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          10. Changes to These Terms
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We may update these Terms from time to time. When we do, we will update the effective date
          at the top of this page. For material changes, we will provide notice via email or a
          prominent in-platform notice at least 14 days before the changes take effect. Continued
          use of the Service after updated Terms take effect constitutes your acceptance of those Terms.
        </p>

        {/* Section 11 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          11. Contact Us
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          If you have questions about these Terms or need to report a violation, please contact us at:
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "3rem" }}>
          The Sage&rsquo;s Compass
          <br />
          <a href="mailto:support@thesagescompass.com" style={{ color: "var(--ink)" }}>
            support@thesagescompass.com
          </a>
        </p>
      </div>
    </div>
  );
}
