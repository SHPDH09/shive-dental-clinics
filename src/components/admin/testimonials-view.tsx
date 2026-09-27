"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";

type Testimonial = {
  id: string;
  patientName: string;
  rating: number;
  treatment: string | null;
  status: string;
  testimonial: string;
};

export function TestimonialsView() {
  const { data, loading, error } = useAdminList<Testimonial>("/api/admin/testimonials");

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["Patient", "Rating", "Treatment", "Status", "Preview"]} empty={items.length === 0}>
      {items.map((t) => (
        <tr key={t.id}>
          <td className="px-4 py-3 font-medium">{t.patientName}</td>
          <td className="px-4 py-3">{t.rating}/5</td>
          <td className="px-4 py-3">{t.treatment ?? "—"}</td>
          <td className="px-4 py-3">{t.status}</td>
          <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-500">{t.testimonial}</td>
        </tr>
      ))}
    </DataTable>
  );
}
