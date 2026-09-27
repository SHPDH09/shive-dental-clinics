"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";

type Item = {
  id: string;
  treatment: string;
  status: string;
  beforeImage: string;
  afterImage: string;
};

export function BeforeAfterView() {
  const { data, loading, error } = useAdminList<Item>("/api/admin/before-after");

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["Treatment", "Status", "Before", "After"]} empty={items.length === 0}>
      {items.map((b) => (
        <tr key={b.id}>
          <td className="px-4 py-3 font-medium">{b.treatment}</td>
          <td className="px-4 py-3">{b.status}</td>
          <td className="max-w-[120px] truncate px-4 py-3 text-xs">{b.beforeImage}</td>
          <td className="max-w-[120px] truncate px-4 py-3 text-xs">{b.afterImage}</td>
        </tr>
      ))}
    </DataTable>
  );
}
