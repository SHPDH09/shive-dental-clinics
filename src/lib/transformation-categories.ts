export const TRANSFORMATION_CATEGORIES = [
  { id: "teeth-whitening", label: "Teeth Whitening", emoji: "🦷" },
  { id: "smile-makeover", label: "Smile Makeover", emoji: "✨" },
  { id: "root-canal", label: "Root Canal Treatment", emoji: "🩺" },
  { id: "dental-implants", label: "Dental Implants", emoji: "🦷" },
  { id: "orthodontic", label: "Orthodontic Treatment", emoji: "😁" },
  { id: "dental-restoration", label: "Dental Restoration", emoji: "🪥" },
  { id: "cosmetic-dentistry", label: "Cosmetic Dentistry", emoji: "💎" },
] as const;

export type TransformationCategoryId = (typeof TRANSFORMATION_CATEGORIES)[number]["id"];

export function transformationCategoryLabel(id: string): string {
  const c = TRANSFORMATION_CATEGORIES.find((x) => x.id === id);
  return c ? `${c.emoji} ${c.label}` : id;
}
