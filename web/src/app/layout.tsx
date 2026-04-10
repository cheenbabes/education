import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PHProvider } from "./providers";
import { FeedbackButton } from "@/components/FeedbackButton";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thesagescompass.com"),
  title: {
    default: "Sage's Compass — Find Your Teaching Archetype and Build Lessons That Match",
    template: "%s | Sage's Compass",
  },
  description:
    "Discover your teaching archetype, then create custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
  openGraph: {
    title: "Sage's Compass — Find Your Teaching Archetype and Build Lessons That Match",
    description:
      "Discover your teaching archetype, then create custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
    url: "https://thesagescompass.com",
    siteName: "Sage's Compass",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Sage's Compass — Find Your Teaching Archetype and Build Lessons That Match" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sage's Compass — Find Your Teaching Archetype and Build Lessons That Match",
    description:
      "Discover your teaching archetype, then create custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Sage's Compass — Find Your Teaching Archetype and Build Lessons That Match" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    name: "The Sage's Compass",
                    url: "https://thesagescompass.com",
                    logo: "https://thesagescompass.com/icon.png",
                    description:
                      "Homeschool curriculum platform that matches lesson plans to your teaching philosophy, your child's interests, and your state's standards.",
                    email: "hello@sagescompass.com",
                  },
                  {
                    "@type": "WebSite",
                    name: "The Sage's Compass",
                    url: "https://thesagescompass.com",
                  },
                ],
              }),
            }}
          />
        </head>
        <body className="antialiased min-h-screen">
          <PHProvider>
            {children}
            <FeedbackButton />
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
