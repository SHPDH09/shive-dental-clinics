"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ClipboardList,
  Percent,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  BarChart3,
  IndianRupee,
  Stethoscope,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type BranchOption = { id: string; name: string };

type DashboardData = {
  dbUnavailable?: boolean;
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
    leadFunnel: { status: string; count: number }[];
    popularServices: { name: string; count: number }[];
    patientGrowth: { date: string; count: number }[];
  };
};

const PIE_COLORS = ["#0ea5e9", "#14b8a6", "#eab308", "#f43f5e", "#8b5cf6", "#64748b"];

const quickActions = [
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/leads", label: "Leads", icon: ClipboardList },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
      const dash = await adminFetch<DashboardData>(`/api/admin/dashboard${q}`);
      setData(dash);
      setUpdatedAt(new Date());
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setRefreshing(false);
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
  if (!data) return <LoadingState label="Loading dashboard…" />;

  const chartData = data.charts.appointmentsByDay.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  const growthData = data.charts.patientGrowth.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  const funnelData = data.charts.leadFunnel.filter((f) => f.count > 0);

  const totalAppts30 = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8 animate-fade-up">
      {data.dbUnavailable && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Dashboard could not load live data from the database. Check Cloudflare secrets{" "}
          <code className="text-xs">SUPABASE_SKEY_B64</code> and redeploy.
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#0b1f3a] via-[#0c4a6e] to-[#0369a1] p-5 text-white shadow-lg md:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">Clinic pulse</p>
          <h2 className="mt-1 text-xl font-bold md:text-2xl">
            {format(new Date(), "EEEE, d MMMM")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-sky-100/90">
            {data.cards.todayAppointments > 0
              ? `${data.cards.todayAppointments} appointment(s) scheduled today · ${data.cards.pendingAppointments} pending confirmation`
              : "No appointments on the calendar for today yet."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={refreshing}
            onClick={() => void load()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {updatedAt && (
            <span className="text-xs text-slate-500">Updated {format(updatedAt, "h:mm a")}</span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-sky-200 hover:shadow-md"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <span className="rounded-xl bg-sky-50 p-2 text-[var(--primary)]">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
        <label className="text-sm font-semibold text-slate-700">Branch report</label>
        <select
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
            {data.branchName}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <StatCard label="Today" value={data.cards.todayAppointments} icon={Calendar} accent="sky" />
        <StatCard label="Pending" value={data.cards.pendingAppointments} icon={Clock} accent="amber" />
        <StatCard
          label="Completed"
          value={data.cards.completedAppointments}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard label="Patients" value={data.cards.totalPatients} icon={Users} accent="violet" />
        <StatCard label="New leads" value={data.cards.newLeads} icon={ClipboardList} accent="rose" />
        <StatCard
          label="Conversion"
          value={`${data.cards.conversionRate}%`}
          icon={Percent}
          accent="teal"
          subtext="Lead to converted"
        />
        {data.cards.monthlyRevenue != null && (
          <StatCard
            label="Revenue (month)"
            value={formatCurrency(data.cards.monthlyRevenue)}
            icon={IndianRupee}
            accent="gold"
          />
        )}
      </div>

      {data.doctorAvailability.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="font-semibold text-slate-900">Doctor availability</h2>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.doctorAvailability.map((d) => (
              <li
                key={d.name}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600"
              >
                <strong className="text-slate-900">{d.name}</strong>
                {d.hours ? <span className="text-slate-500"> · {d.hours}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-semibold text-slate-900">Appointments · 30 days</h2>
              <p className="text-xs text-slate-500">{totalAppts30} total in range</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Lead pipeline</h2>
          <p className="text-xs text-slate-500">Status breakdown</p>
          <div className="mt-2 h-52">
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">No lead data yet.</p>
            )}
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {funnelData.slice(0, 5).map((f, i) => (
              <li key={f.status} className="flex justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {f.status}
                </span>
                <span className="font-semibold text-slate-900">{f.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Popular services</h2>
          <ul className="mt-4 space-y-2">
            {data.charts.popularServices.map((s, i) => (
              <li
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-700">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{s.name}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-900">
                  {s.count}
                </span>
              </li>
            ))}
            {data.charts.popularServices.length === 0 && (
              <li className="text-sm text-slate-500">No appointment data yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Patient growth · 90 days</h2>
          <div className="mt-4 h-56">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">No patient growth data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
