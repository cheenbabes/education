# SEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive SEO to The Sage's Compass — sitemap, robots.txt, per-page metadata, structured data, and metadataBase.

**Architecture:** Use Next.js App Router metadata conventions (`robots.ts`, `sitemap.ts`, `metadata` exports). Server component pages get `metadata` exports directly. Client component pages get a thin `layout.tsx` in their route folder that exports metadata. Root layout gets `metadataBase`, title template, and JSON-LD structured data.

**Tech Stack:** Next.js 14 App Router metadata API, JSON-LD (`<script type="application/ld+json">`)

---

### Task 1: Update Root Layout — metadataBase, Title Template, JSON-LD

**Files:**
- Modify: `web/src/app/layout.tsx`

**Step 1: Update the metadata export in `web/src/app/layout.tsx`**

Replace the existing `metadata` export (lines 7–22) with:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://thesagescompass.com"),
  title: {
    default: "The Sage's Compass — Homeschool Curriculum for Your Family",
    template: "%s | The Sage's Compass",
  },
  description:
    "Discover your teaching archetype, then generate custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
  openGraph: {
    title: "The Sage's Compass — Homeschool Curriculum for Your Family",
    description:
      "Discover your teaching archetype, then generate custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
    siteName: "The Sage's Compass",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Sage's Compass — Homeschool Curriculum for Your Family",
    description:
      "Discover your teaching archetype, then generate custom lesson plans matched to your philosophy, your child's interests, and your state's standards.",
  },
};
```

**Step 2: Add JSON-LD structured data inside the `<head>` via a `<script>` tag**

Add this inside the `<html>` element, before `<body>`:

```tsx
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
```

**Step 3: Verify the build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat(seo): add metadataBase, title template, and JSON-LD structured data"
```

---

### Task 2: Create robots.ts

**Files:**
- Create: `web/src/app/robots.ts`

**Step 1: Create `web/src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/calendar",
          "/children",
          "/account",
          "/lessons",
          "/create",
          "/audit",
          "/sign-in",
          "/sign-up",
          "/api/",
          "/archetype-debug",
          "/matching-debug",
          "/personas",
          "/compass/quiz",
          "/compass/results",
          "/curriculum-review",
        ],
      },
    ],
    sitemap: "https://thesagescompass.com/sitemap.xml",
  };
}
```

**Step 2: Verify the build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add web/src/app/robots.ts
git commit -m "feat(seo): add robots.ts with crawl rules"
```

---

### Task 3: Create sitemap.ts

**Files:**
- Create: `web/src/app/sitemap.ts`

**Step 1: Create `web/src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://thesagescompass.com";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/compass`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/archetypes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/explore`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/standards`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

**Step 2: Verify the build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add web/src/app/sitemap.ts
git commit -m "feat(seo): add sitemap.ts with public page entries"
```

---

### Task 4: Add Per-Page Metadata to Server Component Pages

These pages are already server components, so we can add `export const metadata` directly.

**Files:**
- Modify: `web/src/app/page.tsx` (home)
- Modify: `web/src/app/about/page.tsx`
- Modify: `web/src/app/privacy/page.tsx`
- Modify: `web/src/app/terms/page.tsx`

**Step 1: Add metadata to `web/src/app/page.tsx` (home)**

Add at the top, after the imports:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Sage's Compass — Homeschool Curriculum for Your Family",
  description:
    "Discover your teaching archetype and generate personalized, standards-aligned lesson plans matched to your philosophy and your child's interests.",
};
```

Note: The home page uses the `default` title (no template suffix) since it's the main landing page. Setting `title` to the full string here overrides the template for this page only.

**Step 2: Add metadata to `web/src/app/about/page.tsx`**

Add at the top, after the imports:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet the founders of The Sage's Compass — a master educator and engineer building personalized homeschool curriculum tools for families.",
};
```

**Step 3: Add metadata to `web/src/app/privacy/page.tsx`**

Add at the top, after the imports:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Sage's Compass collects, uses, and protects your personal information. COPPA-compliant and designed for family privacy.",
};
```

**Step 4: Add metadata to `web/src/app/terms/page.tsx`**

Add at the top, after the imports:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using The Sage's Compass homeschool curriculum platform.",
};
```

**Step 5: Verify the build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add web/src/app/page.tsx web/src/app/about/page.tsx web/src/app/privacy/page.tsx web/src/app/terms/page.tsx
git commit -m "feat(seo): add per-page metadata to server component pages"
```

---

### Task 5: Add Per-Page Metadata to Client Component Pages via Layout

These pages have `"use client"` so they cannot export `metadata` directly. We add a thin `layout.tsx` to each route folder that exports metadata and passes children through.

**Files:**
- Create: `web/src/app/compass/layout.tsx`
- Create: `web/src/app/archetypes/layout.tsx`
- Create: `web/src/app/explore/layout.tsx`
- Create: `web/src/app/standards/layout.tsx`
- Create: `web/src/app/pricing/layout.tsx`
- Create: `web/src/app/contact/layout.tsx`

**Step 1: Create `web/src/app/compass/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teaching Archetype Quiz",
  description:
    "Take the Sage's Compass quiz to discover your teaching archetype and get curriculum recommendations matched to your homeschool philosophy.",
};

export default function CompassLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 2: Create `web/src/app/archetypes/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teaching Archetypes",
  description:
    "Explore the eight homeschool teaching archetypes — from The Architect to The Free Spirit — and find which approach fits your family.",
};

export default function ArchetypesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 3: Create `web/src/app/explore/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Curriculum",
  description:
    "Explore homeschool curricula, teaching philosophies, and learning approaches on an interactive knowledge graph.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 4: Create `web/src/app/standards/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "State Standards Tracker",
  description:
    "Track your homeschool progress against your state's academic standards. See which standards your lessons cover and identify gaps.",
};

export default function StandardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 5: Create `web/src/app/pricing/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the plan that fits your family — free tier to get started, or upgrade for unlimited AI-generated lesson plans and full standards tracking.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 6: Create `web/src/app/contact/layout.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with The Sage's Compass team. Questions about homeschool curriculum, your account, or partnerships — we'd love to hear from you.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Step 7: Verify the build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add web/src/app/compass/layout.tsx web/src/app/archetypes/layout.tsx web/src/app/explore/layout.tsx web/src/app/standards/layout.tsx web/src/app/pricing/layout.tsx web/src/app/contact/layout.tsx
git commit -m "feat(seo): add per-page metadata to client component pages via route layouts"
```

---

### Task 6: Final Verification

**Step 1: Full build**

Run: `cd ~/github/edu-app/web && npm run build`
Expected: Build succeeds with no errors

**Step 2: Spot-check generated routes**

After build, check that Next.js lists the sitemap and robots routes in the build output.

**Step 3: Run existing tests**

Run: `cd ~/github/edu-app/web && npm test`
Expected: All existing tests pass

**Step 4: Commit if any fixes were needed**

If any fixes were required, commit them.
