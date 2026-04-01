"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import { PricingSection } from "@/components/pricing-section";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  __experimental_CheckoutProvider as CheckoutProvider,
  __experimental_PaymentElement as PaymentElement,
  __experimental_usePaymentElement as usePaymentElement,
} from "@clerk/react";

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

interface SelectedPlan {
  key: PlanKey;
  planId: string;
  period: "month" | "annual";
}

// Separated so hooks aren't called conditionally
function CheckoutDrawer({
  plan,
  onClose,
  onSuccess,
}: {
  plan: SelectedPlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { submit, isFormReady } = (usePaymentElement as any)();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const display = PLAN_DISPLAY[plan.key];
  const priceInfo = plan.period === "annual" ? display.annual : display.monthly;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await submit();
    if (result?.error) {
      setError(result.error?.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(11,46,74,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 40,
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(420px, 100vw)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.2)",
      }}>
        {/* Dark navy header */}
        <div style={{
          background: "#0B2E4A",
          padding: "1.5rem 1.75rem",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2
                className="font-cormorant-sc"
                style={{ fontSize: "1.4rem", fontWeight: 700, color: "#F9F6EF", margin: 0, letterSpacing: "0.04em" }}
              >
                {display.name}
              </h2>
              <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                <span className="font-cormorant-sc" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#D4AF37" }}>
                  {priceInfo.price}
                </span>
                <span style={{ fontSize: "0.8rem", color: "rgba(249,246,239,0.5)" }}>
                  {priceInfo.period}
                </span>
              </div>
              {"billed" in priceInfo && (
                <p style={{ fontSize: "0.72rem", color: "rgba(249,246,239,0.4)", margin: "0.25rem 0 0" }}>
                  {(priceInfo as { billed: string }).billed}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(249,246,239,0.1)",
                border: "none",
                color: "rgba(249,246,239,0.6)",
                cursor: "pointer",
                borderRadius: "6px",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Payment form body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(249,246,239,0.98)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}>
          <PaymentElement />

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#B04040", margin: 0 }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormReady || submitting}
            style={{
              background: "#0B2E4A",
              color: "#F9F6EF",
              border: "none",
              borderRadius: "10px",
              padding: "0.85rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: isFormReady && !submitting ? "pointer" : "not-allowed",
              opacity: isFormReady && !submitting ? 1 : 0.5,
              width: "100%",
            }}
          >
            {submitting ? "Processing…" : `Subscribe to ${display.name}`}
          </button>

          <p style={{ fontSize: "0.72rem", color: "#8a8a8a", textAlign: "center", margin: 0 }}>
            Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </div>
    </>
  );
}

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectPlan = (planKey: PlanKey, isAnnual: boolean) => {
    if (!isSignedIn) {
      router.push("/sign-up?redirect_url=/pricing");
      return;
    }
    setSelectedPlan({
      key: planKey,
      planId: PLAN_IDS[planKey],
      period: isAnnual ? "annual" : "month",
    });
  };

  return (
    <div
      className="watercolor-page hue-generate"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Nav />

      <main style={{ flex: 1 }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-primary)", marginBottom: "0.75rem" }}>
              You&apos;re in
            </p>
            <h2 className="font-cormorant-sc" style={{ fontSize: "2.2rem", color: "var(--ink)", marginBottom: "0.75rem" }}>
              Welcome to {selectedPlan ? PLAN_DISPLAY[selectedPlan.key].name : "your new plan"}
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
          <PricingSection onSelectPlan={handleSelectPlan} />
        )}
      </main>

      {/* Checkout drawer — only mounted when a plan is selected */}
      {selectedPlan && !success && (
        <CheckoutProvider planId={selectedPlan.planId} planPeriod={selectedPlan.period}>
          <CheckoutDrawer
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
            onSuccess={() => setSuccess(true)}
          />
        </CheckoutProvider>
      )}
    </div>
  );
}
