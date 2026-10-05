"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-client";
import { X } from "lucide-react";
import { ButtonLogoSpinner } from "@/components/branding/button-logo-spinner";
import Link from "next/link";

type Branch = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function PatientFormDialog({ open, onClose, onSaved }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<
    { id: string; patientCode: string; name: string; phone: string }[]
  >([]);
  const [form, setForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    profilePhoto: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    preferredBranchId: "",
    commWhatsApp: true,
    commPhone: true,
    commEmail: false,
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    void adminFetch<{ items: Branch[] }>("/api/admin/branches?limit=50")
      .then((r) => setBranches(r.items ?? []))
      .catch(() => setBranches([]));
  }, [open]);

  if (!open) return null;

  const submit = async (forceCreate = false) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/patients", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          medicalNotes: form.notes,
          forceCreate,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        message?: string;
        duplicates?: typeof duplicates;
      };
      if (!res.ok) {
        if (res.status === 409 && body.duplicates) {
          setDuplicates(body.duplicates);
          setError(body.message ?? "A patient with this phone number already exists.");
        } else {
          setError(body.message ?? body.error ?? "Could not save patient");
        }
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add patient</h2>
            <p className="text-sm text-slate-500">Patient ID (SDC-000124) auto-generated on save.</p>
          </div>
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm">
            Full name *
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Date of birth
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Gender
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="text-sm">
            Phone *
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            Profile photo URL
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.profilePhoto}
              onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            Address
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label className="text-sm">
            City
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label className="text-sm">
            State
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </label>
          <label className="text-sm">
            PIN code
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.pinCode}
              onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Emergency contact
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Emergency phone
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2 text-sm">
            Preferred branch *
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={form.preferredBranchId}
              onChange={(e) => setForm({ ...form, preferredBranchId: e.target.value })}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="sm:col-span-2 text-sm">
            <legend className="font-medium text-slate-700">Preferred communication</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.commWhatsApp}
                  onChange={(e) => setForm({ ...form, commWhatsApp: e.target.checked })}
                />
                WhatsApp
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.commPhone}
                  onChange={(e) => setForm({ ...form, commPhone: e.target.checked })}
                />
                Phone
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.commEmail}
                  onChange={(e) => setForm({ ...form, commEmail: e.target.checked })}
                />
                Email
              </label>
            </div>
          </fieldset>
          <label className="sm:col-span-2 text-sm">
            Notes
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
            {duplicates.length > 0 && (
              <ul className="mt-2 space-y-1">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/patients/${d.id}`} className="font-medium text-teal-700 underline">
                      {d.name} ({d.patientCode})
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {duplicates.length > 0 && (
              <Button type="button" variant="secondary" className="mt-3" onClick={() => void submit(true)}>
                Continue anyway
              </Button>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit(false)}>
            {saving ? <ButtonLogoSpinner className="mr-2" label="Saving…" /> : null}
            Save patient
          </Button>
        </div>
      </div>
    </div>
  );
}
