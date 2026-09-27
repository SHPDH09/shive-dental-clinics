"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  price: { toString(): string } | null;
  sortOrder: number;
};

export function ServicesView() {
  const { data, loading, error } = useAdminList<Service>("/api/admin/services");

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["Name", "Slug", "Price", "Order", "Active"]} empty={items.length === 0}>
      {items.map((s) => (
        <tr key={s.id}>
          <td className="px-4 py-3 font-medium">{s.name}</td>
          <td className="px-4 py-3 font-mono text-xs">{s.slug}</td>
          <td className="px-4 py-3">{s.price ? formatCurrency(s.price.toString()) : "—"}</td>
          <td className="px-4 py-3">{s.sortOrder}</td>
          <td className="px-4 py-3">{s.enabled ? "Yes" : "No"}</td>
        </tr>
      ))}
    </DataTable>
  );
}
