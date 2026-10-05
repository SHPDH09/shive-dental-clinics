"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { LeadFormDialog } from "@/components/admin/leads/lead-form-dialog";
import { adminFetch } from "@/lib/admin-client";
import type { LeadListRow } from "@/lib/leads/build-lead-dashboard";
import { LEAD_PIPELINE, LEAD_PRIORITY_LABEL, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/leads/lead-pipeline";
import { whatsappLink } from "@/lib/utils";
import { format, isPast, isToday, startOfDay } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, LayoutGrid, List, Phone, Plus, Search, TrendingUp } from "lucide-react";

type Stats = {
  totalLeads: number;
  newLeads: number;
  followUpsToday: number;
  converted: number;
  lost: number;
  conversionRate: number;
  overdueFollowUps: number;
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-emerald-400",
};

function followUpBadge(date: string | null) {
  if (!date) return null;
  const d = startOfDay(new Date(date));
  if (isPast(d) && !isToday(d)) return "🔴 Overdue";
  if (isToday(d)) return "🟡 Today";
  return "🟢 Upcoming";
}

export function LeadsCrmView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<LeadListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200", page: "1", kanban: view === "kanban" ? "1" : "0" });
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter) params.set("status", statusFilter);
      const [s, list] = await Promise.all([
        adminFetch<Stats>("/api/admin/leads/stats"),
        adminFetch<{ items: LeadListRow[] }>(`/api/admin/leads?${params}`),
      ]);
      setStats(s);
      setItems(list.items ?? []);
    } catch {
      setStats(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const moveLead = async (id: string, status: string) => {
    await adminFetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    void load();
  };

  return (
    <DataLoadingSection loading={loading} label="Loading leads…" minHeight="min-h-[50vh]">
    <div className="space-y-6">
      {stats && stats.overdueFollowUps > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          🔔 {stats.followUpsToday} follow-ups today · {stats.overdueFollowUps} overdue
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total leads" value={stats?.totalLeads ?? 0} icon={List} />
        <StatCard label="New leads" value={stats?.newLeads ?? 0} icon={Plus} />
        <StatCard label="Follow-ups today" value={stats?.followUpsToday ?? 0} icon={List} />
        <StatCard label="Converted" value={stats?.converted ?? 0} icon={TrendingUp} />
        <StatCard label="Lost" value={stats?.lost ?? 0} icon={List} />
        <StatCard label="Conversion rate" value={`${stats?.conversionRate ?? 0}%`} icon={TrendingUp} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border py-2 pl-10 pr-3 text-sm"
            placeholder="Search name, phone, LEAD ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
        </div>
        <select className="rounded-xl border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {[...LEAD_PIPELINE, "LOST"].map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={() => { setQ(""); setStatusFilter(""); void load(); }}>
          Clear filters
        </Button>
        <div className="flex rounded-xl border p-1">
          <button
            type="button"
            className={view === "table" ? "admin-tab admin-tab-active" : "admin-tab"}
            onClick={() => setView("table")}
          >
            <List className="inline h-4 w-4" /> Table
          </button>
          <button
            type="button"
            className={view === "kanban" ? "admin-tab admin-tab-active" : "admin-tab"}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="inline h-4 w-4" /> Kanban
          </button>
        </div>
        <a href="/api/admin/leads/export" className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">
          <Download className="mr-2 h-4 w-4" /> Export
        </a>
        <Button type="button" onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add lead
        </Button>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...LEAD_PIPELINE, "LOST"].map((col) => (
            <div
              key={col}
              className="min-w-[220px] flex-1 rounded-2xl border bg-slate-50/80 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) void moveLead(dragId, col);
                setDragId(null);
              }}
            >
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                {LEAD_STATUS_LABEL[col]}
              </h3>
              <div className="space-y-2">
                {items
                  .filter((l) => l.status === col)
                  .map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      className="cursor-grab rounded-xl border bg-white p-3 shadow-sm active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[l.priority] ?? PRIORITY_DOT.MEDIUM}`} />
                        <Link href={`/admin/leads/${l.id}`} className="font-semibold text-slate-900 hover:text-[#d91f26]">
                          {l.name}
                        </Link>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{l.leadCode}</p>
                      <p className="text-xs text-slate-600">{l.interestedService ?? "—"}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Follow-up</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No leads yet. Forms and site visits create leads automatically.
                  </td>
                </tr>
              ) : (
                items.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[l.priority] ?? ""}`} />
                        <div>
                          <Link href={`/admin/leads/${l.id}`} className="font-semibold text-[#d91f26]">
                            {l.name}
                          </Link>
                          <p className="font-mono text-xs text-slate-500">{l.leadCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {l.phone}
                      {l.email && <div className="text-xs">{l.email}</div>}
                    </td>
                    <td className="px-4 py-3">{l.interestedService ?? "—"}</td>
                    <td className="px-4 py-3">{LEAD_SOURCE_LABEL[l.source] ?? l.source}</td>
                    <td className="px-4 py-3 text-xs">
                      {l.followUpDate ? (
                        <>
                          {followUpBadge(l.followUpDate)} {format(new Date(l.followUpDate), "dd MMM")}
                          {l.followUpTime ? ` ${l.followUpTime}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="admin-chip-gold rounded-full px-2 py-1 text-xs font-medium">
                        {LEAD_STATUS_LABEL[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 text-xs">
                        <Link href={`/admin/leads/${l.id}`} className="text-[#d91f26] hover:underline">View</Link>
                        <a href={`tel:${l.phone}`} className="text-sky-700"><Phone className="inline h-3 w-3" /></a>
                        <a href={whatsappLink(l.whatsAppNumber || l.phone, `Hello ${l.name}`)} target="_blank" rel="noreferrer" className="text-emerald-700">WA</a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <LeadFormDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => void load()} />
    </div>
    </DataLoadingSection>
  );
}
