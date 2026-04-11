import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { SITE_HOSTNAME, SITE_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Data Deletion",
  description:
    "How to request deletion of your data from The Sage's Compass.",
};

export default function DataDeletionPage() {
  return (
    <div className="watercolor-page" style={{ minHeight: "100vh" }}>
      <Nav />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h1
          className="font-cormorant-sc"
          style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "0.5rem" }}
        >
          Data Deletion Instructions
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2.5rem" }}>
          How to delete your data from The Sage&rsquo;s Compass
        </p>

        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          If you signed up for The Sage&rsquo;s Compass using Facebook Login and would like to
          delete your data, you can do so using either of the methods below. All associated data
          &mdash; including your account, child profiles, and lesson history &mdash; will be
          permanently deleted within 30 days of your request.
        </p>

        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          Option 1: Delete Through Your Account
        </h2>
        <ol style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            Sign in to your account at{" "}
            <a href={SITE_ORIGIN} style={{ color: "var(--ink)" }}>
              {SITE_HOSTNAME}
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Go to <strong style={{ color: "var(--ink)" }}>Account Settings</strong>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Click <strong style={{ color: "var(--ink)" }}>Delete Account</strong> and confirm
          </li>
        </ol>

        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          Option 2: Email Us
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          Send an email to{" "}
          <a href="mailto:privacy@thesagescompass.com" style={{ color: "var(--ink)" }}>
            privacy@thesagescompass.com
          </a>{" "}
          with the subject line &ldquo;Data Deletion Request&rdquo; and include the email address
          associated with your account. We will process your request and confirm deletion within
          30 days.
        </p>

        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.1rem", color: "var(--ink)", marginBottom: "0.75rem", marginTop: "2rem" }}
        >
          Removing Facebook Permissions
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          You can also revoke our app&rsquo;s access to your Facebook account at any time:
        </p>
        <ol style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, paddingLeft: "1.5rem", marginBottom: "3rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            Go to your{" "}
            <a
              href="https://www.facebook.com/settings/?tab=applications"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ink)" }}
            >
              Facebook App Settings
            </a>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Find <strong style={{ color: "var(--ink)" }}>The Sage&rsquo;s Compass</strong> and click <strong style={{ color: "var(--ink)" }}>Remove</strong>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            This revokes our access but does not delete data already stored &mdash; use one of the methods above for full deletion
          </li>
        </ol>
      </div>
    </div>
  );
}
