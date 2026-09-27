export const ENQUIRY_SOURCES = [
  { id: "WEBSITE", label: "Website Contact Form" },
  { id: "APPOINTMENT", label: "Appointment Request" },
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "PHONE", label: "Phone" },
  { id: "GOOGLE", label: "Google" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "REFERRAL", label: "Referral" },
  { id: "OTHER", label: "Other" },
] as const;

export type EnquirySourceId = (typeof ENQUIRY_SOURCES)[number]["id"];

export function enquirySourceLabel(source: string): string {
  return ENQUIRY_SOURCES.find((s) => s.id === source)?.label ?? source;
}

export const ENQUIRY_STATUSES = [
  { id: "NEW", label: "New", color: "bg-sky-100 text-sky-800" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-100 text-amber-800" },
  { id: "REPLIED", label: "Replied", color: "bg-teal-100 text-teal-800" },
  { id: "CLOSED", label: "Closed", color: "bg-slate-200 text-slate-700" },
] as const;

export type EnquiryStatusId = (typeof ENQUIRY_STATUSES)[number]["id"];

export function enquiryStatusLabel(status: string): string {
  if (status === "UNREAD") return "New";
  if (status === "READ") return "Replied";
  return ENQUIRY_STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function enquiryStatusColor(status: string): string {
  const normalized = status === "UNREAD" ? "NEW" : status === "READ" ? "REPLIED" : status;
  return ENQUIRY_STATUSES.find((s) => s.id === normalized)?.color ?? "bg-slate-100 text-slate-700";
}

export const STAFF_ASSIGNees = ["Admin", "Receptionist", "Manager"] as const;

export type ConversationEntry = {
  id: string;
  direction: "in" | "out";
  subject?: string;
  body: string;
  sentAt: string;
  sentBy?: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  at: string;
  by?: string;
};
