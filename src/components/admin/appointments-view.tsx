"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { adminFetch } from "@/lib/admin-client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type Appointment = {
  id: string;
  appointmentCode: string;
  patientName: string;
  phone: string;
  treatmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
};

export function AppointmentsView() {
  const { data, loading, error, reload } = useAdminList<Appointment>("/api/admin/appointments");

  const updateStatus = async (id: string, status: string) => {
    await adminFetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    reload();
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable
      headers={["Code", "Patient", "Treatment", "When", "Status", "Actions"]}
      empty={items.length === 0}
    >
      {items.map((a) => (
        <tr key={a.id} className="hover:bg-slate-50/50">
          <td className="px-4 py-3 font-mono text-xs">{a.appointmentCode}</td>
          <td className="px-4 py-3">
            <p className="font-medium text-slate-900">{a.patientName}</p>
            <p className="text-xs text-slate-500">{a.phone}</p>
          </td>
          <td className="px-4 py-3 text-slate-600">{a.treatmentName}</td>
          <td className="px-4 py-3 text-slate-600">
            {format(new Date(a.appointmentDate), "dd MMM yyyy")} · {a.appointmentTime}
          </td>
          <td className="px-4 py-3">
            <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-[var(--primary)]">
              {a.status}
            </span>
          </td>
          <td className="px-4 py-3">
            {a.status === "PENDING" && (
              <Button type="button" size="sm" variant="secondary" onClick={() => updateStatus(a.id, "CONFIRMED")}>
                Confirm
              </Button>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
