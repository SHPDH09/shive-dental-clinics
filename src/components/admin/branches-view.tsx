"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Pencil, Plus, Trash2 } from "lucide-react";

type BranchStatus = "ACTIVE" | "CLOSED";

type BranchRecord = {
  id: string;
  name: string;
  location: string;
  phone: string | null;
  openTime: string;
  closeTime: string;
  offDays: string | null;
  status: BranchStatus;
  sortOrder: number;
};

const emptyForm: Omit<BranchRecord, "id"> = {
  name: "",
  location: "",
  phone: "",
  openTime: "9:00 AM",
  closeTime: "8:00 PM",
  offDays: "Sunday",
  status: "ACTIVE",
  sortOrder: 0,
};

export function BranchesView() {
  const [items, setItems] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: BranchRecord[] }>("/api/admin/branches?limit=100");
      setItems(data.items ?? []);
    } catch {
      setError("Could not load branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setMessage(null);
  };

  const openEdit = (b: BranchRecord) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      location: b.location,
      phone: b.phone ?? "",
      openTime: b.openTime,
      closeTime: b.closeTime,
      offDays: b.offDays ?? "",
      status: b.status,
      sortOrder: b.sortOrder,
    });
    setFormOpen(true);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const payload = {
      ...form,
      phone: form.phone || null,
      offDays: form.offDays || null,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        await adminFetch(`/api/admin/branches/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Branch updated.");
      } else {
        await adminFetch("/api/admin/branches", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Branch added.");
      }
      setFormOpen(false);
      await load();
    } catch {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this branch?")) return;
    try {
      await adminFetch(`/api/admin/branches/${id}`, { method: "DELETE" });
      await load();
    } catch {
      setMessage("Delete failed.");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Manage clinic branches — locations appear in the website footer.
        </p>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add branch
        </Button>
      </div>

      {formOpen && (
        <div className="card-premium space-y-5 p-6">
          <h3 className="text-lg font-bold text-slate-900">{editingId ? "Edit branch" : "New branch"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Branch name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Shiv Dental Clinic — SG R Annexe"
              />
            </div>
            <div>
              <Label>Status *</Label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BranchStatus })}
              >
                <option value="ACTIVE">Active (open for patients)</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Location / address *</Label>
              <Textarea
                rows={2}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Full address with area and city"
              />
            </div>
            <div>
              <Label>Branch phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Display order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <Label>Open time *</Label>
              <Input value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} placeholder="9:00 AM" />
            </div>
            <div>
              <Label>Close time *</Label>
              <Input value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} placeholder="8:00 PM" />
            </div>
            <div className="md:col-span-2">
              <Label>Off days</Label>
              <Input
                value={form.offDays ?? ""}
                onChange={(e) => setForm({ ...form, offDays: e.target.value })}
                placeholder="e.g. Sunday, or Sunday (half day)"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={save} disabled={saving || !form.name || !form.location}>
              {saving ? "Saving…" : "Save branch"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-teal-700">{message}</p>}

      <DataTable headers={["Branch", "Location", "Hours", "Off days", "Status", "Actions"]} empty={items.length === 0}>
        {items.map((b) => (
          <tr key={b.id}>
            <td className="px-4 py-3 font-medium">{b.name}</td>
            <td className="max-w-xs px-4 py-3 text-sm">{b.location}</td>
            <td className="px-4 py-3 text-sm whitespace-nowrap">
              {b.openTime} – {b.closeTime}
            </td>
            <td className="px-4 py-3 text-sm">{b.offDays ?? "—"}</td>
            <td className="px-4 py-3">
              <span
                className={
                  b.status === "ACTIVE"
                    ? "rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800"
                    : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600"
                }
              >
                {b.status === "ACTIVE" ? "Active" : "Closed"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => openEdit(b)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="rounded p-1 text-red-600 hover:bg-red-50" onClick={() => remove(b.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
