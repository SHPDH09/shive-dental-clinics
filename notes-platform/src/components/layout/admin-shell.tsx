"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";
import {
  LayoutDashboard,
  NotebookPen,
  Ticket,
  Users,
  Receipt,
  User,
  KeyRound,
  Menu,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/notes", label: "Notes", icon: NotebookPen },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/users", label: "Students", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/profile", label: "Profile", icon: User },
  { href: "/admin/settings/password", label: "Password", icon: KeyRound },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-slate-950 p-4 text-white transition lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <p className="text-lg font-bold">{brand.name}</p>
        <p className="text-xs text-slate-400">Admin Panel</p>
        <nav className="mt-6 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-900",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:col-start-2">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-semibold">Admin</p>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
