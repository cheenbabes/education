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
