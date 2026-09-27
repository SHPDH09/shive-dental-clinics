export const VIDEO_CATEGORIES = [
  { id: "dental-treatments", label: "Dental Treatments", emoji: "🦷", patientRelated: false },
  { id: "smile-transformations", label: "Smile Transformations", emoji: "✨", patientRelated: true },
  { id: "doctor-advice", label: "Doctor Advice", emoji: "👨‍⚕️", patientRelated: false },
  { id: "clinic-tour", label: "Clinic Tour", emoji: "🏥", patientRelated: false },
  { id: "patient-experiences", label: "Patient Experiences", emoji: "❤️", patientRelated: true },
  { id: "clinic-updates", label: "Clinic Updates", emoji: "📢", patientRelated: false },
  { id: "dental-education", label: "Dental Education", emoji: "🎓", patientRelated: false },
] as const;

export type VideoCategoryId = (typeof VIDEO_CATEGORIES)[number]["id"];

export function getVideoCategory(id: string) {
  return VIDEO_CATEGORIES.find((c) => c.id === id);
}

export function isPatientVideoCategory(id: string): boolean {
  return getVideoCategory(id)?.patientRelated ?? false;
}

export function videoCategoryLabel(id: string): string {
  const c = getVideoCategory(id);
  return c ? `${c.emoji} ${c.label}` : id;
}
