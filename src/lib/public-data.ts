import { prisma } from "@/lib/prisma";

export async function getPublicServices() {
  try {
    return await prisma.service.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getServiceBySlug(slug: string) {
  try {
    return await prisma.service.findFirst({
      where: { slug, enabled: true },
    });
  } catch {
    return null;
  }
}

export async function getPublicDoctors() {
  try {
    return await prisma.doctor.findMany({
      where: { enabled: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    });
  } catch {
    return [];
  }
}

export async function getFeaturedDoctor() {
  try {
    const featured = await prisma.doctor.findFirst({
      where: { enabled: true, featured: true },
      orderBy: { sortOrder: "asc" },
    });
    if (featured) return featured;
    return await prisma.doctor.findFirst({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return null;
  }
}

export { getPublicTestimonials } from "@/lib/public-testimonials";

export async function getPublicGallery() {
  try {
    return await prisma.media.findMany({
      where: { mediaType: "IMAGE", isPublic: true, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
  } catch {
    return [];
  }
}

export async function getPublicVideos() {
  try {
    return await prisma.media.findMany({
      where: { mediaType: "VIDEO", isPublic: true, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
  } catch {
    return [];
  }
}

export async function getPublicBranches() {
  try {
    return await prisma.branch.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getPublicBeforeAfter() {
  try {
    return await prisma.beforeAfter.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
      take: 12,
    });
  } catch {
    return [];
  }
}
