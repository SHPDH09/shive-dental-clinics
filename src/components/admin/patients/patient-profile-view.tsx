"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { adminFetch } from "@/lib/admin-client";
import { formatCurrency, whatsappLink } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Calendar, MessageCircle, Phone } from "lucide-react";

type Profile = {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  email: string | null;
  age: number | null;
  gender: string | null;
  profilePhoto: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  status: string;
  preferredBranch: { name: string } | null;
  assignedDoctor: { name: string } | null;
  overview: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    lastVisit: { date: string; treatment: string; doctor: string | null } | null;
    nextAppointment: {
      date: string;
      time: string;
      treatment: string;
      doctor: string | null;
      branch: string | null;
      status: string;
    } | null;
    currentTreatment: { name: string; doctor: string | null; status: string } | null;
    paymentsSummary: { totalBilled: number; totalPaid: number; pending: number };
  };
  appointments: {
    id: string;
    date: string;
    time: string;
    doctor: string | null;
    service: string;
    branch: string | null;
    status: string;
  }[];
  treatments: {
    id: string;
    treatmentName: string;
    doctorName: string | null;
    treatmentDate: string;
    status: string;
    notes: string | null;
  }[];
  documents: { id: string; fileName: string; fileUrl: string; category: string }[];
  payments: {
    id: string;
    treatmentName: string | null;
    amountBilled: number;
    amountPaid: number;
    status: string;
  }[];
  messages: { id: string; at: string; title: string; detail: string | null }[];
  timeline: { at: string; kind: string; title: string; label: string }[];
  access: { clinical: boolean };
};

const TABS = [
  "Overview",
  "Appointments",
  "Treatment History",
  "Documents",
  "Payments",
  "Messages",
  "Timeline",
] as const;

