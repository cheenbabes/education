import type { Metadata } from "next";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Sage's Compass collects, uses, and protects your personal information. COPPA-compliant and designed for family privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="watercolor-page" style={{ minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        {/* Header */}
        <h1
          className="font-cormorant-sc"
          style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "0.5rem" }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2.5rem" }}>
          Effective date: April 1, 2026
        </p>

        {/* Introduction */}
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "2rem" }}>
          The Sage&rsquo;s Compass (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your
          privacy and the privacy of your children. This Privacy Policy explains what information we collect,
          how we use it, and your rights regarding that information. By using our platform, you agree to
          the practices described below.
        </p>

        {/* Section 1 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          1. Information We Collect
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We collect the following categories of information:
        </p>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Account information.</strong> When you register, we
            collect your name and email address through Clerk, our authentication provider. We do not
            store passwords directly — authentication is handled by Clerk.
          </li>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Child profiles.</strong> Parents and guardians may
            create profiles for their children. Each profile may include the child&rsquo;s first name,
            grade level, and date of birth. This information is entered by the parent and associated
            with the parent&rsquo;s account only.
          </li>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Lesson usage and history.</strong> We record the
            lessons you generate and your usage history on the platform so you can access past content
            and track curriculum progress.
          </li>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Billing information.</strong> Subscription and
            payment processing is handled by Clerk, our authentication and billing provider. We do
            not store your credit card number or full payment details. We retain only the subscription
            tier and status necessary to provide your plan features.
          </li>
        </ul>

        {/* Section 2 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          2. Children&rsquo;s Data and COPPA
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          The Sage&rsquo;s Compass is designed for use by parents and guardians, not directly by children.{" "}
          <strong style={{ color: "var(--ink)" }}>Children under the age of 13 may not create their
          own accounts.</strong> All child profiles are created and managed by a parent or guardian on
          behalf of their child.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Child profile data (name, grade, date of birth) is associated exclusively with the
          parent&rsquo;s account. We do not share, sell, rent, or disclose any child profile
          information to third parties for advertising, analytics, or any other purpose.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We comply with the Children&rsquo;s Online Privacy Protection Act (COPPA). If you believe
          we have inadvertently collected personal information from a child under 13 without parental
          consent, please contact us immediately at{" "}
          <a href="mailto:privacy@thesagescompass.com" style={{ color: "var(--ink)" }}>
            privacy@thesagescompass.com
          </a>{" "}
          and we will take prompt steps to delete that information.
        </p>

        {/* Section 3 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          3. Our Lesson Generation Engine
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          Our lesson generation engine is built on a knowledge base derived from primary educational
          philosophy texts, state standards frameworks, and years of pedagogical research. To bring
          that knowledge to life as complete, structured lesson plans, our engine uses
          OpenAI&rsquo;s API. When you request a lesson, we send educational parameters to
          OpenAI for processing — such as the subject topic, grade level, and teaching philosophy
          you have selected.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          <strong style={{ color: "var(--ink)" }}>We do not send personally identifiable child
          information to OpenAI.</strong> Your child&rsquo;s name, date of birth, and other
          profile details are never included in API requests. Only anonymized educational parameters
          are transmitted.
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          OpenAI&rsquo;s use of data submitted via API is governed by{" "}
          <a
            href="https://openai.com/policies/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            OpenAI&rsquo;s Privacy Policy
          </a>
          .
        </p>

        {/* Section 4 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          4. How We Use Your Information
        </h2>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>To create and manage your account and subscription.</li>
          <li style={{ marginBottom: "0.5rem" }}>To generate personalized lesson plans based on your inputs.</li>
          <li style={{ marginBottom: "0.5rem" }}>To store and display your lesson history and curriculum plans.</li>
          <li style={{ marginBottom: "0.5rem" }}>To process subscription payments through Clerk.</li>
          <li style={{ marginBottom: "0.5rem" }}>To respond to your support requests and communications.</li>
          <li style={{ marginBottom: "0.5rem" }}>To improve and maintain the platform.</li>
        </ul>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We do not sell your personal information. We do not use your data for targeted advertising.
        </p>

        {/* Section 5 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          5. Third-Party Services
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We use the following third-party services to operate the platform. Each service processes
          only the data necessary for its function and is bound by its own privacy policy.
        </p>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Clerk</strong> — Authentication, account
            management, and subscription billing. Clerk handles sign-up, sign-in, session management,
            and payment processing. Your email, name, and payment method details are stored with Clerk.
            We do not have access to your full card number.
          </li>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>OpenAI</strong> — Lesson generation engine.
            OpenAI receives anonymized educational parameters (topic, grade level, teaching philosophy)
            to power our lesson generation engine. No personally identifiable child data is ever sent.
          </li>
          <li style={{ marginBottom: "0.75rem" }}>
            <strong style={{ color: "var(--ink)" }}>Railway</strong> — Hosting and infrastructure.
            Railway hosts our web application and backend services, and may process request logs
            including IP addresses as part of normal infrastructure operation.
          </li>
        </ul>

        {/* Section 6 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          6. Data Retention
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We retain your account data, child profiles, and lesson history for as long as your account
          remains active. If you cancel your subscription, your data is retained to allow you to
          reactivate your account. If you request full account deletion, we will delete your personal
          data, child profiles, and lesson history within 30 days of your request, except where
          retention is required by law.
        </p>

        {/* Section 7 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          7. Your Rights and Choices
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          You have the right to:
        </p>
        <ul style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>Access the personal information we hold about you.</li>
          <li style={{ marginBottom: "0.5rem" }}>Correct inaccurate information in your account or child profiles.</li>
          <li style={{ marginBottom: "0.5rem" }}>Request deletion of your account and all associated data.</li>
          <li style={{ marginBottom: "0.5rem" }}>Withdraw consent for data processing where consent is the legal basis.</li>
        </ul>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:privacy@thesagescompass.com" style={{ color: "var(--ink)" }}>
            privacy@thesagescompass.com
          </a>
          .
        </p>

        {/* Section 8 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          8. Security
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We take reasonable technical and organizational measures to protect your personal
          information from unauthorized access, disclosure, or loss. Authentication and payment
          processing are handled by Clerk, and all data is transmitted over encrypted HTTPS
          connections. No method of transmission or storage is completely secure, and we cannot
          guarantee absolute security.
        </p>

        {/* Section 9 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          9. Changes to This Policy
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          We may update this Privacy Policy from time to time. When we do, we will update the
          effective date at the top of this page and, for material changes, notify you by email
          or by a prominent notice within the platform. Continued use of the platform after
          changes take effect constitutes acceptance of the updated policy.
        </p>

        {/* Section 10 */}
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          10. Contact Us
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1rem" }}>
          If you have questions, concerns, or requests regarding this Privacy Policy or your data,
          please contact us at:
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "3rem" }}>
          The Sage&rsquo;s Compass
          <br />
          <a href="mailto:privacy@thesagescompass.com" style={{ color: "var(--ink)" }}>
            privacy@thesagescompass.com
          </a>
        </p>

        {/* ── Third-Party Data Attributions ── */}
        <h2 className="font-cormorant-sc" style={{ fontSize: "1.25rem", color: "var(--ink)", marginBottom: "1rem" }}>
          Third-Party Data Attributions
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "3rem" }}>
          The interactive Explore star map uses constellation line data from{" "}
          <a href="https://zenodo.org/doi/10.5281/zenodo.10397192" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink)" }}>
            ConstellationLines
          </a>{" "}
          (CC BY 4.0).
        </p>
      </div>
    </div>
  );
}
