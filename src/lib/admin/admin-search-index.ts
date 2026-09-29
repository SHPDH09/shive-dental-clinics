import { SETTINGS_SECTIONS, type SettingsSectionId } from "@/lib/clinic-settings/search-index";
import { ADMIN_NAV, can, type PermissionMatrix, type PermissionResource } from "@/lib/rbac/permissions";

export type AdminSearchHit = {
  id: string;
  label: string;
  href: string;
  group: "Pages" | "Settings" | "Services";
  keywords: string[];
  resource?: PermissionResource;
  superAdminOnly?: boolean;
};

const EXTRA_PAGES: Omit<AdminSearchHit, "group">[] = [
  {
    id: "communications",
    label: "Communications",
    href: "/admin/communications",
    resource: "messages",
    keywords: ["email", "mailbox", "inbox", "smtp"],
  },
  {
    id: "hero-slides",
    label: "Hero slides",
    href: "/admin/hero-slides",
    resource: "settings",
    keywords: ["slider", "banner", "carousel", "homepage hero"],
  },
  {
    id: "profile",
    label: "My profile",
    href: "/admin/profile",
    keywords: ["account", "photo", "password", "session", "admin user"],
  },
  {
    id: "super",
    label: "Super admin panel",
    href: "/admin/super",
    superAdminOnly: true,
    keywords: ["super", "system", "audit"],
  },
];

function navToHit(entry: (typeof ADMIN_NAV)[number]): AdminSearchHit {
  return {
    id: `nav-${entry.href}`,
    label: entry.label,
    href: entry.href,
    group: "Pages",
    keywords: [entry.label.toLowerCase(), entry.resource, entry.href.replace("/admin/", "")],
    resource: entry.resource,
  };
}

function settingsHits(): AdminSearchHit[] {
  return SETTINGS_SECTIONS.map((s) => ({
    id: `settings-${s.id}`,
    label: `Settings · ${s.label}`,
    href: `/admin/settings?section=${s.id}`,
    group: "Settings" as const,
    keywords: [s.label, ...s.keywords, "settings"],
    resource: "settings" as PermissionResource,
  }));
}

const STATIC_HITS: AdminSearchHit[] = [
  ...ADMIN_NAV.map(navToHit),
  ...EXTRA_PAGES.map((p) => ({ ...p, group: "Pages" as const })),
  ...settingsHits(),
];

function textMatch(query: string, hit: AdminSearchHit): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (hit.label.toLowerCase().includes(q)) return true;
  return hit.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
}

export function filterAdminSearchHits(
  query: string,
  opts: { permissions: PermissionMatrix | null; role: string | null },
): AdminSearchHit[] {
  const { permissions, role } = opts;

  return STATIC_HITS.filter((hit) => {
    if (hit.superAdminOnly && role !== "SUPER_ADMIN") return false;
    if (hit.resource === "admins" && role !== "SUPER_ADMIN") return false;
    if (hit.resource && permissions && !can(permissions, hit.resource, "view")) return false;
    return textMatch(query, hit);
  });
}

export function isSettingsSectionId(id: string): id is SettingsSectionId {
  return SETTINGS_SECTIONS.some((s) => s.id === id);
}
