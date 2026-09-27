"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type AdminRecord = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  role: "SUPER_ADMIN" | "STAFF";
  createdAt: string;
};

type AdminRole = "SUPER_ADMIN" | "STAFF";

const emptyForm: {
  loginId: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
} = {
  loginId: "",
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

export function AdminsView() {
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: AdminRecord[] }>("/api/admin/admins");
      setItems(data.items ?? []);
    } catch (e) {
      const status = e && typeof e === "object" && "status" in e ? (e as { status: number }).status : 0;
      setError(status === 403 ? "Super admin access required." : "Could not load admins.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setFormOpen(false);
      setForm(emptyForm);
      setMessage("Admin created. They can sign in with Admin ID or email.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string, loginId: string) => {
    if (!confirm(`Remove admin ${loginId}?`)) return;
    try {
      await adminFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <LoadingState label="Loading admins…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin accounts</h1>
          <p className="text-sm text-slate-500">
            Stored in PostgreSQL. Create new Admin IDs here — no manual database edits.
          </p>
        </div>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New admin
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-700">{message}</p>}

      {formOpen && (
        <div className="card-premium space-y-4 p-6">
          <h2 className="font-semibold text-slate-900">Create admin</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Admin ID (unique login)</Label>
              <Input
                value={form.loginId}
                onChange={(e) => setForm({ ...form, loginId: e.target.value.toUpperCase() })}
                placeholder="e.g. ADM2026X"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email (optional login)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
              >
                <option value="STAFF">Staff</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void onCreate()}>
              {saving ? "Saving…" : "Create"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable headers={["Admin ID", "Name", "Email", "Role", ""]} empty={items.length === 0}>
        {items.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-mono text-xs font-semibold">{r.loginId}</td>
            <td className="px-4 py-3">{r.name}</td>
            <td className="px-4 py-3">{r.email ?? "—"}</td>
            <td className="px-4 py-3">{r.role}</td>
            <td className="px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => void onDelete(r.id, r.loginId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
