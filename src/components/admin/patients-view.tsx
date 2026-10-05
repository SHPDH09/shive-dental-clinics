"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { format } from "date-fns";

type Patient = {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

export function PatientsView() {
  const { data, loading, error } = useAdminList<Patient>("/api/admin/patients");

  if (error && !loading) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataLoadingSection loading={loading} label="Loading patients…" minHeight="min-h-[240px]">
    <DataTable headers={["Code", "Name", "Contact", "Registered"]} empty={items.length === 0}>
      {items.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-3 font-mono text-xs">{p.patientCode}</td>
          <td className="px-4 py-3 font-medium">{p.name}</td>
          <td className="px-4 py-3 text-sm text-slate-600">
            {p.phone}
            {p.email ? ` · ${p.email}` : ""}
          </td>
          <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(p.createdAt), "dd MMM yyyy")}</td>
        </tr>
      ))}
    </DataTable>
    </DataLoadingSection>
  );
}
