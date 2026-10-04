import { unstable_cache } from "next/cache";
import { getPublicSiteStatus } from "@/lib/clinic-settings/service";
import { getClinicSettings, getHeroStats } from "@/lib/settings";
import { getPublicBranchesList } from "@/lib/public-branches";

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
