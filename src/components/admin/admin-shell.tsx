"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";

const STORAGE_KEY = "shiv-admin-sidebar-hidden";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    try {
      setSidebarHidden(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarHidden((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {!sidebarHidden && <AdminSidebar onHide={toggleSidebar} />}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AdminHeader sidebarHidden={sidebarHidden} onShowSidebar={toggleSidebar} />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
