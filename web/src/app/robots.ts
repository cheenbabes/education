import type { MetadataRoute } from "next";
import { toSiteUrl } from "@/lib/site";

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
    sitemap: toSiteUrl("/sitemap.xml"),
  };
}
