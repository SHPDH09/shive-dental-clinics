export const GALLERY_CATEGORIES = [
  { id: "clinic", label: "Clinic", emoji: "🏥", patientRelated: false },
  { id: "doctors-team", label: "Doctors & Team", emoji: "👨‍⚕️", patientRelated: false },
  { id: "treatments", label: "Treatments", emoji: "🦷", patientRelated: false },
  { id: "smile-transformations", label: "Smile Transformations", emoji: "✨", patientRelated: true },
  { id: "patient-moments", label: "Patient Moments", emoji: "❤️", patientRelated: true },
  { id: "videos", label: "Videos", emoji: "🎥", patientRelated: false },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]["id"];

export function getGalleryCategory(id: string) {
  return GALLERY_CATEGORIES.find((c) => c.id === id);
}

export function isPatientRelatedCategory(id: string): boolean {
  return getGalleryCategory(id)?.patientRelated ?? false;
}

export function categoryLabel(id: string): string {
  const c = getGalleryCategory(id);
  return c ? `${c.emoji} ${c.label}` : id;
}
