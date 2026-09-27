"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  enabled: boolean;
};

export function DoctorsView() {
  const { data, loading, error } = useAdminList<Doctor>("/api/admin/doctors");

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["Name", "Specialization", "Experience", "Active"]} empty={items.length === 0}>
      {items.map((d) => (
        <tr key={d.id}>
          <td className="px-4 py-3 font-medium">{d.name}</td>
          <td className="px-4 py-3">{d.specialization}</td>
          <td className="px-4 py-3">{d.experienceYears} yrs</td>
          <td className="px-4 py-3">{d.enabled ? "Yes" : "No"}</td>
        </tr>
      ))}
    </DataTable>
  );
}
