import type { MetadataRoute } from "next";
import { getPublicBranches, getPublicDoctors, getPublicServices } from "@/lib/public-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shivdentalclinic.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, doctors, branches] = await Promise.all([
    getPublicServices(),
    getPublicDoctors(),
    getPublicBranches(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/doctors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/appointment`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const doctorRoutes: MetadataRoute.Sitemap = doctors.map((d) => ({
    url: `${siteUrl}/doctors/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const branchRoutes: MetadataRoute.Sitemap = branches.map((b) => ({
    url: `${siteUrl}/branches/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...serviceRoutes, ...doctorRoutes, ...branchRoutes];
}
