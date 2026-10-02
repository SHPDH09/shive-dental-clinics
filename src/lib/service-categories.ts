import { DENTAL_CATALOG_CATEGORIES } from "@/lib/dental-service-catalog";

/** Default categories for seed, admin fallbacks, and forms. */
export const DEFAULT_SERVICE_CATEGORIES = DENTAL_CATALOG_CATEGORIES.map((c) => ({
  name: c.name,
  slug: c.slug,
}));
