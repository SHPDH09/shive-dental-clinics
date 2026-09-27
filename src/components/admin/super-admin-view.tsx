"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LoadingState } from "@/components/admin/loading-state";
import { StatCard } from "@/components/admin/stat-card";
import { Users, Calendar, ClipboardList, Shield } from "lucide-react";

type Overview = {
  counts: { admins: number; appointments: number; patients: number; enquiries: number };
  activity: {
    id: string;
    adminName: string;
    action: string;
    entityType: string | null;
    entityLabel: string | null;
    createdAt: string;
  }[];
  dbHealth: Record<string, boolean>;
  quickLinks: { href: string; label: string }[];
};

export function SuperAdminView() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Overview>("/api/admin/super/overview")
      .then(setData)
      .catch(() => setError("Could not load super admin overview."));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <LoadingState label="Loading panel…" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Admins" value={data.counts.admins} icon={Shield} />
        <StatCard label="Appointments" value={data.counts.appointments} icon={Calendar} />
        <StatCard label="Patients" value={data.counts.patients} icon={Users} />
        <StatCard label="Messages" value={data.counts.enquiries} icon={ClipboardList} />
      </div>

      <div className="card-premium p-6">
        <h3 className="font-semibold text-slate-900">Quick links</h3>
        <ul className="mt-3 flex flex-wrap gap-3">
          {data.quickLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm font-medium text-[var(--primary)] hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-premium p-6">
        <h3 className="font-semibold text-slate-900">Database health</h3>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(data.dbHealth).map(([table, ok]) => (
            <li key={table} className={ok ? "text-teal-700" : "text-red-600"}>
              {table}: {ok ? "OK" : "Missing or inaccessible"}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-premium p-6">
        <h3 className="font-semibold text-slate-900">Recent activity</h3>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {data.activity.length === 0 && <li className="text-slate-500">No activity logged yet.</li>}
          {data.activity.map((a) => (
            <li key={a.id} className="py-2">
              <span className="font-medium">{a.adminName}</span> — {a.action}{" "}
              {a.entityLabel && <span className="text-slate-500">({a.entityLabel})</span>}
              <span className="ml-2 text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
