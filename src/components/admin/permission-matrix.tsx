"use client";

import type { CustomPermissions, PermissionResource } from "@/lib/rbac/permissions";

const ROWS: { resource: PermissionResource; label: string; actions: ("view" | "create" | "edit" | "delete" | "export")[] }[] = [
  { resource: "dashboard", label: "Dashboard", actions: ["view"] },
  { resource: "appointments", label: "Appointments", actions: ["view", "create", "edit", "delete"] },
  { resource: "patients", label: "Patients", actions: ["view", "create", "edit"] },
  { resource: "leads", label: "Leads", actions: ["view", "create", "edit", "delete"] },
  { resource: "reports", label: "Reports", actions: ["view", "export"] },
  { resource: "admins", label: "Admins", actions: ["view", "create", "delete"] },
  { resource: "settings", label: "Settings", actions: ["view", "edit"] },
];

export function PermissionMatrixEditor({
  value,
  onChange,
}: {
  value: CustomPermissions;
  onChange: (next: CustomPermissions) => void;
}) {
  const toggle = (
    resource: PermissionResource,
    action: "view" | "create" | "edit" | "delete" | "export",
    checked: boolean,
  ) => {
    const next = { ...value, [resource]: { ...value[resource], [action]: checked } };
    onChange(next);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Module</th>
            <th className="px-3 py-2">Permissions</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.resource} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-3">
                  {row.actions.map((action) => (
                    <label key={action} className="flex items-center gap-1.5 text-xs capitalize">
                      <input
                        type="checkbox"
                        checked={Boolean(value[row.resource]?.[action])}
                        onChange={(e) => toggle(row.resource, action, e.target.checked)}
                      />
                      {action}
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
