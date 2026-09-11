import type { MetadataRoute } from "next";

const BASE_URL = "https://jaewon.homes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/auth", "/grades"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
