import type { MetadataRoute } from "next";
import { getPublicServices } from "@/lib/public-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shivdentalclinic.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getPublicServices();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/appointment`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...serviceRoutes];
}
