import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Curriculum",
  description:
    "Explore homeschool curricula, teaching philosophies, and learning approaches on an interactive knowledge graph.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
