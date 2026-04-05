import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teaching Archetypes",
  description:
    "Explore the eight homeschool teaching archetypes — from The Architect to The Free Spirit — and find which approach fits your family.",
};

export default function ArchetypesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
