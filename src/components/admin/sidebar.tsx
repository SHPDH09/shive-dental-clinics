"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { ADMIN_NAV, can, type PermissionMatrix } from "@/lib/rbac/permissions";
import {
  BarChart3,
  Calendar,
  Images,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Stethoscope,
  UserCircle,
  Users,
  Video,
  Wand2,
  ClipboardList,
  Star,
  MapPin,
  Mail,
  Shield,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  appointments: Calendar,
  patients: Users,
  leads: ClipboardList,
  testimonials: Star,
  gallery: Images,
  videos: Video,
  beforeAfter: Wand2,
  services: Stethoscope,
  doctors: UserCircle,
  branches: MapPin,
  messages: MessageSquare,
  communications: Mail,
  reports: BarChart3,
  admins: Shield,
  settings: Settings,
} as const;

type Props = {
  onHide?: () => void;
};

export function AdminSidebar({ onHide }: Props) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<PermissionMatrix | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ permissions: PermissionMatrix; role: string }>("/api/admin/me")
      .then((me) => {
        setPermissions(me.permissions);
        setRole(me.role);
      })
      .catch(() => setPermissions(null));
  }, []);

  const links = ADMIN_NAV.filter((link) => {
    if (link.resource === "admins" && role !== "SUPER_ADMIN") return false;
    if (!permissions) return true;
    return can(permissions, link.resource, "view");
  });

  const showHeroSlides = permissions ? can(permissions, "settings", "view") : true;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link href="/admin" className="font-bold text-[var(--primary)]">
          Shiv Admin
        </Link>
        {onHide && (
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Hide menu"
            onClick={onHide}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
        {links.map(({ href, label, resource }) => {
          const Icon = iconMap[resource as keyof typeof iconMap] ?? LayoutDashboard;
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sky-50 text-[var(--primary)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        <Link
          href="/admin/communications"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname.startsWith("/admin/communications")
              ? "bg-sky-50 text-[var(--primary)]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <Mail className="h-4 w-4 shrink-0" />
          Communications
        </Link>
        {showHeroSlides && (
          <Link
            href="/admin/hero-slides"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              pathname.startsWith("/admin/hero-slides")
                ? "bg-sky-50 text-[var(--primary)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            Hero slides
          </Link>
        )}
        {role === "SUPER_ADMIN" && (
          <Link
            href="/admin/super"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              pathname.startsWith("/admin/super")
                ? "bg-sky-50 text-[var(--primary)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Super admin panel
          </Link>
        )}
        <Link
          href="/admin/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname === "/admin/profile"
              ? "bg-sky-50 text-[var(--primary)]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          My profile
        </Link>
      </nav>
    </aside>
  );
}
