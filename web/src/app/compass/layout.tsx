import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teaching Archetype Assessment",
  description:
    "Take the Sage's Compass assessment to discover your teaching archetype and get curriculum recommendations matched to your homeschool philosophy.",
};

export default function CompassLayout({ children }: { children: React.ReactNode }) {
  return children;
}
