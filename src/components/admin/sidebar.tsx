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
  Shield,
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
  reports: BarChart3,
  admins: Shield,
  settings: Settings,
} as const;

export function AdminSidebar() {
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

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <Link href="/admin" className="font-bold text-[var(--primary)]">
          Shiv Admin
        </Link>
      </div>
      <nav className="space-y-0.5 p-3">
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
