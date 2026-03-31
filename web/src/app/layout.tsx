import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Sage's Compass — Homeschool Curriculum for Your Family",
  description: "Discover your teaching archetype, then generate custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
