"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

/**
 * Shown when a user can't access content.
 * - Not signed in → redirect to sign-in after 3s
 * - Signed in but unauthorized → show message + link to dashboard
 */
export function Unauthorized({ message }: { message?: string }) {
  const { isSignedIn, isLoaded } = useUser();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
            clearInterval(timer);
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSignedIn, isLoaded]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <h2
          className="font-cormorant-sc"
          style={{ fontSize: "1.75rem", color: "#0B2E4A", marginBottom: "1rem" }}
        >
          Sign In Required
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#5A5A5A", marginBottom: "1.5rem" }}>
          You need to be signed in to view this page. Redirecting to sign in{countdown > 0 ? ` in ${countdown}s` : ""}...
        </p>
        <Link
          href={`/sign-in?redirect_url=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "/"}`}
          style={{
            background: "#0B2E4A",
            color: "#F9F6EF",
            borderRadius: "10px",
            padding: "0.6rem 1.4rem",
            fontSize: "0.85rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  // Signed in but unauthorized
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <h2
        className="font-cormorant-sc"
        style={{ fontSize: "1.75rem", color: "#0B2E4A", marginBottom: "1rem" }}
      >
        Not Authorized
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#5A5A5A", marginBottom: "1.5rem", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
        {message || "You don't have permission to view this content."}
      </p>
      <Link
        href="/dashboard"
        style={{
          background: "#0B2E4A",
          color: "#F9F6EF",
          borderRadius: "10px",
          padding: "0.6rem 1.4rem",
          fontSize: "0.85rem",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
