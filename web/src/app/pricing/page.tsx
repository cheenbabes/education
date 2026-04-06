"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav } from "@/components/nav";
import { PricingSection } from "@/components/pricing-section";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CheckoutButton } from "@clerk/react/experimental";

type PlanKey = "homestead" | "schoolhouse";

const PLAN_IDS: Record<PlanKey, string> = {
  homestead: process.env.NEXT_PUBLIC_CLERK_PLAN_HOMESTEAD ?? "",
  schoolhouse: process.env.NEXT_PUBLIC_CLERK_PLAN_SCHOOLHOUSE ?? "",
};

const PLAN_DISPLAY: Record<PlanKey, {
  name: string;
  monthly: { price: string; period: string };
  annual: { price: string; period: string; billed: string };
}> = {
  homestead: {
    name: "Homestead",
    monthly: { price: "$21.99", period: "/ month" },
    annual: { price: "$16.58", period: "/ month", billed: "billed $199 / year" },
  },
  schoolhouse: {
    name: "Schoolhouse",
    monthly: { price: "$29.99", period: "/ month" },
    annual: { price: "$23.25", period: "/ month", billed: "billed $279 / year" },
  },
};

const DRAWER_WIDTH = 420;

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [success, setSuccess] = useState<PlanKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detect when Clerk's checkout drawer closes (e.g. user clicks backdrop)
  // by watching for its removal from the DOM
  useEffect(() => {
    if (!drawerOpen) return;
    const observer = new MutationObserver(() => {
      // Clerk renders its drawer in a portal — look for it
      const drawer = document.querySelector("[data-clerk-portal], .cl-modalBackdrop, [role='dialog']");
      if (!drawer) setDrawerOpen(false);
    });
    // Small delay to let Clerk render the drawer before observing
    const timer = setTimeout(() => {
      observer.observe(document.body, { childList: true, subtree: true });
    }, 500);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [drawerOpen]);

  const handleSelectPlan = (planKey: PlanKey, isAnnual: boolean) => {
    if (!isSignedIn) {
      router.push("/sign-up?redirect_url=/pricing");
      return;
    }
  };

  const handleCheckoutClick = useCallback(() => {
    // Small delay — Clerk opens the drawer after the click propagates
    setTimeout(() => setDrawerOpen(true), 100);
  }, []);

  return (
    <div
      className="watercolor-page hue-generate"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        transition: "padding-right 0.3s ease",
        paddingRight: drawerOpen ? `${DRAWER_WIDTH}px` : undefined,
      }}
    >
      <Nav />

      <main style={{ flex: 1 }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
              You&apos;re in
            </p>
            <h2 className="font-cormorant-sc" style={{ fontSize: "2.2rem", color: "var(--ink)", marginBottom: "0.75rem" }}>
              Welcome to {PLAN_DISPLAY[success].name}
            </h2>
            <p className="font-cormorant" style={{ fontSize: "1.1rem", fontStyle: "italic", color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Your subscription is active. Start creating lessons for your family.
            </p>
            <a
              href="/dashboard"
              style={{
                background: "#0B2E4A",
                color: "#F9F6EF",
                padding: "0.75rem 2rem",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Go to Dashboard →
            </a>
          </div>
        ) : (
          <PricingSection
            onSelectPlan={handleSelectPlan}
            renderCheckout={isSignedIn ? (planKey, isAnnual) => {
              const featured = planKey === "homestead";
              return (
                <div onClick={handleCheckoutClick}>
                  <CheckoutButton
                    planId={PLAN_IDS[planKey]}
                    planPeriod={isAnnual ? "annual" : "month"}
                    onSubscriptionComplete={() => { setDrawerOpen(false); setSuccess(planKey); }}
                  >
                    <button
                      style={{
                        width: "100%",
                        fontSize: "0.85rem",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        boxSizing: "border-box",
                        background: featured ? "rgba(212,175,55,0.9)" : "var(--night)",
                        color: featured ? "var(--night)" : "var(--parchment)",
                      }}
                    >
                      Start {PLAN_DISPLAY[planKey].name}
                    </button>
                  </CheckoutButton>
                </div>
              );
            } : undefined}
          />
        )}
      </main>
    </div>
  );
}
