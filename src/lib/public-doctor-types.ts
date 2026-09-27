import type { WeeklySchedule } from "@/lib/doctor-schedule";

/** Fields safe to expose on the public website (published doctors only). */
export type PublicDoctor = {
  id: string;
  name: string;
  slug: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  summary: string | null;
  image: string | null;
  areasOfExpertise: string[];
  languagesSpoken: string | null;
  weeklySchedule: WeeklySchedule;
  consultationHours: string | null;
  featured: boolean;
  sortOrder: number;
  updatedAt: Date;
};
