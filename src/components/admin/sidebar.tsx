"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/leads", label: "Leads", icon: ClipboardList },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/before-after", label: "Before / After", icon: Wand2 },
  { href: "/admin/services", label: "Services", icon: Stethoscope },
  { href: "/admin/doctors", label: "Doctors", icon: UserCircle },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <Link href="/admin" className="font-bold text-[var(--primary)]">Shiv Admin</Link>
      </div>
      <nav className="space-y-0.5 p-3">
        {links.map(({ href, label, icon: Icon }) => {
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
      </nav>
    </aside>
  );
}
