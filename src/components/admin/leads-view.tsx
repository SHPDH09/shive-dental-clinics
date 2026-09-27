"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  interestedService: string | null;
};

export function LeadsView() {
  const { data, loading, error } = useAdminList<Lead>("/api/admin/leads");

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["Name", "Phone", "Source", "Status", "Interest"]} empty={items.length === 0}>
      {items.map((l) => (
        <tr key={l.id}>
          <td className="px-4 py-3 font-medium">{l.name}</td>
          <td className="px-4 py-3">{l.phone}</td>
          <td className="px-4 py-3 text-slate-600">{l.source}</td>
          <td className="px-4 py-3">
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{l.status}</span>
          </td>
          <td className="px-4 py-3 text-sm text-slate-500">{l.interestedService ?? "—"}</td>
        </tr>
      ))}
    </DataTable>
  );
}
