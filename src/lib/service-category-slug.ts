import { createId } from "@paralleldrive/cuid2";
import { slugify } from "@/lib/utils";

/** Ensures a valid URL slug (handles Hindi/other scripts where slugify returns empty). */
export function ensureServiceCategorySlug(name: string, slugInput?: string | null): string {
  const manual = slugInput?.trim();
  if (manual && manual.length >= 2) {
    return manual
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || fallbackSlug(name);
  }

  const fromName = slugify(name);
  if (fromName.length >= 2) return fromName.slice(0, 64);

  return fallbackSlug(name);
}

function fallbackSlug(name: string): string {
  const ascii = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (ascii.length >= 2) return ascii.slice(0, 64);
  return `cat-${createId().slice(0, 10)}`;
}
