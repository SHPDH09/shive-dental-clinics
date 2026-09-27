export type SettingsSectionId =
  | "general"
  | "clinic"
  | "branches"
  | "hours"
  | "appointments"
  | "notifications"
  | "whatsapp"
  | "email"
  | "seo"
  | "appearance"
  | "security"
  | "roles"
  | "payment"
  | "integrations"
  | "legal"
  | "data"
  | "maintenance";

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  label: string;
  icon: string;
  keywords: string[];
}[] = [
  { id: "general", label: "General", icon: "⚙️", keywords: ["clinic name", "logo", "favicon", "tagline", "timezone", "currency", "language"] },
  { id: "clinic", label: "Clinic Information", icon: "🏥", keywords: ["address", "city", "state", "pin", "emergency", "maps", "description"] },
  { id: "branches", label: "Branch Settings", icon: "📍", keywords: ["branch", "locator", "multi-branch"] },
  { id: "hours", label: "Working Hours", icon: "🕐", keywords: ["monday", "hours", "holiday", "closure", "break"] },
  { id: "appointments", label: "Appointment Settings", icon: "📅", keywords: ["appointment duration", "buffer", "booking", "cancellation", "no-show"] },
  { id: "notifications", label: "Notifications", icon: "🔔", keywords: ["notification", "reminder", "enquiry", "lead"] },
  { id: "whatsapp", label: "WhatsApp & Communication", icon: "💬", keywords: ["whatsapp", "template", "cta"] },
  { id: "email", label: "Email Settings", icon: "📧", keywords: ["smtp", "sender", "test email", "encryption"] },
  { id: "seo", label: "Website & SEO", icon: "🌐", keywords: ["seo", "meta", "sitemap", "robots", "analytics", "social"] },
  { id: "appearance", label: "Appearance", icon: "🎨", keywords: ["color", "brand", "hero", "font", "theme"] },
  { id: "security", label: "Security", icon: "🔐", keywords: ["password", "2fa", "session", "login protection"] },
  { id: "roles", label: "Roles & Permissions", icon: "👥", keywords: ["roles", "permissions", "admin", "rbac"] },
  { id: "payment", label: "Payment Settings", icon: "💳", keywords: ["razorpay", "stripe", "cashfree", "webhook", "payment"] },
  { id: "integrations", label: "Integrations", icon: "🔗", keywords: ["integration", "connected", "captcha", "sms", "storage"] },
  { id: "legal", label: "Legal Pages", icon: "📝", keywords: ["privacy", "terms", "refund", "cookie", "consent"] },
  { id: "data", label: "Data Management", icon: "🗑️", keywords: ["export", "import", "backup", "retention", "delete data"] },
  { id: "maintenance", label: "Maintenance Mode", icon: "🛠️", keywords: ["maintenance", "offline", "public website"] },
];

export function searchSettingsSections(query: string): SettingsSectionId[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SETTINGS_SECTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.keywords.some((k) => k.includes(q) || q.includes(k)),
  ).map((s) => s.id);
}
