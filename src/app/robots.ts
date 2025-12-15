import { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${SEO_CONFIG.SITE_URL}/sitemap.xml`,
    host: SEO_CONFIG.SITE_URL,
  };
}
