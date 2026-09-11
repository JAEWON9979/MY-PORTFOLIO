import type { MetadataRoute } from "next";

const BASE_URL = "https://jaewon.homes";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/works", "/community", "/goals", "/schedule"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
