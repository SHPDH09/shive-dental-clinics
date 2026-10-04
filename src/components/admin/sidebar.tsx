"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { CLINIC_LOGO_URL } from "@/lib/branding";
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

  const navGroups: { label: string; resources: (keyof typeof iconMap)[] }[] = [
    {
      label: "Main",
      resources: ["dashboard", "appointments", "patients", "leads", "reports"],
    },
    {
      label: "Content",
      resources: [
        "testimonials",
        "gallery",
        "videos",
        "beforeAfter",
        "services",
        "doctors",
        "branches",
        "messages",
      ],
    },
    {
      label: "System",
      resources: ["admins", "settings"],
    },
  ];

  const showHeroSlides = permissions ? can(permissions, "settings", "view") : true;

  const navLink = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-medium transition-all duration-200",
        active ? "admin-nav-active text-white" : "text-slate-200 hover:bg-white/10 hover:text-white",
      )}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <aside className="admin-sidebar hidden h-screen w-[17.5rem] shrink-0 flex-col overflow-hidden border-r lg:flex">
      <div className="flex h-[4.25rem] shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <Image
            src={CLINIC_LOGO_URL}
            alt="Shiv Dental Clinic"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-contain ring-1 ring-white/20"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-white">Shiv Dental</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f4c430]">Admin Panel</p>
          </div>
        </Link>
        {onHide && (
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Hide menu"
            onClick={onHide}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navGroups.map((group) => {
          const groupLinks = links.filter((l) =>
            group.resources.includes(l.resource as keyof typeof iconMap),
          );
          if (groupLinks.length === 0) return null;
          return (
            <div key={group.label} className="mb-2">
              <p className="px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              {groupLinks.map(({ href, label, resource }) => {
                const Icon = iconMap[resource as keyof typeof iconMap] ?? LayoutDashboard;
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                return (
                  <div key={href}>
                    {navLink(href, label, <Icon className="h-4 w-4 shrink-0 opacity-90" />, active)}
                  </div>
                );
              })}
            </div>
          );
        })}
        {navLink(
          "/admin/communications",
          "Communications",
          <Mail className="h-4 w-4 shrink-0 opacity-90" />,
          pathname.startsWith("/admin/communications"),
        )}
        {showHeroSlides &&
          navLink(
            "/admin/hero-slides",
            "Hero slides",
            <Sparkles className="h-4 w-4 shrink-0 opacity-90" />,
            pathname.startsWith("/admin/hero-slides"),
          )}
        {role === "SUPER_ADMIN" &&
          navLink(
            "/admin/super",
            "Super admin",
            <Shield className="h-4 w-4 shrink-0 opacity-90" />,
            pathname.startsWith("/admin/super"),
          )}
        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Account
        </p>
        {navLink(
          "/admin/profile",
          "My profile",
          <UserCircle className="h-4 w-4 shrink-0 opacity-90" />,
          pathname === "/admin/profile",
        )}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="text-center text-[10px] text-slate-500">Shiv Dental Clinic · Secure admin</p>
      </div>
    </aside>
  );
}
