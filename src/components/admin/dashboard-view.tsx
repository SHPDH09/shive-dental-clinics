"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { StatCard } from "@/components/admin/stat-card";
import { Calendar, ClipboardList, Percent, Users, Clock, CheckCircle2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type BranchOption = { id: string; name: string };

type DashboardData = {
  branchId: string | null;
  branchName: string | null;
  cards: {
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
    newLeads: number;
    conversionRate: number;
    monthlyRevenue: string | null;
  };
  doctorAvailability: { name: string; hours: string | null }[];
  charts: {
    appointmentsByDay: { date: string; count: number }[];
    popularServices: { name: string; count: number }[];
  };
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
      const dash = await adminFetch<DashboardData>(`/api/admin/dashboard${q}`);
      setData(dash);
    } catch {
      setError("Failed to load dashboard");
    }
  }, [branchId]);

  useEffect(() => {
    adminFetch<{ items: BranchOption[] }>("/api/admin/branches?limit=100")
      .then((r) => setBranches(r.items ?? []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) return <LoadingState />;

  const chartData = data.charts.appointmentsByDay.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Branch report</label>
        <select
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {data.branchName && (
          <span className="text-sm text-slate-500">Showing: {data.branchName}</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={data.cards.todayAppointments} icon={Calendar} />
        <StatCard label="Pending" value={data.cards.pendingAppointments} icon={Clock} />
        <StatCard label="Completed" value={data.cards.completedAppointments} icon={CheckCircle2} />
        <StatCard label="Patients" value={data.cards.totalPatients} icon={Users} />
        <StatCard label="New leads" value={data.cards.newLeads} icon={ClipboardList} />
        <StatCard label="Conversion" value={`${data.cards.conversionRate}%`} icon={Percent} />
        {data.cards.monthlyRevenue != null && (
          <StatCard
            label="Revenue (month)"
            value={formatCurrency(data.cards.monthlyRevenue)}
            icon={Calendar}
          />
        )}
      </div>

      {data.doctorAvailability.length > 0 && (
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-900">Doctor availability</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {data.doctorAvailability.map((d) => (
              <li key={d.name}>
                <strong className="text-slate-800">{d.name}</strong>
                {d.hours ? ` — ${d.hours}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-900">Appointments (30 days)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-900">Popular services</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.charts.popularServices.map((s) => (
              <li key={s.name} className="flex justify-between gap-4 border-b border-slate-100 py-2">
                <span className="text-slate-700">{s.name}</span>
                <span className="font-semibold text-slate-900">{s.count}</span>
              </li>
            ))}
            {data.charts.popularServices.length === 0 && (
              <li className="text-slate-500">No appointment data yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