export function PatientProfileView({ patientId }: { patientId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [loading, setLoading] = useState(true);
  const [treatmentForm, setTreatmentForm] = useState({ treatmentName: "", treatmentDate: "", notes: "" });
  const [paymentForm, setPaymentForm] = useState({ treatmentName: "", amountBilled: "", amountPaid: "" });
  const [docForm, setDocForm] = useState({ fileName: "", fileUrl: "", category: "XRAY" });
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    return adminFetch<Profile>(`/api/admin/patients/${patientId}?profile=full`)
      .then((data) => {
        setProfile({
          ...data,
          overview: data.overview ?? {
            totalAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            lastVisit: null,
            nextAppointment: null,
            currentTreatment: null,
            paymentsSummary: { totalBilled: 0, totalPaid: 0, pending: 0 },
          },
          appointments: data.appointments ?? [],
          treatments: data.treatments ?? [],
          documents: data.documents ?? [],
          payments: data.payments ?? [],
          messages: data.messages ?? [],
          timeline: data.timeline ?? [],
          access: data.access ?? { clinical: false },
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const addTreatment = async () => {
    if (treatmentForm.treatmentName.trim().length < 2 || !treatmentForm.treatmentDate) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/patients/${patientId}/treatments`, {
        method: "POST",
        body: JSON.stringify({
          treatmentName: treatmentForm.treatmentName.trim(),
          treatmentDate: treatmentForm.treatmentDate,
          notes: treatmentForm.notes.trim() || undefined,
          status: "COMPLETED",
        }),
      });
      setTreatmentForm({ treatmentName: "", treatmentDate: "", notes: "" });
      await loadProfile();
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async () => {
    const billed = Number(paymentForm.amountBilled);
    const paid = Number(paymentForm.amountPaid || 0);
    if (!Number.isFinite(billed) || billed < 0) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/patients/${patientId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          treatmentName: paymentForm.treatmentName.trim() || undefined,
          amountBilled: billed,
          amountPaid: paid,
        }),
      });
      setPaymentForm({ treatmentName: "", amountBilled: "", amountPaid: "" });
      await loadProfile();
    } finally {
      setSaving(false);
    }
  };

  const addDocument = async () => {
    if (!docForm.fileName.trim() || !docForm.fileUrl.trim()) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/patients/${patientId}/documents`, {
        method: "POST",
        body: JSON.stringify({
          fileName: docForm.fileName.trim(),
          fileUrl: docForm.fileUrl.trim(),
          category: docForm.category,
        }),
      });
      setDocForm({ fileName: "", fileUrl: "", category: "XRAY" });
      await loadProfile();
    } finally {
      setSaving(false);
    }
  };

  if (!profile && !loading) return <p className="text-sm text-red-600">Patient not found.</p>;

  const addr = profile
    ? [profile.address, profile.city, profile.state, profile.pinCode].filter(Boolean).join(", ")
    : "";

  return (
    <DataLoadingSection loading={loading} label="Loading patient…" minHeight="min-h-[50vh]">
    {profile ? (
    <div className="space-y-6">
      <Link href="/admin/patients" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            {profile.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePhoto} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1a3260] text-2xl font-bold text-white ring-2 ring-[#f4c430]/40">
                {profile.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
              <p className="font-mono text-sm text-slate-500">Patient ID: {profile.patientCode}</p>
              <p className="mt-2 text-sm text-slate-600">📞 {profile.phone}</p>
              {profile.email && <p className="text-sm text-slate-600">📧 {profile.email}</p>}
              {addr && <p className="text-sm text-slate-600">📍 {addr}</p>}
              <p className="mt-1 text-sm text-slate-500">
                Branch: {profile.preferredBranch?.name ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/appointments"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Book appointment
            </Link>
            <a
              href={whatsappLink(profile.phone, `Hello ${profile.name}`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t ? "admin-tab admin-tab-active" : "admin-tab"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Summary</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Total appointments</dt>
                <dd className="text-lg font-bold">{profile.overview.totalAppointments}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Completed</dt>
                <dd className="text-lg font-bold">{profile.overview.completedAppointments}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Cancelled</dt>
                <dd className="text-lg font-bold">{profile.overview.cancelledAppointments}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Assigned doctor</dt>
                <dd className="font-medium">{profile.assignedDoctor?.name ?? "—"}</dd>
              </div>
            </dl>
          </div>
          {profile.overview.nextAppointment && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-teal-900">
                <Calendar className="h-4 w-4" />
                Upcoming appointment
              </h3>
              <p className="mt-3 text-sm">
                Doctor: {profile.overview.nextAppointment.doctor ?? "—"}
                <br />
                Service: {profile.overview.nextAppointment.treatment}
                <br />
                Date: {format(new Date(profile.overview.nextAppointment.date), "dd MMM yyyy")}
                <br />
                Time: {profile.overview.nextAppointment.time}
                <br />
                Status: {profile.overview.nextAppointment.status}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <h3 className="font-semibold">Payments</h3>
            <p className="mt-2 text-sm">
              Billed: {formatCurrency(profile.overview.paymentsSummary.totalBilled)} · Paid:{" "}
              {formatCurrency(profile.overview.paymentsSummary.totalPaid)} · Pending:{" "}
              {formatCurrency(profile.overview.paymentsSummary.pending)}
            </p>
          </div>
        </div>
      )}

      {tab === "Appointments" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Doctor</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{format(new Date(a.date), "dd MMM yyyy")} {a.time}</td>
                  <td className="px-4 py-3">{a.doctor ?? "—"}</td>
                  <td className="px-4 py-3">{a.service}</td>
                  <td className="px-4 py-3">{a.branch ?? "—"}</td>
                  <td className="px-4 py-3">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Treatment History" && (
        <div className="space-y-3">
          {!profile.access.clinical && profile.appointments.length === 0 && (
            <p className="text-sm text-amber-700">Clinical records are restricted for your role.</p>
          )}
          {profile.access.clinical && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">Add clinical treatment record</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Treatment</Label>
                  <Input
                    value={treatmentForm.treatmentName}
                    onChange={(e) => setTreatmentForm((f) => ({ ...f, treatmentName: e.target.value }))}
                    placeholder="e.g. Root Canal"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={treatmentForm.treatmentDate}
                    onChange={(e) => setTreatmentForm((f) => ({ ...f, treatmentDate: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    rows={2}
                    value={treatmentForm.notes}
                    onChange={(e) => setTreatmentForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="button" disabled={saving} onClick={() => void addTreatment()}>
                Save treatment
              </Button>
            </div>
          )}
          {profile.treatments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No visits yet. Link appointments to this patient or confirm/completed status — visits appear here
              automatically.
            </p>
          ) : (
            profile.treatments.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold">{format(new Date(t.treatmentDate), "dd MMM yyyy")}</p>
                <p className="text-slate-800">{t.treatmentName}</p>
                <p className="text-sm text-slate-500">{t.doctorName ?? "—"} · {t.status}</p>
                {t.notes && <p className="mt-2 text-sm text-slate-600">{t.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Documents" && (
        <ul className="space-y-2">
          {profile.access.clinical && (
            <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-3 list-none">
              <p className="text-sm font-medium">Upload document (paste file URL from storage)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>File name</Label>
                  <Input
                    value={docForm.fileName}
                    onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={docForm.category}
                    onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="XRAY, REPORT, OTHER"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>File URL</Label>
                  <Input
                    value={docForm.fileUrl}
                    onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Button type="button" disabled={saving} onClick={() => void addDocument()}>
                Add document
              </Button>
            </li>
          )}
          {profile.documents.length === 0 ? (
            <li className="text-sm text-slate-500">No documents uploaded.</li>
          ) : (
            profile.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm">
                  {d.category}: {d.fileName}
                </span>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#d91f26]">
                  Download
                </a>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === "Payments" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-medium">Record payment</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Treatment (optional)</Label>
                <Input
                  value={paymentForm.treatmentName}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, treatmentName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Amount billed (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={paymentForm.amountBilled}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amountBilled: e.target.value }))}
                />
              </div>
              <div>
                <Label>Amount paid (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amountPaid: e.target.value }))}
                />
              </div>
            </div>
            <Button type="button" disabled={saving} onClick={() => void addPayment()}>
              Save payment
            </Button>
          </div>
          {profile.payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            profile.payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                {p.treatmentName ?? "Treatment"} — {formatCurrency(p.amountPaid)} /{" "}
                {formatCurrency(p.amountBilled)} ({p.status})
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Messages" && (
        <div className="space-y-3">
          {profile.messages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages logged yet.</p>
          ) : (
            profile.messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{format(new Date(m.at), "dd MMM yyyy HH:mm")}</p>
                <p className="font-medium">{m.title}</p>
                {m.detail && <p className="text-sm text-slate-600">{m.detail}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "Timeline" && (
        <ol className="relative ml-3 border-l border-[#f4c430]/40 pl-6">
          {profile.timeline.length === 0 ? (
            <li className="text-sm text-slate-500 list-none">
              No timeline events yet. Patient registration and appointments appear here once linked.
            </li>
          ) : (
            profile.timeline.map((e, i) => (
              <li key={`${e.at}-${i}`} className="mb-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#d91f26]" />
                <p className="text-xs text-slate-500">{e.label}</p>
                <p className="font-medium text-slate-800">{e.title}</p>
              </li>
            ))
          )}
        </ol>
      )}
    </div>
    ) : null}
    </DataLoadingSection>
  );
}
