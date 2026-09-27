"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { format } from "date-fns";
import { adminFetch } from "@/lib/admin-client";

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
};

export function MessagesView() {
  const { data, loading, error, reload } = useAdminList<Enquiry>("/api/admin/enquiries");

  const markRead = async (id: string) => {
    await adminFetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "READ" }),
    });
    reload();
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataTable headers={["From", "Message", "Status", "Date", ""]} empty={items.length === 0}>
      {items.map((e) => (
        <tr key={e.id} className={e.status === "UNREAD" ? "bg-sky-50/40" : undefined}>
          <td className="px-4 py-3">
            <p className="font-medium">{e.name}</p>
            <p className="text-xs text-slate-500">{e.phone}</p>
          </td>
          <td className="max-w-md px-4 py-3 text-sm text-slate-600">{e.message}</td>
          <td className="px-4 py-3">{e.status}</td>
          <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(e.createdAt), "dd MMM yyyy")}</td>
          <td className="px-4 py-3">
            {e.status === "UNREAD" && (
              <button type="button" className="text-xs font-semibold text-[var(--primary)]" onClick={() => markRead(e.id)}>
                Mark read
              </button>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
