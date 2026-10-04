import { cache } from "react";
import { prisma } from "@/lib/prisma";

const defaultSettings = {
  id: "default",
  clinicName: "Shiv Dental Clinic",
  tagline: "Healthy Teeth. Confident Smiles.",
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  phone: "+91 9973479904",
  whatsapp: "+91 9973479904",
  email: "info@shivdentalclinic.com",
  address: "Shiv Dental Clinic, SG R Annexe, India",
  mapEmbedUrl: null as string | null,
  mapLink: null as string | null,
  openingHours: { weekdays: "Mon – Sat: 9:00 AM – 8:00 PM", sunday: "Sun: 10:00 AM – 2:00 PM" },
  socialLinks: {},
  emergencyContact: "+91 9973479904",
  footerText: "© Shiv Dental Clinic. All rights reserved.",
  aboutIntro: "",
  mission: "",
  vision: "",
  whyChooseUs: "",
  aboutImages: [],
  seoTitle: "Shiv Dental Clinic | Premium Dental Care",
  seoDescription: "Professional dental care for your whole family.",
  showRevenueCard: false,
  monthlyRevenue: null,
  updatedAt: new Date(),
};

export const getClinicSettings = cache(async function getClinicSettings() {
  try {
    let settings = await prisma.clinicSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.clinicSettings.create({ data: { id: "default" } });
    }
    return settings;
  } catch {
    return defaultSettings;
  }
});

export const getHeroStats = cache(async function getHeroStats() {
  try {
    const stats = await prisma.heroStat.findMany({ orderBy: { sortOrder: "asc" } });
    if (stats.length === 0) {
      return [
        { label: "Years Experience", value: "10+" },
        { label: "Happy Patients", value: "5,000+" },
        { label: "Dental Treatments", value: "20+" },
        { label: "Patient Rating", value: "4.9/5" },
      ];
    }
    return stats.map((s) => ({ label: s.label, value: s.value, id: s.id }));
  } catch {
    return [
      { label: "Years Experience", value: "10+" },
      { label: "Happy Patients", value: "5,000+" },
      { label: "Dental Treatments", value: "20+" },
      { label: "Patient Rating", value: "4.9/5" },
    ];
  }
});
