import type { AdminRole } from "@/generated/prisma/client";

export type PermissionResource =
  | "dashboard"
  | "appointments"
  | "patients"
  | "leads"
  | "services"
  | "doctors"
  | "branches"
  | "testimonials"
  | "gallery"
  | "videos"
  | "beforeAfter"
  | "messages"
  | "reports"
  | "admins"
  | "settings";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

export type PermissionMatrix = Record<
  PermissionResource,
  Partial<Record<PermissionAction, boolean>>
>;

export type CustomPermissions = Partial<PermissionMatrix>;

const ALL_TRUE: PermissionMatrix = {
  dashboard: { view: true },
  appointments: { view: true, create: true, edit: true, delete: true },
  patients: { view: true, create: true, edit: true, delete: true },
  leads: { view: true, create: true, edit: true, delete: true },
  services: { view: true, create: true, edit: true, delete: true },
  doctors: { view: true, create: true, edit: true, delete: true },
  branches: { view: true, create: true, edit: true, delete: true },
  testimonials: { view: true, create: true, edit: true, delete: true },
  gallery: { view: true, create: true, edit: true, delete: true },
  videos: { view: true, create: true, edit: true, delete: true },
  beforeAfter: { view: true, create: true, edit: true, delete: true },
  messages: { view: true, create: true, edit: true, delete: true },
  reports: { view: true, export: true },
  admins: { view: true, create: true, edit: true, delete: true },
  settings: { view: true, edit: true },
};

const MANAGER_DEFAULT: PermissionMatrix = {
  dashboard: { view: true },
  appointments: { view: true, create: true, edit: true, delete: true },
  patients: { view: true, create: true, edit: true },
  leads: { view: true, create: true, edit: true, delete: true },
  services: { view: true, create: true, edit: true },
  doctors: { view: true, create: true, edit: true },
  branches: { view: true },
  testimonials: { view: false },
  gallery: { view: false },
  videos: { view: false },
  beforeAfter: { view: false },
  messages: { view: true, create: true, edit: true },
  reports: { view: true, export: true },
  admins: { view: false },
  settings: { view: true, edit: true },
};

const RECEPTIONIST_DEFAULT: PermissionMatrix = {
  dashboard: { view: true },
  appointments: { view: true, create: true, edit: true },
  patients: { view: true, create: true, edit: true },
  leads: { view: true, create: true, edit: true },
  services: { view: false },
  doctors: { view: false },
  branches: { view: false },
  testimonials: { view: false },
  gallery: { view: false },
  videos: { view: false },
  beforeAfter: { view: false },
  messages: { view: true, create: true, edit: true },
  reports: { view: false, export: false },
  admins: { view: false },
  settings: { view: false },
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole | "STAFF" {
  if (role === "SUPER_ADMIN" || role === "MANAGER" || role === "RECEPTIONIST" || role === "STAFF") {
    return role;
  }
  return "RECEPTIONIST";
}

export function roleDefaultPermissions(role: string | null | undefined): PermissionMatrix {
  const r = normalizeAdminRole(role);
  if (r === "SUPER_ADMIN") return structuredClone(ALL_TRUE);
  if (r === "MANAGER" || r === "STAFF") return structuredClone(MANAGER_DEFAULT);
  return structuredClone(RECEPTIONIST_DEFAULT);
}

export function mergePermissions(
  role: string | null | undefined,
  custom: CustomPermissions | null | undefined,
): PermissionMatrix {
  const base = roleDefaultPermissions(role);
  if (!custom || typeof custom !== "object") return base;

  for (const resource of Object.keys(custom) as PermissionResource[]) {
    const overrides = custom[resource];
    if (!overrides) continue;
    base[resource] = { ...base[resource], ...overrides };
  }
  return base;
}

export function can(
  matrix: PermissionMatrix,
  resource: PermissionResource,
  action: PermissionAction = "view",
): boolean {
  return Boolean(matrix[resource]?.[action]);
}

export const ADMIN_NAV: { href: string; resource: PermissionResource; label: string }[] = [
  { href: "/admin", resource: "dashboard", label: "Dashboard" },
  { href: "/admin/appointments", resource: "appointments", label: "Appointments" },
  { href: "/admin/patients", resource: "patients", label: "Patients" },
  { href: "/admin/leads", resource: "leads", label: "Leads" },
  { href: "/admin/testimonials", resource: "testimonials", label: "Testimonials" },
  { href: "/admin/gallery", resource: "gallery", label: "Gallery" },
  { href: "/admin/videos", resource: "videos", label: "Videos" },
  { href: "/admin/before-after", resource: "beforeAfter", label: "Before / After" },
  { href: "/admin/services", resource: "services", label: "Services" },
  { href: "/admin/doctors", resource: "doctors", label: "Doctor profiles" },
  { href: "/admin/branches", resource: "branches", label: "Branches" },
  { href: "/admin/messages", resource: "messages", label: "Messages" },
  { href: "/admin/reports", resource: "reports", label: "Reports" },
  { href: "/admin/admins", resource: "admins", label: "Admins" },
  { href: "/admin/settings", resource: "settings", label: "Settings" },
];

export function roleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "RECEPTIONIST":
      return "Receptionist";
    case "STAFF":
      return "Manager";
    default:
      return role;
  }
}
