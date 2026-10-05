"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/admin/stat-card";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { PatientFormDialog } from "@/components/admin/patients/patient-form-dialog";
import { adminFetch } from "@/lib/admin-client";
import { whatsappLink } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import {
  Calendar,
  Download,
  MessageCircle,
  Phone,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  activePatients: number;
  followUpsDue: number;
};

type PatientRow = {
  id: string;
  patientCode: string;
  name: string;
  profilePhoto: string | null;
  age: number | null;
  gender: string | null;
  phone: string;
  email: string | null;
  branchName: string | null;
  lastVisit: string | null;
  nextAppointment: string | null;
  status: string;
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-600",
  FOLLOW_UP_REQUIRED: "bg-amber-50 text-amber-800",
  ARCHIVED: "bg-red-50 text-red-700",
};

export function PatientsManagementView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", page: "1" });
      if (q.trim()) params.set("q", q.trim());
      if (filter) params.set("filter", filter);
      const [s, list] = await Promise.all([
        adminFetch<Stats>("/api/admin/patients/stats"),
        adminFetch<{ items: PatientRow[] }>(`/api/admin/patients?${params}`),
      ]);
      setStats(s);
      setItems(list.items ?? []);
    } catch {
      setStats(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DataLoadingSection loading={loading} label="Loading patients…" minHeight="min-h-[50vh]">
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total patients" value={stats?.totalPatients ?? 0} icon={Users} />
        <StatCard label="New patients" value={stats?.newPatients ?? 0} icon={UserPlus} />
        <StatCard label="Returning" value={stats?.returningPatients ?? 0} icon={Users} />
        <StatCard label="Active" value={stats?.activePatients ?? 0} icon={Users} />
        <StatCard label="Follow-ups due" value={stats?.followUpsDue ?? 0} icon={Calendar} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm"
            placeholder="Search name, ID, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All patients</option>
          <option value="new">New (30 days)</option>
          <option value="returning">Returning</option>
          <option value="follow_up">Follow-up required</option>
          <option value="upcoming">Upcoming appointment</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Apply
        </Button>
        <a
          href="/api/admin/patients/export?format=csv"
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </a>
        <Button type="button" onClick={() => setShowAdd(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add patient
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Last visit</th>
              <th className="px-4 py-3">Next appt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No patients yet. Confirm appointments or add a patient manually.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.profilePhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff8e1] text-sm font-bold text-[#0f1d3d]">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="font-mono text-xs text-slate-500">{p.patientCode}</p>
                        <p className="text-xs text-slate-400">
                          {[p.age != null ? `${p.age}y` : null, p.gender].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.phone}
                    {p.email ? <div className="text-xs">{p.email}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.branchName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.lastVisit ? format(new Date(p.lastVisit), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.nextAppointment ? format(new Date(p.nextAppointment), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_CLASS[p.status] ?? STATUS_CLASS.ACTIVE}`}
                    >
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/admin/patients/${p.id}`}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-[#d91f26] hover:bg-[#fff8e1]"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/patients/${p.id}?edit=1`}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/appointments?phone=${encodeURIComponent(p.phone)}`}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                      >
                        Appt
                      </Link>
                      <a
                        href={whatsappLink(p.phone, `Hello ${p.name}, Shiv Dental Clinic here.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        WA
                      </a>
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex rounded-lg px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PatientFormDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => void load()} />
    </div>
    </DataLoadingSection>
  );
}
