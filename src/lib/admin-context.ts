import { resolveAdminDbId } from "@/lib/admin-resolve-id";
import { prisma } from "@/lib/prisma";
import { findAdminById } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import {
  mergePermissions,
  type CustomPermissions,
  type PermissionMatrix,
} from "@/lib/rbac/permissions";

export type AdminContext = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: string;
  branchId: string | null;
  branchName: string | null;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  permissions: PermissionMatrix;
  rawPermissions: CustomPermissions | null;
};

type AdminRow = {
  id: string;
  loginId: string;
  name: string;
  email: string | null;
  phone?: string | null;
  profilePhotoUrl?: string | null;
  role: string;
  branchId?: string | null;
  active?: boolean;
  permissions?: unknown;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date | null;
  branch?: { name: string } | null;
};

function mapRow(row: AdminRow): AdminContext {
  const custom = (row.permissions ?? null) as CustomPermissions | null;
  return {
    id: row.id,
    loginId: row.loginId,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    profilePhotoUrl: row.profilePhotoUrl ?? null,
    role: row.role,
    branchId: row.branchId ?? null,
    branchName: row.branch?.name ?? null,
    active: row.active !== false,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
    createdAt: row.createdAt ? new Date(row.createdAt) : null,
    permissions: mergePermissions(row.role, custom),
    rawPermissions: custom,
  };
}

export async function loadAdminContext(
  sessionAdminId: string,
  sessionEmail?: string | null,
): Promise<AdminContext | null> {
  try {
    const adminId = (await resolveAdminDbId(sessionAdminId, sessionEmail)) ?? sessionAdminId;

    if (canUseSupabaseDataLayer()) {
      const row = await findAdminById(adminId);
      if (!row) return null;
      return mapRow(row as AdminRow);
    }

    const row = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
        role: true,
        branchId: true,
        active: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        branch: { select: { name: true } },
      },
    });
    if (!row) return null;
    return mapRow(row as AdminRow);
  } catch {
    return null;
  }
}

/** Branch filter for list APIs — null means all branches (super admin / unassigned). */
export function branchScopeFilter(admin: AdminContext | null): string | undefined {
  if (!admin) return undefined;
  if (admin.role === "SUPER_ADMIN") return undefined;
  return admin.branchId ?? undefined;
}
