import { prisma } from "@/lib/prisma";

export {
  getPublicServicesList as getPublicServices,
  getPublicServiceBySlug as getServiceBySlug,
  getFeaturedPublicServices,
} from "@/lib/public-services";
export type { PublicService } from "@/lib/public-service-types";

export {
  getPublicDoctorsList as getPublicDoctors,
  getPublicDoctorBySlug,
  getFeaturedPublicDoctor as getFeaturedDoctor,
  getFeaturedPublicDoctors,
} from "@/lib/public-doctors";
export type { PublicDoctor } from "@/lib/public-doctor-types";

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
