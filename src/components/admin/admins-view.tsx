"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { adminFetch } from "@/lib/admin-client";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState } from "@/components/admin/loading-state";
import { PermissionMatrixEditor } from "@/components/admin/permission-matrix";
import { StatCard } from "@/components/admin/stat-card";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { CustomPermissions } from "@/lib/rbac/permissions";
import { roleLabel } from "@/lib/rbac/permissions";
import {
  Eye,
  KeyRound,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

type AdminRecord = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: string;
  branchId: string | null;
  branchName?: string | null;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  permissions?: CustomPermissions | null;
};

type ActivityRow = {
  id: string;
  adminName: string;
  action: string;
  entityType: string | null;
  entityLabel: string | null;
  createdAt: string;
};

type BranchOption = { id: string; name: string };

type FormState = {
  name: string;
  email: string;
  phone: string;
  profilePhotoUrl: string;
  password: string;
  confirmPassword: string;
  role: "SUPER_ADMIN" | "MANAGER" | "RECEPTIONIST";
  branchId: string;
  active: boolean;
  permissions: CustomPermissions;
  useCustomPermissions: boolean;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  profilePhotoUrl: "",
  password: "",
  confirmPassword: "",
  role: "RECEPTIONIST",
  branchId: "",
  active: true,
  permissions: {},
  useCustomPermissions: false,
};

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "admin-chip-gold",
    MANAGER: "bg-sky-100 text-sky-800",
    RECEPTIONIST: "bg-teal-100 text-teal-800",
    STAFF: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? "bg-slate-100"}`}>
      {roleLabel(role)}
    </span>
  );
}

export function AdminsView() {
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; recentOnline: number } | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterActive, setFilterActive] = useState("");

  const [mode, setMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (filterRole) p.set("role", filterRole);
    if (filterBranch) p.set("branchId", filterBranch);
    if (filterActive) p.set("active", filterActive);
    return p.toString();
  }, [q, filterRole, filterBranch, filterActive]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{
        items: AdminRecord[];
        stats: typeof stats;
        recentActivity: ActivityRow[];
      }>(`/api/admin/admins?${query}`);
      setItems(data.items ?? []);
      setStats(data.stats);
      setActivity(data.recentActivity ?? []);
    } catch (e) {
      const status = e && typeof e === "object" && "status" in e ? (e as { status: number }).status : 0;
      setError(status === 403 ? "Super admin access required." : "Could not load admins.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminFetch<{ items: BranchOption[] }>("/api/admin/branches?limit=100")
      .then((r) => setBranches(r.items ?? []))
      .catch(() => setBranches([]));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setSelected(null);
    setMode("create");
  };

  const openView = (row: AdminRecord) => {
    setSelected(row);
    setMode("view");
  };

  const openEdit = async (row: AdminRecord) => {
    setSelected(row);
    try {
      const detail = await adminFetch<AdminRecord & { permissions?: CustomPermissions }>(
        `/api/admin/admins/${row.id}`,
      );
      setForm({
        name: detail.name,
        email: detail.email ?? "",
        phone: detail.phone ?? "",
        profilePhotoUrl: detail.profilePhotoUrl ?? "",
        password: "",
        confirmPassword: "",
        role: (detail.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : detail.role === "MANAGER" || detail.role === "STAFF" ? "MANAGER" : "RECEPTIONIST"),
        branchId: detail.branchId ?? "",
        active: detail.active !== false,
        permissions: (detail.permissions as CustomPermissions) ?? {},
        useCustomPermissions: Boolean(detail.permissions && Object.keys(detail.permissions).length),
      });
      setMode("edit");
    } catch {
      alert("Could not load admin details");
    }
  };

  const saveCreate = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          branchId: form.branchId || null,
          permissions: form.useCustomPermissions ? form.permissions : undefined,
        }),
      });
      setMode(null);
      setMessage("Admin account created.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        profilePhotoUrl: form.profilePhotoUrl || null,
        role: form.role,
        branchId: form.branchId || null,
        active: form.active,
        permissions: form.useCustomPermissions ? form.permissions : null,
      };
      if (form.password) {
        body.password = form.password;
      }
      await adminFetch(`/api/admin/admins/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMode(null);
      setMessage("Admin updated.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: AdminRecord) => {
    if (!confirm(`${row.active ? "Deactivate" : "Activate"} ${row.name}?`)) return;
    await adminFetch(`/api/admin/admins/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !row.active }),
    });
    await load();
  };

  const resetPassword = async (row: AdminRecord) => {
    const password = prompt("Enter new password (min 8 chars, upper, lower, number):");
    if (!password) return;
    await adminFetch(`/api/admin/admins/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    });
    setMessage(`Password reset for ${row.name}.`);
  };

  const onDelete = async (row: AdminRecord) => {
    if (!confirm(`Delete admin ${row.name}? This cannot be undone.`)) return;
    await adminFetch(`/api/admin/admins/${row.id}`, { method: "DELETE" });
    await load();
  };

  const branchLabel = (row: AdminRecord) => {
    if (!row.branchId) return "All branches";
    return row.branchName ?? branches.find((b) => b.id === row.branchId)?.name ?? row.branchId;
  };

  if (loading && items.length === 0) return <LoadingState label="Loading admin accounts…" />;

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total admins" value={stats.total} icon={Users} />
          <StatCard label="Active" value={stats.active} icon={UserCheck} />
          <StatCard label="Inactive" value={stats.inactive} icon={Lock} />
          <StatCard label="Recent online" value={stats.recentOnline} icon={Shield} />
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-48"
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="RECEPTIONIST">Receptionist</option>
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add admin
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-700">{message}</p>}

      {(mode === "create" || mode === "edit") && (
        <div className="card-premium space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "create" ? "Add admin" : `Edit — ${selected?.name}`}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Profile photo"
                folder="admins"
                value={form.profilePhotoUrl || null}
                onChange={(url) => setForm({ ...form, profilePhotoUrl: url })}
              />
            </div>
            <div>
              <Label>Role *</Label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as FormState["role"] })
                }
              >
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="MANAGER">Manager</option>
                <option value="SUPER_ADMIN">Admin (full access)</option>
              </select>
            </div>
            <div>
              <Label>Assigned branch</Label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {mode === "create" && (
              <>
                <div>
                  <Label>Password *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <Label>Confirm password *</Label>
                  <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Account active
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.useCustomPermissions}
                onChange={(e) => setForm({ ...form, useCustomPermissions: e.target.checked })}
              />
              Custom permissions (override role defaults)
            </label>
          </div>
          {form.useCustomPermissions && (
            <PermissionMatrixEditor
              value={form.permissions}
              onChange={(permissions) => setForm({ ...form, permissions })}
            />
          )}
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void (mode === "create" ? saveCreate() : saveEdit())}>
              {saving ? "Saving…" : mode === "create" ? "Create admin" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "view" && selected && (
        <div className="card-premium space-y-3 p-6">
          <h2 className="text-lg font-semibold">{selected.name}</h2>
          <p className="text-sm text-slate-600">{selected.email}</p>
          <p className="text-sm">{roleBadge(selected.role)}</p>
          <p className="text-sm text-slate-600">Branch: {branchLabel(selected)}</p>
          <p className="text-sm text-slate-600">
            Status: {selected.active ? "Active" : "Inactive"}
          </p>
          <Button type="button" variant="secondary" onClick={() => setMode(null)}>
            Close
          </Button>
        </div>
      )}

      <DataTable
        headers={["Profile", "Name", "Email", "Phone", "Role", "Branch", "Status", "Last login", "Created", "Actions"]}
        empty={items.length === 0}
      >
        {items.map((r) => (
          <tr key={r.id} className="border-t border-slate-50">
            <td className="px-3 py-3">
              {r.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                  {r.name.slice(0, 1)}
                </div>
              )}
            </td>
            <td className="px-3 py-3 font-medium">{r.name}</td>
            <td className="px-3 py-3 text-sm">{r.email ?? "—"}</td>
            <td className="px-3 py-3 text-sm">{r.phone ?? "—"}</td>
            <td className="px-3 py-3">{roleBadge(r.role)}</td>
            <td className="px-3 py-3 text-sm">{branchLabel(r)}</td>
            <td className="px-3 py-3">
              <span className={r.active ? "text-teal-700" : "text-red-600"}>
                {r.active ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">
              {r.lastLoginAt ? format(new Date(r.lastLoginAt), "dd MMM yyyy HH:mm") : "—"}
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">
              {format(new Date(r.createdAt), "dd MMM yyyy")}
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => openView(r)} aria-label="View">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void openEdit(r)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void toggleActive(r)} aria-label="Toggle active">
                  {r.active ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void resetPassword(r)} aria-label="Reset password">
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => void onDelete(r)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {activity.length > 0 && (
        <div className="card-premium p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Recent activity</h2>
          <ul className="space-y-3 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 pb-2">
                <span>
                  <strong>{a.adminName}</strong> — {a.action}
                  {a.entityLabel ? `: ${a.entityLabel}` : ""}
                </span>
                <span className="text-xs text-slate-500">
                  {format(new Date(a.createdAt), "dd MMM yyyy HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
