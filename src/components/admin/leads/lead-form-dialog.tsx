"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-client";
import { LEAD_SOURCE_LABEL } from "@/lib/leads/lead-pipeline";
import { Loader2, X } from "lucide-react";

type Branch = { id: string; name: string };
type Doctor = { id: string; name: string };

const SOURCES = Object.keys(LEAD_SOURCE_LABEL);

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function LeadFormDialog({ open, onClose, onSaved }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsAppNumber: "",
    email: "",
    interestedService: "",
    preferredBranchId: "",
    preferredDoctorId: "",
    source: "WEBSITE",
    priority: "MEDIUM",
    followUpDate: "",
    followUpTime: "",
    notes: "",
    assignedStaff: "",
  });

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      adminFetch<{ items: Branch[] }>("/api/admin/branches?limit=50"),
      adminFetch<{ items: Doctor[] }>("/api/admin/doctors?limit=50"),
    ]).then(([b, d]) => {
      setBranches(b.items ?? []);
      setDoctors(d.items ?? []);
    });
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminFetch("/api/admin/leads", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch {
      setError("Could not save lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold">Add lead</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Lead ID (LEAD-000124) auto-generated.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">
            Name *
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-sm">
            Phone *
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="text-sm">
            WhatsApp
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.whatsAppNumber} onChange={(e) => setForm({ ...form, whatsAppNumber: e.target.value })} />
          </label>
          <label className="sm:col-span-2 text-sm">
            Email
            <input type="email" className="mt-1 w-full rounded-xl border px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="sm:col-span-2 text-sm">
            Interested service *
            <input className="mt-1 w-full rounded-xl border px-3 py-2" value={form.interestedService} onChange={(e) => setForm({ ...form, interestedService: e.target.value })} />
          </label>
          <label className="text-sm">
            Branch
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.preferredBranchId} onChange={(e) => setForm({ ...form, preferredBranchId: e.target.value })}>
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Doctor
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.preferredDoctorId} onChange={(e) => setForm({ ...form, preferredDoctorId: e.target.value })}>
              <option value="">—</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Source *
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Priority
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </label>
          <label className="text-sm">
            Follow-up date
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
          </label>
          <label className="text-sm">
            Follow-up time
            <input type="time" className="mt-1 w-full rounded-xl border px-3 py-2" value={form.followUpTime} onChange={(e) => setForm({ ...form, followUpTime: e.target.value })} />
          </label>
          <label className="sm:col-span-2 text-sm">
            Notes
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
