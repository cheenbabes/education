import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the plan that fits your family — free tier to get started, or upgrade for unlimited AI-generated lesson plans and full standards tracking.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
