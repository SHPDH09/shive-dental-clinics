import type { AdminSettingsResponse, ClinicSecrets } from "@/lib/clinic-settings/types";

const SECRET_KEYS: (keyof ClinicSecrets)[] = [
  "smtpPassword",
  "paymentApiKey",
  "paymentApiSecret",
  "captchaSecret",
  "smsApiKey",
  "storageAccessKey",
  "storageSecretKey",
];

export function secretsMeta(secrets: unknown): Record<string, boolean> {
  const s = (secrets ?? {}) as ClinicSecrets;
  const meta: Record<string, boolean> = {};
  for (const key of SECRET_KEYS) {
    meta[key] = Boolean(s[key]);
  }
  return meta;
}

export function stripSecretsFromPatch(body: Record<string, unknown>): {
  data: Record<string, unknown>;
  secrets: Partial<ClinicSecrets>;
} {
  const secrets: Partial<ClinicSecrets> = {};
  const data = { ...body };

  if (data.secrets && typeof data.secrets === "object") {
    const incoming = data.secrets as Record<string, string>;
    for (const key of SECRET_KEYS) {
      const val = incoming[key as string];
      if (val && val !== "__UNCHANGED__" && !val.startsWith("••••")) {
        secrets[key] = val;
      }
    }
    delete data.secrets;
  }

  return { data, secrets };
}

export type DbSettingsRow = Record<string, unknown>;

export function toAdminResponse(row: DbSettingsRow): AdminSettingsResponse {
  const extended = row.extendedSettings ?? row.extended;
  return {
    id: String(row.id ?? "default"),
    clinicName: String(row.clinicName ?? "Shiv Dental Clinic"),
    tagline: (row.tagline as string) ?? null,
    logoUrl: (row.logoUrl as string) ?? null,
    faviconUrl: (row.faviconUrl as string) ?? null,
    phone: String(row.phone ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    email: String(row.email ?? ""),
    address: String(row.address ?? ""),
    city: (row.city as string) ?? null,
    state: (row.state as string) ?? null,
    pinCode: (row.pinCode as string) ?? null,
    mapEmbedUrl: (row.mapEmbedUrl as string) ?? null,
    mapLink: (row.mapLink as string) ?? null,
    googleBusinessUrl: (row.googleBusinessUrl as string) ?? null,
    emergencyContact: (row.emergencyContact as string) ?? null,
    footerText: (row.footerText as string) ?? null,
    aboutIntro: (row.aboutIntro as string) ?? null,
    mission: (row.mission as string) ?? null,
    vision: (row.vision as string) ?? null,
    whyChooseUs: (row.whyChooseUs as string) ?? null,
    aboutImages: row.aboutImages ?? [],
    seoTitle: (row.seoTitle as string) ?? null,
    seoDescription: (row.seoDescription as string) ?? null,
    openingHours: row.openingHours ?? null,
    socialLinks: row.socialLinks ?? {},
    defaultLanguage: String(row.defaultLanguage ?? "en"),
    timezone: String(row.timezone ?? "Asia/Kolkata"),
    currency: String(row.currency ?? "INR"),
    showRevenueCard: Boolean(row.showRevenueCard),
    monthlyRevenue: row.monthlyRevenue != null ? String(row.monthlyRevenue) : null,
    extended: extended as AdminSettingsResponse["extended"],
    secretsMeta: secretsMeta(row.secrets),
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt as string).toISOString()
      : new Date().toISOString(),
  };
}
