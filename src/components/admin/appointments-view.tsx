"use client";

import { useState } from "react";
import { useAdminList } from "@/components/admin/use-admin-list";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
import {
  type AppointmentDetail,
  downloadAppointmentText,
  appointmentDetailLines,
  printAppointment,
  shareAppointment,
} from "@/lib/admin/appointment-detail-document";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Eye, Printer, Share2, X } from "lucide-react";

type AppointmentRow = {
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
  const { data, loading, error, reload } = useAdminList<AppointmentRow>("/api/admin/appointments");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: string) => {
    setActionMsg(null);
    try {
      const res = await adminFetch<
        AppointmentRow & { patientEmailSent?: boolean; patientEmailWarning?: string }
      >(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (status === "CONFIRMED") {
        if (res.patientEmailSent) {
          setActionMsg("Appointment confirmed — confirmation email sent to patient.");
        } else if (res.patientEmailWarning) {
          setActionMsg(res.patientEmailWarning);
        } else {
          setActionMsg("Appointment confirmed.");
        }
      }
      reload();
      if (detail?.id === id) {
        void openView(id);
      }
    } catch (e) {
      setActionMsg(e instanceof AdminApiError ? e.message : "Update failed");
    }
  };

  const openView = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const item = await adminFetch<AppointmentDetail>(`/api/admin/appointments/${id}`);
      setDetail(item);
    } catch (e) {
      setDetailError(e instanceof AdminApiError ? e.message : "Could not load appointment");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
  };

  const handleShare = async () => {
    if (!detail) return;
    const result = await shareAppointment(detail);
    if (result === "shared") setActionMsg("Appointment shared.");
    else if (result === "copied") setActionMsg("Appointment details copied to clipboard.");
    else setActionMsg("Share not available — use Download instead.");
  };

  const handleDownload = () => {
    if (!detail) return;
    const base = detail.appointmentCode.replace(/[^\w-]+/g, "_");
    downloadAppointmentText(detail, `${base}.txt`);
    setActionMsg("Appointment downloaded as text file.");
  };

  const handlePrint = () => {
    if (!detail) return;
    printAppointment(detail);
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const items = data?.items ?? [];

  return (
    <>
      {actionMsg && (
        <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">{actionMsg}</p>
      )}
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
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => void openView(a.id)}
                  aria-label="View appointment"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                {a.status === "PENDING" && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => updateStatus(a.id, "CONFIRMED")}>
                    Confirm
                  </Button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {(detail || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl card-premium p-6 md:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Appointment details</h3>
                {detail && (
                  <p className="mt-1 font-mono text-sm text-slate-500">{detail.appointmentCode}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
            {detailError && <p className="mt-6 text-sm text-red-600">{detailError}</p>}

            {detail && !detailLoading && (
              <>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {appointmentDetailLines(detail).map((row) => (
                    <div key={row.label} className={row.label.includes("message") || row.label.includes("notes") ? "sm:col-span-2" : ""}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
                      <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                  <Button type="button" variant="secondary" className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button type="button" variant="secondary" className="gap-2" onClick={() => void handleShare()}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button type="button" variant="secondary" className="gap-2" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {detail.status === "PENDING" && (
                    <Button type="button" className="gap-2" onClick={() => void updateStatus(detail.id, "CONFIRMED")}>
                      Confirm appointment
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
