import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with The Sage's Compass team. Questions about homeschool curriculum, your account, or partnerships — we'd love to hear from you.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
