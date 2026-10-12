import { unstable_cache } from "next/cache";
import { getPublicSiteStatus } from "@/lib/clinic-settings/service";
import { getClinicSettings, getHeroStats } from "@/lib/settings";
import { getPublicBranchesList } from "@/lib/public-branches";
import { getPublicHeroSlides } from "@/lib/hero-slides";
import {
  getFeaturedPublicServices,
  getPublicServicePickerOptions,
} from "@/lib/public-services";
import { getFeaturedPublicDoctor, getFeaturedPublicDoctors } from "@/lib/public-doctors";
import { getPublicTestimonials } from "@/lib/public-testimonials";
import { getPublicGalleryItems } from "@/lib/public-gallery";
import { getPublicVideos } from "@/lib/public-videos";
import { getPublicTransformations } from "@/lib/public-transformations";

const REVALIDATE_SECONDS = 120;

export const getCachedClinicSettings = unstable_cache(
  async () => getClinicSettings(),
  ["public-clinic-settings"],
  { revalidate: REVALIDATE_SECONDS, tags: ["clinic-settings"] },
);

export const getCachedHeroStats = unstable_cache(
  async () => getHeroStats(),
  ["public-hero-stats"],
  { revalidate: REVALIDATE_SECONDS, tags: ["hero-stats"] },
);

export const getCachedPublicBranches = unstable_cache(
  async () => getPublicBranchesList(),
  ["public-branches"],
  { revalidate: REVALIDATE_SECONDS, tags: ["branches"] },
);

export const getCachedPublicSiteStatus = unstable_cache(
  async () => getPublicSiteStatus(),
  ["public-site-status"],
  { revalidate: 60, tags: ["site-status"] },
);

/** Homepage sections — shared cache to cut Worker CPU on `/` (Cloudflare 1102). */
export const getCachedPublicHeroSlides = unstable_cache(
  async () => getPublicHeroSlides(),
  ["public-hero-slides"],
  { revalidate: REVALIDATE_SECONDS, tags: ["hero-slides"] },
);

export const getCachedFeaturedPublicServices = unstable_cache(
  async () => getFeaturedPublicServices(6),
  ["public-featured-services-6"],
  { revalidate: REVALIDATE_SECONDS, tags: ["services"] },
);

export const getCachedPublicServicePickerOptions = unstable_cache(
  async () => getPublicServicePickerOptions(),
  ["public-service-picker"],
  { revalidate: REVALIDATE_SECONDS, tags: ["services"] },
);

export const getCachedFeaturedDoctor = unstable_cache(
  async () => getFeaturedPublicDoctor(),
  ["public-featured-doctor"],
  { revalidate: REVALIDATE_SECONDS, tags: ["doctors"] },
);

export const getCachedFeaturedPublicDoctors = unstable_cache(
  async () => getFeaturedPublicDoctors(6),
  ["public-featured-doctors-6"],
  { revalidate: REVALIDATE_SECONDS, tags: ["doctors"] },
);

export const getCachedHomeTestimonials = unstable_cache(
  async () => getPublicTestimonials(12),
  ["public-home-testimonials-12"],
  { revalidate: REVALIDATE_SECONDS, tags: ["testimonials"] },
);

export const getCachedHomeGallery = unstable_cache(
  async () => getPublicGalleryItems(12),
  ["public-home-gallery-12"],
  { revalidate: REVALIDATE_SECONDS, tags: ["gallery"] },
);

export const getCachedHomeVideos = unstable_cache(
  async () => getPublicVideos(6),
  ["public-home-videos-6"],
  { revalidate: REVALIDATE_SECONDS, tags: ["videos"] },
);

export const getCachedHomeBeforeAfter = unstable_cache(
  async () => getPublicTransformations(8, { featuredOnly: true }),
  ["public-home-before-after-8-featured"],
  { revalidate: REVALIDATE_SECONDS, tags: ["before-after"] },
);
