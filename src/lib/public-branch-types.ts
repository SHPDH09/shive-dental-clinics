import type { WeeklySchedule } from "@/lib/doctor-schedule";

export type PublicBranch = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  address: string;
  city: string;
  state: string | null;
  pinCode: string | null;
  fullAddress: string;
  phone: string;
  whatsapp: string;
  mapUrl: string | null;
  mapEmbedUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  openingHoursSummary: string;
  weeklySchedule: WeeklySchedule;
  doctorIds: string[];
  serviceIds: string[];
  doctors: { id: string; name: string; slug: string }[];
  services: { id: string; name: string; slug: string }[];
  featured: boolean;
  updatedAt: Date;
};
