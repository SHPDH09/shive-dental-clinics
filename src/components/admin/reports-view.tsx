"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { DATE_PRESET_LABELS } from "@/lib/reports/date-range";
import type { CustomReportType, DatePreset, ReportsPayload } from "@/lib/reports/types";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Percent,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

type BranchOption = { id: string; name: string };
type DoctorOption = { id: string; name: string };
type ServiceOption = { id: string; name: string };

const STATUS_OPTIONS = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const LEAD_SOURCES = [
  "",
  "WEBSITE",
  "GOOGLE",
  "INSTAGRAM",
  "FACEBOOK",
  "WHATSAPP",
  "REFERRAL",
  "WALK_IN",
  "OTHER",
];

const PIE_COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Appointments" },
  { id: "patients", label: "Patients" },
  { id: "leads", label: "Leads" },
  { id: "services", label: "Services" },
  { id: "doctors", label: "Doctors" },
  { id: "branches", label: "Branches" },
  { id: "retention", label: "Retention" },
  { id: "revenue", label: "Revenue" },
  { id: "custom", label: "Custom report" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function exportUrl(params: Record<string, string>) {
  const q = new URLSearchParams(params);
  return `/api/admin/reports/export?${q.toString()}`;
}

export function ReportsView() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>("overview");

  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branchId, setBranchId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [leadSource, setLeadSource] = useState("");

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [customType, setCustomType] = useState<CustomReportType>("appointments");
  const [customGenerated, setCustomGenerated] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("preset", preset);
    if (preset === "custom") {
      if (customFrom) p.set("from", customFrom);
      if (customTo) p.set("to", customTo);
    }
    if (branchId) p.set("branchId", branchId);
    if (doctorId) p.set("doctorId", doctorId);
    if (serviceId) p.set("serviceId", serviceId);
    if (appointmentStatus) p.set("appointmentStatus", appointmentStatus);
    if (leadSource) p.set("leadSource", leadSource);
    return p.toString();
  }, [
    preset,
    customFrom,
    customTo,
    branchId,
    doctorId,
    serviceId,
    appointmentStatus,
    leadSource,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<ReportsPayload>(`/api/admin/reports?${queryString}`);
      setData(res);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    Promise.all([
      adminFetch<{ items: BranchOption[] }>("/api/admin/branches?limit=100"),
      adminFetch<{ items: DoctorOption[] }>("/api/admin/doctors?limit=100"),
      adminFetch<{ items: ServiceOption[] }>("/api/admin/services?limit=100"),
    ])
      .then(([b, d, s]) => {
        setBranches(b.items ?? []);
        setDoctors(d.items ?? []);
        setServices(s.items ?? []);
      })
      .catch(() => {
        setBranches([]);
        setDoctors([]);
        setServices([]);
      });
  }, []);

  const baseExportParams = useMemo(() => {
    const p: Record<string, string> = { preset };
    if (preset === "custom") {
      if (customFrom) p.from = customFrom;
      if (customTo) p.to = customTo;
    }
    if (branchId) p.branchId = branchId;
    if (doctorId) p.doctorId = doctorId;
    if (serviceId) p.serviceId = serviceId;
    if (appointmentStatus) p.appointmentStatus = appointmentStatus;
    if (leadSource) p.leadSource = leadSource;
    return p;
  }, [
    preset,
    customFrom,
    customTo,
    branchId,
    doctorId,
    serviceId,
    appointmentStatus,
    leadSource,
  ]);

  const visibleSections = useMemo(() => {
    if (!data) return SECTIONS;
    return SECTIONS.filter((s) => {
      if (s.id === "revenue") return data.revenueEnabled && data.access.revenue;
      if (s.id === "patients" && !data.access.patients) return false;
      if (s.id === "leads" && !data.access.leads) return false;
      return true;
    });
  }, [data]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="card-premium space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESET_LABELS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setPreset(d.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                preset === d.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-slate-600">
              From{" "}
              <input
                type="date"
                className="ml-1 rounded-lg border border-slate-200 px-2 py-1"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="text-sm text-slate-600">
              To{" "}
              <input
                type="date"
                className="ml-1 rounded-lg border border-slate-200 px-2 py-1"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label="Branch" value={branchId} onChange={setBranchId}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Doctor" value={doctorId} onChange={setDoctorId}>
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Service" value={serviceId} onChange={setServiceId}>
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Appt. status"
            value={appointmentStatus}
            onChange={setAppointmentStatus}
          >
            <option value="">Any status</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Lead source" value={leadSource} onChange={setLeadSource}>
            <option value="">Any source</option>
            {LEAD_SOURCES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </FilterSelect>
          <div className="flex items-end gap-2">
            <ExportMenu
              params={{ ...baseExportParams, section: "full", format: "csv" }}
              disabled={!data?.access.exportCsv}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleSections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${
              section === s.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <LoadingState label="Loading analytics…" />
      ) : !data ? (
        <p className="text-sm text-slate-500">No report data.</p>
      ) : (
        <>
          {data.dbUnavailable && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Database is temporarily unavailable. Showing empty analytics until connection is
              restored.
            </p>
          )}

          {section === "overview" && <OverviewSection data={data} />}
          {section === "appointments" && <AppointmentsSection data={data} exportParams={baseExportParams} />}
          {section === "patients" && <PatientsSection data={data} exportParams={baseExportParams} />}
          {section === "leads" && <LeadsSection data={data} exportParams={baseExportParams} />}
          {section === "services" && <ServicesSection data={data} exportParams={baseExportParams} />}
          {section === "doctors" && <DoctorsSection data={data} exportParams={baseExportParams} />}
          {section === "branches" && <BranchesSection data={data} exportParams={baseExportParams} />}
          {section === "retention" && <RetentionSection data={data} />}
          {section === "revenue" && data.revenue && <RevenueSection data={data} exportParams={baseExportParams} />}
          {section === "custom" && (
            <CustomReportSection
              customType={customType}
              setCustomType={setCustomType}
              onGenerate={() => setCustomGenerated(true)}
              generated={customGenerated}
              data={data}
              exportParams={baseExportParams}
            />
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function ExportMenu({
  params,
  disabled,
  section,
}: {
  params: Record<string, string>;
  disabled?: boolean;
  section?: string;
}) {
  const base = { ...params, ...(section ? { section } : {}) };
  return (
    <div className="flex flex-wrap gap-2">
      <a href={exportUrl({ ...base, format: "csv" })} className={disabled ? "pointer-events-none opacity-40" : ""}>
        <Button type="button" variant="secondary" size="sm">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </a>
      <a href={exportUrl({ ...base, format: "excel" })} className={disabled ? "pointer-events-none opacity-40" : ""}>
        <Button type="button" variant="secondary" size="sm">
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </a>
      <a href={exportUrl({ ...base, format: "pdf" })} className={disabled ? "pointer-events-none opacity-40" : ""}>
        <Button type="button" variant="secondary" size="sm">
          <FileText className="h-4 w-4" /> PDF
        </Button>
      </a>
    </div>
  );
}

function OverviewSection({ data }: { data: ReportsPayload }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total appointments" value={data.summary.totalAppointments} icon={Calendar} />
        <StatCard label="Total patients" value={data.summary.totalPatients} icon={Users} />
        <StatCard label="New leads" value={data.summary.newLeads} icon={ClipboardList} />
        <StatCard
          label="Completed appointments"
          value={data.summary.completedAppointments}
          icon={CheckCircle2}
        />
        <StatCard label="Conversion rate" value={`${data.summary.conversionRate}%`} icon={Percent} />
        {data.summary.revenue != null && (
          <StatCard
            label="Revenue (est.)"
            value={formatCurrency(data.summary.revenue)}
            icon={TrendingUp}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Appointment trend">
          {data.appointments.trend.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.appointments.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Appointment status">
          {data.appointments.statusDistribution.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.appointments.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.appointments.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function AppointmentsSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  const rows = [
    ["Total", data.appointments.total],
    ["Completed", data.appointments.completed],
    ["Confirmed", data.appointments.confirmed],
    ["Pending", data.appointments.pending],
    ["Cancelled", data.appointments.cancelled],
    ["No show", data.appointments.noShow],
    ["Completion rate", `${data.appointments.completionRate}%`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Appointment reports</h2>
        <ExportMenu params={exportParams} section="appointments" />
      </div>

      <div className="card-premium grid max-w-md gap-2 p-5 font-mono text-sm">
        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-500">
          Appointments
        </p>
        {rows.map(([label, val]) => (
          <div key={String(label)} className="flex justify-between border-b border-slate-100 py-1">
            <span className="text-slate-600">{label}</span>
            <span className="font-semibold text-slate-900">{val}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Peak appointment hours">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.appointments.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Appointments by day">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.appointments.byDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function PatientsSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Patient reports</h2>
        <ExportMenu params={exportParams} section="patients" disabled={!data.access.patientsDetail} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total patients" value={data.patients.total} icon={Users} />
        <StatCard label="New patients" value={data.patients.newInRange} icon={Users} />
        <StatCard label="Returning" value={data.patients.returning} icon={Users} />
        <StatCard label="Active in period" value={data.patients.activeInRange} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Patient growth">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.patients.growthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Patients by branch">
          {data.patients.byBranch.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.patients.byBranch}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {data.access.patientsDetail && data.patients.byAgeGroup.length > 0 && (
        <ChartCard title="Age groups">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.patients.byAgeGroup}>
              <XAxis dataKey="group" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function LeadsSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Lead & enquiry reports</h2>
        <ExportMenu params={exportParams} section="leads" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total leads" value={data.leads.total} icon={ClipboardList} />
        <StatCard label="Converted" value={data.leads.converted} icon={CheckCircle2} />
        <StatCard label="Enquiries" value={data.leads.enquiriesInRange} icon={ClipboardList} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center text-sm">
        {[
          ["New", data.leads.new],
          ["Contacted", data.leads.contacted],
          ["Follow-up", data.leads.followUp],
          ["Converted", data.leads.converted],
          ["Lost", data.leads.lost],
        ].map(([label, val]) => (
          <div key={String(label)} className="card-premium p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <ChartCard title="Lead sources & conversion">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Leads</th>
                <th className="py-2 pr-4">Converted</th>
                <th className="py-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.bySource.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No leads in this period
                  </td>
                </tr>
              ) : (
                data.leads.bySource.map((row) => (
                  <tr key={row.source} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-medium">{row.source.replace("_", " ")}</td>
                    <td className="py-2 pr-4">{row.count}</td>
                    <td className="py-2 pr-4">{row.converted}</td>
                    <td className="py-2">{row.conversionRate}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ServicesSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Service reports</h2>
        <ExportMenu params={exportParams} section="services" />
      </div>

      <ChartCard title="Most booked services">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-2">Service</th>
                <th className="py-2 text-right">Appointments</th>
                <th className="py-2 text-right">Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.services.topServices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No service data
                  </td>
                </tr>
              ) : (
                data.services.topServices.map((s) => (
                  <tr key={s.name} className="border-b border-slate-50">
                    <td className="py-2 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 text-right">{s.appointments}</td>
                    <td className="py-2 text-right">{s.completed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="Monthly service demand">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.services.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function DoctorsSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Doctor performance</h2>
        <ExportMenu params={exportParams} section="doctors" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Cancelled</th>
              <th className="px-4 py-3">No-show</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Patients</th>
            </tr>
          </thead>
          <tbody>
            {data.doctors.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No doctor activity for selected filters
                </td>
              </tr>
            ) : (
              data.doctors.rows.map((d) => (
                <tr key={d.id} className="border-t border-slate-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.total}</td>
                  <td className="px-4 py-3">{d.completed}</td>
                  <td className="px-4 py-3">{d.cancelled}</td>
                  <td className="px-4 py-3">{d.noShow}</td>
                  <td className="px-4 py-3">{d.completionRate}%</td>
                  <td className="px-4 py-3">{d.servicesHandled}</td>
                  <td className="px-4 py-3">{d.patientCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BranchesSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Branch comparison</h2>
        <ExportMenu params={exportParams} section="branches" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.branches.rows.map((b) => (
          <div key={b.id} className="card-premium space-y-2 p-5">
            <h3 className="font-semibold text-slate-900">{b.name}</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Appointments</dt>
              <dd className="text-right font-medium">{b.appointments}</dd>
              <dt className="text-slate-500">Patients</dt>
              <dd className="text-right font-medium">{b.patients}</dd>
              <dt className="text-slate-500">Completed</dt>
              <dd className="text-right font-medium">{b.completed}</dd>
              <dt className="text-slate-500">Cancelled</dt>
              <dd className="text-right font-medium">{b.cancelled}</dd>
              <dt className="text-slate-500">Top service</dt>
              <dd className="text-right font-medium">{b.topService ?? "—"}</dd>
              <dt className="text-slate-500">Doctor appts</dt>
              <dd className="text-right font-medium">{b.doctorAppointments}</dd>
            </dl>
            <p className="text-xs text-slate-400">Lead counts are clinic-wide (leads are not branch-tagged).</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetentionSection({ data }: { data: ReportsPayload }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Patient retention</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="New patients" value={data.retention.newPatients} icon={Users} />
        <StatCard label="Returning patients" value={data.retention.returningPatients} icon={Users} />
        <StatCard
          label="Repeat appointment rate"
          value={`${data.retention.repeatAppointmentRate}%`}
          icon={Percent}
        />
        <StatCard label="Follow-up appointments" value={data.retention.followUpAppointments} icon={Calendar} />
        <StatCard
          label="Needs follow-up"
          value={data.retention.patientsNeedingFollowUp}
          icon={ClipboardList}
        />
      </div>
      <ChartCard title="Monthly retention trend">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.retention.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" unit="%" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="new" name="New" stroke="#0ea5e9" />
            <Line yAxisId="left" type="monotone" dataKey="returning" name="Returning" stroke="#14b8a6" />
            <Line yAxisId="right" type="monotone" dataKey="repeatRate" name="Repeat %" stroke="#f59e0b" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function RevenueSection({
  data,
  exportParams,
}: {
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  const rev = data.revenue!;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Revenue analytics</h2>
        <ExportMenu params={exportParams} section="summary" />
      </div>
      <p className="text-sm text-slate-500">
        Estimated from completed appointment service prices. Paid, pending, and refund breakdowns
        appear when full payment tracking is enabled.
      </p>
      <StatCard label="Total estimated revenue" value={formatCurrency(rev.totalEstimated)} icon={TrendingUp} className="max-w-sm" />
      <ChartCard title="Revenue trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={rev.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function CustomReportSection({
  customType,
  setCustomType,
  onGenerate,
  generated,
  data,
  exportParams,
}: {
  customType: CustomReportType;
  setCustomType: (t: CustomReportType) => void;
  onGenerate: () => void;
  generated: boolean;
  data: ReportsPayload;
  exportParams: Record<string, string>;
}) {
  return (
    <div className="card-premium max-w-2xl space-y-4 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Create custom report</h2>
      <p className="text-sm text-slate-500">
        Uses the filters above (date range, branch, doctor, service, status, lead source).
      </p>
      <label className="block text-sm font-medium text-slate-700">
        Report type
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={customType}
          onChange={(e) => setCustomType(e.target.value as CustomReportType)}
        >
          <option value="appointments">Appointments</option>
          <option value="patients">Patients</option>
          <option value="leads">Leads</option>
          <option value="services">Services</option>
          <option value="doctors">Doctors</option>
          <option value="branches">Branches</option>
        </select>
      </label>
      <Button type="button" onClick={onGenerate}>
        Generate report
      </Button>
      {generated && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Preview: {customType} report for {data.clinicName} (
            {data.filters.from.slice(0, 10)} – {data.filters.to.slice(0, 10)})
          </p>
          <ExportMenu params={{ ...exportParams, section: customType }} />
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
      No data for selected filters
    </div>
  );
}
