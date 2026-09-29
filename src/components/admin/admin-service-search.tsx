"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import { filterAdminSearchHits, type AdminSearchHit } from "@/lib/admin/admin-search-index";
import type { PermissionMatrix } from "@/lib/rbac/permissions";
import {
  LayoutDashboard,
  Search,
  Settings,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceHit = { id: string; name: string; slug: string; enabled?: boolean };

const GROUP_ORDER: AdminSearchHit["group"][] = ["Pages", "Settings", "Services"];

function groupIcon(group: AdminSearchHit["group"]) {
  if (group === "Settings") return Settings;
  if (group === "Services") return Stethoscope;
  return LayoutDashboard;
}

export function AdminServiceSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [serviceHits, setServiceHits] = useState<ServiceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [permissions, setPermissions] = useState<PermissionMatrix | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminFetch<{ permissions: PermissionMatrix; role: string }>("/api/admin/me")
      .then((me) => {
        setPermissions(me.permissions);
        setRole(me.role);
      })
      .catch(() => {
        setPermissions(null);
        setRole(null);
      });
  }, []);

  const pageHits = useMemo(
    () => filterAdminSearchHits(query, { permissions, role }),
    [query, permissions, role],
  );

  const canViewServices = !permissions || permissions.services?.view;

  const fetchServices = useCallback(
    async (q: string) => {
      if (!canViewServices) {
        setServiceHits([]);
        return;
      }
      setLoadingServices(true);
      try {
        const params = new URLSearchParams({ limit: "8" });
        if (q.trim()) params.set("q", q.trim());
        const data = await adminFetch<{ items: ServiceHit[] }>(`/api/admin/services?${params}`);
        setServiceHits(data.items ?? []);
      } catch {
        setServiceHits([]);
      } finally {
        setLoadingServices(false);
      }
    },
    [canViewServices],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchServices(query);
    }, 220);
    return () => window.clearTimeout(t);
  }, [query, fetchServices]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const serviceRows: AdminSearchHit[] = serviceHits.map((s) => ({
    id: `service-${s.id}`,
    label: s.name,
    href: `/admin/services?q=${encodeURIComponent(s.name)}`,
    group: "Services",
    keywords: [s.slug],
  }));

  const grouped = useMemo(() => {
    const map = new Map<AdminSearchHit["group"], AdminSearchHit[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const h of pageHits) map.get(h.group)?.push(h);
    for (const h of serviceRows) map.get("Services")?.push(h);
    return map;
  }, [pageHits, serviceRows]);

  const totalCount =
    pageHits.length + serviceRows.length + (loadingServices && query ? 0 : 0);

  const goFirst = () => {
    const first =
      pageHits[0] ??
      serviceRows[0] ??
      (canViewServices ? { href: `/admin/services?q=${encodeURIComponent(query.trim())}` } : null);
    if (first?.href) {
      router.push(first.href);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search pages, settings, services…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goFirst();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          aria-label="Search admin"
          aria-expanded={open}
          aria-controls="admin-global-search-list"
        />
      </div>
      {open && (
        <div
          id="admin-global-search-list"
          className="absolute left-0 right-0 z-[100] mt-2 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
        >
          {loadingServices && totalCount === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
          ) : totalCount === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No matches. Try “profile”, “slides”, or a service name.</p>
          ) : (
            GROUP_ORDER.map((group) => {
              const items = grouped.get(group) ?? [];
              if (items.length === 0) return null;
              const Icon = groupIcon(group);
              return (
                <div key={group} className="pb-1">
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group}
                  </p>
                  {items.slice(0, group === "Pages" && !query.trim() ? 14 : 8).map((hit) => (
                    <Link
                      key={hit.id}
                      href={hit.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sky-50"
                      onClick={() => setOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-sky-600" />
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{hit.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </Link>
                  ))}
                </div>
              );
            })
          )}
          {canViewServices && (
            <button
              type="button"
              className="mt-1 w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-sky-700 hover:bg-sky-50"
              onClick={() => {
                const q = query.trim();
                router.push(q ? `/admin/services?q=${encodeURIComponent(q)}` : "/admin/services");
                setOpen(false);
              }}
            >
              Open services manager{query.trim() ? ` · “${query.trim()}”` : ""} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** @deprecated use AdminServiceSearch — same global admin search component */
export const AdminGlobalSearch = AdminServiceSearch;
