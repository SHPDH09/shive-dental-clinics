import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import {
  getPublicBranches,
  getPublicDoctors,
  getPublicServices,
  getPublicVideos,
} from "@/lib/public-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const [services, doctors, branches, videos] = await Promise.all([
    getPublicServices(),
    getPublicDoctors(),
    getPublicBranches(),
    getPublicVideos(200),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${siteUrl}/doctors`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/branches`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/appointment`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteUrl}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/testimonials`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/videos`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${siteUrl}/transformations`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const doctorRoutes: MetadataRoute.Sitemap = doctors.map((d) => ({
    url: `${siteUrl}/doctors/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const branchRoutes: MetadataRoute.Sitemap = branches.map((b) => ({
    url: `${siteUrl}/branches/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const videoRoutes: MetadataRoute.Sitemap = videos.map((v) => ({
    url: `${siteUrl}/videos/${v.id}`,
    lastModified: v.createdAt,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticRoutes, ...serviceRoutes, ...doctorRoutes, ...branchRoutes, ...videoRoutes];
}
