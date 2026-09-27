"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { StatCard } from "@/components/admin/stat-card";
import { Calendar, ClipboardList, Percent, Users, Clock } from "lucide-react";
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

type DashboardData = {
  cards: {
    todayAppointments: number;
    pendingAppointments: number;
    totalPatients: number;
    newLeads: number;
    conversionRate: number;
    monthlyRevenue: string | null;
  };
  charts: {
    appointmentsByDay: { date: string; count: number }[];
    popularServices: { name: string; count: number }[];
  };
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<DashboardData>("/api/admin/dashboard")
      .then(setData)
      .catch(() => setError("Failed to load dashboard"));
  }, []);

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={data.cards.todayAppointments} icon={Calendar} />
        <StatCard label="Pending" value={data.cards.pendingAppointments} icon={Clock} />
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
                <Bar dataKey="count" fill="#0369a1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-900">Popular treatments</h2>
          <ul className="mt-4 space-y-3">
            {data.charts.popularServices.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{s.name}</span>
                <span className="font-semibold text-[var(--primary)]">{s.count}</span>
              </li>
            ))}
            {data.charts.popularServices.length === 0 && (
              <li className="text-sm text-slate-500">No data yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
