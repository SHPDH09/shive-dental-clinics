import { createId } from "@paralleldrive/cuid2";
import { slugify } from "@/lib/utils";

/** Ensures a valid branch slug (handles empty slugify for non-Latin names). */
export function ensureBranchSlug(name: string, slugInput?: string | null): string {
  const manual = slugInput?.trim();
  if (manual && manual.length >= 2) {
    return manual
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  const fromName = slugify(name);
  if (fromName.length >= 2) return fromName.slice(0, 64);

  return `branch-${createId().slice(0, 10)}`;
}
