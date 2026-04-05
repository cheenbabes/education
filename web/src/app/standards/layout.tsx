import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "State Standards Tracker",
  description:
    "Track your homeschool progress against your state's academic standards. See which standards your lessons cover and identify gaps.",
};

export default function StandardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
