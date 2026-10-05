"use client";

import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { DataLoadingSection } from "@/components/admin/loading-state";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  status: string;
  interestedService: string | null;
  notes?: string | null;
};

function isAutoVisit(notes: string | null | undefined): boolean {
  return Boolean(notes?.includes('"type":"auto_website_visit"') || notes?.includes("auto_website_visit"));
}

export function LeadsView() {
  const { data, loading, error } = useAdminList<Lead>("/api/admin/leads");

  if (error && !loading) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <DataLoadingSection loading={loading} label="Loading leads…" minHeight="min-h-[240px]">
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-700">
        <strong className="text-slate-900">Auto leads:</strong> Site visits create leads automatically. Email/phone appear when
        the visitor uses Google One Tap, hidden browser autofill, ad links with{" "}
        <code className="text-xs">?email=</code> / <code className="text-xs">?phone=</code>, or books/contact form. Browsers
        cannot share personal email/phone silently without user action (privacy law).
      </div>
    <DataTable headers={["Name", "Phone", "Email", "Source", "Status", "Interest"]} empty={items.length === 0}>
      {items.map((l) => (
        <tr key={l.id}>
          <td className="px-4 py-3 font-medium">
            {l.name}
            {isAutoVisit(l.notes) && (
              <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-700">
                Site visit
              </span>
            )}
          </td>
          <td className="px-4 py-3">{l.phone === "Not provided" ? "—" : l.phone}</td>
          <td className="px-4 py-3 text-sm text-slate-600">{l.email?.trim() || "—"}</td>
          <td className="px-4 py-3 text-slate-600">{l.source}</td>
          <td className="px-4 py-3">
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{l.status}</span>
          </td>
          <td className="px-4 py-3 text-sm text-slate-500">{l.interestedService ?? "—"}</td>
        </tr>
      ))}
    </DataTable>
    </div>
    </DataLoadingSection>
  );
}
