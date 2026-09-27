import type { ExtendedClinicSettings } from "@/lib/clinic-settings/types";

export const DEFAULT_EXTENDED: ExtendedClinicSettings = {
  workingHours: {
    days: {
      monday: { open: "10:00 AM", close: "07:00 PM" },
      tuesday: { open: "10:00 AM", close: "07:00 PM" },
      wednesday: { open: "10:00 AM", close: "07:00 PM" },
      thursday: { open: "10:00 AM", close: "07:00 PM" },
      friday: { open: "10:00 AM", close: "07:00 PM" },
      saturday: { open: "10:00 AM", close: "05:00 PM" },
      sunday: { closed: true },
    },
    holidays: [],
    emergencyClosureMessage: "",
  },
  appointments: {
    durationMinutes: 30,
    bufferMinutes: 10,
    minNoticeHours: 2,
    maxAdvanceDays: 30,
    sameDayBooking: true,
    autoConfirm: false,
    requireAdminApproval: true,
    allowCancellation: true,
    cancellationDeadlineHours: 24,
    noShowHandling: "Mark as no-show and notify admin",
  },
  notifications: {
    admin: {
      newAppointment: true,
      newEnquiry: true,
      newLead: true,
      appointmentCancelled: true,
      newPatient: true,
    },
    patient: {
      appointmentConfirmation: true,
      appointmentReminder: true,
      appointmentCancellation: true,
      appointmentReschedule: true,
      followUpReminder: true,
    },
  },
  whatsapp: {
    ctaMessage: "Hello, I would like to book an appointment at Shiv Dental Clinic.",
    appointmentTemplate: "Your appointment at {clinic} is confirmed for {date} at {time}.",
    enquiryTemplate: "Thank you for contacting {clinic}. We will reply shortly.",
    reminderTemplate: "Reminder: dental appointment tomorrow at {time}. Reply to reschedule.",
  },
  email: {
    senderName: "Shiv Dental Clinic",
    senderEmail: "info@shivdentalclinic.com",
    replyTo: "info@shivdentalclinic.com",
    smtpProvider: "custom",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    encryption: "tls",
  },
  seo: {
    keywords: "dental clinic, dentist, teeth cleaning, root canal",
    ogImageUrl: "",
    canonicalUrl: "",
    sitemapEnabled: true,
    robotsIndex: true,
    googleAnalyticsId: "",
    googleSearchConsoleTag: "",
  },
  appearance: {
    primaryColor: "#0ea5e9",
    secondaryColor: "#14b8a6",
    heroImageUrl: "",
    fontFamily: "system-ui",
    buttonStyle: "rounded",
    themePreference: "light",
  },
  security: {
    sessionTimeoutMinutes: 30,
    twoFactorEnabled: false,
    loginProtectionEnabled: true,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
  },
  payment: {
    provider: "none",
    currency: "INR",
    mode: "test",
    successUrl: "/appointment/success",
    failureUrl: "/appointment/failure",
    webhookUrl: "",
  },
  integrations: {
    googleMaps: { connected: false, label: "Google Maps" },
    googleAnalytics: { connected: false, label: "Google Analytics" },
    googleSearchConsole: { connected: false, label: "Google Search Console" },
    whatsapp: { connected: true, label: "WhatsApp" },
    email: { connected: false, label: "Email provider" },
    payment: { connected: false, label: "Payment gateway" },
    storage: { connected: false, label: "Cloud storage" },
    captcha: { connected: false, label: "CAPTCHA / anti-spam" },
    sms: { connected: false, label: "SMS provider" },
  },
  legal: {
    privacy: { title: "Privacy Policy", content: "", published: false },
    terms: { title: "Terms & Conditions", content: "", published: false },
    cancellation: { title: "Cancellation Policy", content: "", published: false },
    refund: { title: "Refund Policy", content: "", published: false },
    consent: { title: "Patient Consent", content: "", published: false },
    cookies: { title: "Cookie Policy", content: "", published: false },
  },
  dataManagement: {
    retentionDays: 365,
    allowPatientExport: true,
    allowPatientDelete: false,
  },
  maintenance: {
    enabled: false,
    message:
      "We'll be back shortly. Shiv Dental Clinic is currently undergoing scheduled maintenance.",
  },
  branchSettings: {
    defaultBranchSort: "name",
    showLocatorOnHome: true,
  },
};

export function mergeExtended(partial: unknown): ExtendedClinicSettings {
  const base = structuredClone(DEFAULT_EXTENDED);
  if (!partial || typeof partial !== "object") return base;
  return deepMerge(base, partial as Record<string, unknown>) as ExtendedClinicSettings;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object") {
      deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      target[key] = sv;
    }
  }
  return target;
}
