export type DaySchedule = {
  closed?: boolean;
  open?: string;
  close?: string;
  sessions?: { open: string; close: string }[];
  breakStart?: string;
  breakEnd?: string;
};

export type ExtendedClinicSettings = {
  workingHours: {
    days: Record<string, DaySchedule>;
    holidays: string[];
    temporaryClosure?: { until?: string; message?: string };
    emergencyClosureMessage?: string;
  };
  appointments: {
    durationMinutes: number;
    bufferMinutes: number;
    minNoticeHours: number;
    maxAdvanceDays: number;
    sameDayBooking: boolean;
    autoConfirm: boolean;
    requireAdminApproval: boolean;
    allowCancellation: boolean;
    cancellationDeadlineHours: number;
    noShowHandling: string;
  };
  notifications: {
    admin: Record<string, boolean>;
    patient: Record<string, boolean>;
  };
  whatsapp: {
    ctaMessage: string;
    appointmentTemplate: string;
    enquiryTemplate: string;
    reminderTemplate: string;
  };
  email: {
    senderName: string;
    senderEmail: string;
    replyTo: string;
    smtpProvider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    encryption: "tls" | "ssl" | "none";
  };
  seo: {
    keywords: string;
    ogImageUrl: string;
    canonicalUrl: string;
    sitemapEnabled: boolean;
    robotsIndex: boolean;
    googleAnalyticsId: string;
    googleSearchConsoleTag: string;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    heroImageUrl: string;
    fontFamily: string;
    buttonStyle: "rounded" | "pill" | "square";
    themePreference: "light" | "dark" | "system";
  };
  security: {
    sessionTimeoutMinutes: number;
    twoFactorEnabled: boolean;
    loginProtectionEnabled: boolean;
    passwordMinLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
  };
  payment: {
    provider: "none" | "razorpay" | "cashfree" | "stripe";
    currency: string;
    mode: "test" | "live";
    successUrl: string;
    failureUrl: string;
    webhookUrl: string;
  };
  integrations: Record<
    string,
    { connected: boolean; label: string; note?: string }
  >;
  legal: Record<string, { title: string; content: string; published: boolean }>;
  dataManagement: {
    retentionDays: number;
    allowPatientExport: boolean;
    allowPatientDelete: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  branchSettings: {
    defaultBranchSort: "name" | "city";
    showLocatorOnHome: boolean;
  };
};

export type ClinicSecrets = {
  smtpPassword?: string;
  paymentApiKey?: string;
  paymentApiSecret?: string;
  captchaSecret?: string;
  smsApiKey?: string;
  storageAccessKey?: string;
  storageSecretKey?: string;
};

export type AdminSettingsResponse = {
  id: string;
  clinicName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  mapEmbedUrl: string | null;
  mapLink: string | null;
  googleBusinessUrl: string | null;
  emergencyContact: string | null;
  footerText: string | null;
  aboutIntro: string | null;
  mission: string | null;
  vision: string | null;
  whyChooseUs: string | null;
  aboutImages: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  openingHours: unknown;
  socialLinks: unknown;
  defaultLanguage: string;
  timezone: string;
  currency: string;
  showRevenueCard: boolean;
  monthlyRevenue: string | null;
  extended: ExtendedClinicSettings;
  secretsMeta: Record<string, boolean>;
  updatedAt: string;
};
