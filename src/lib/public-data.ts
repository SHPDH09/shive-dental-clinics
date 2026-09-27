import { prisma } from "@/lib/prisma";

export {
  getPublicServicesList as getPublicServices,
  getPublicServiceBySlug as getServiceBySlug,
  getFeaturedPublicServices,
} from "@/lib/public-services";
export type { PublicService } from "@/lib/public-service-types";

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

export { getPublicGalleryItems as getPublicGallery } from "@/lib/public-gallery";

export { getPublicVideos } from "@/lib/public-videos";

export async function getPublicBranches() {
  try {
    return await prisma.branch.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    return [];
  }
}

import { getPublicTransformations } from "@/lib/public-transformations";

export async function getPublicBeforeAfter(
  take = 12,
  options?: { featuredOnly?: boolean },
) {
  return getPublicTransformations(take, options);
}
