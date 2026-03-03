import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/login",
          "/access-denied",
          "/dashboard/students",
          "/dashboard/export",
        ],
        allow: ["/dashboard", "/dashboard/ctc", "/dashboard/companies"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
