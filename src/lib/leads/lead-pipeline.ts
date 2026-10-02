import type { LeadStatus } from "@/generated/prisma/client";

export const LEAD_PIPELINE: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "APPOINTMENT_BOOKED",
  "CONVERTED",
];

export const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-Up",
  INTERESTED: "Interested",
  APPOINTMENT_BOOKED: "Appointment",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const LEAD_SOURCE_LABEL: Record<string, string> = {
  WEBSITE: "Website",
  GOOGLE: "Google",
  GOOGLE_ADS: "Google Ads",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  PHONE: "Phone",
  OTHER: "Other",
};

export const LEAD_PRIORITY_LABEL: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};
