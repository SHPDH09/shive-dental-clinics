"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import { Search, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceHit = { id: string; name: string; slug: string; enabled?: boolean };

export function AdminServiceSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ServiceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchHits = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (q.trim()) params.set("q", q.trim());
      const data = await adminFetch<{ items: ServiceHit[] }>(`/api/admin/services?${params}`);
      setHits(data.items ?? []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchHits(query);
    }, 220);
    return () => window.clearTimeout(t);
  }, [query, fetchHits]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goAll = () => {
    const q = query.trim();
    router.push(q ? `/admin/services?q=${encodeURIComponent(q)}` : "/admin/services");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search all services…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goAll();
            }
          }}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
          aria-label="Search services"
          aria-expanded={open}
          aria-controls="admin-service-search-list"
        />
      </div>
      {open && (
        <div
          id="admin-service-search-list"
          className="absolute left-0 right-0 z-[100] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
        >
          {loading && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No services found.</p>
          ) : (
            hits.map((s) => (
              <Link
                key={s.id}
                href={`/admin/services?q=${encodeURIComponent(s.name)}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sky-50"
                onClick={() => setOpen(false)}
              >
                <Stethoscope className="h-4 w-4 shrink-0 text-sky-600" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{s.name}</span>
                {s.enabled === false && (
                  <span className="shrink-0 text-[10px] uppercase text-slate-400">Draft</span>
                )}
              </Link>
            ))
          )}
          <button
            type="button"
            className="mt-1 w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-sky-700 hover:bg-sky-50"
            onClick={goAll}
          >
            View all services{query.trim() ? ` matching “${query.trim()}”` : ""} →
          </button>
        </div>
      )}
    </div>
  );
}
