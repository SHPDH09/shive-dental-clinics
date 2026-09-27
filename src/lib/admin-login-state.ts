import { prisma } from "@/lib/prisma";
import { findAdminById, updateAdminRow } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { clearLockState, isLocked, nextLockState } from "@/lib/login-protection";

export async function getAdminLoginState(adminId: string) {
  if (canUseSupabaseDataLayer()) {
    const row = await findAdminById(adminId);
    if (!row) return null;
    return {
      active: row.active !== false,
      lockedUntil: row.lockedUntil ? new Date(row.lockedUntil as string) : null,
      loginAttempts: Number(row.loginAttempts ?? 0),
    };
  }

  const row = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { active: true, lockedUntil: true, loginAttempts: true },
  });
  return row;
}

export async function recordLoginFailure(adminId: string): Promise<void> {
  const state = await getAdminLoginState(adminId);
  if (!state) return;
  const next = nextLockState(state.loginAttempts, state.lockedUntil);

  if (canUseSupabaseDataLayer()) {
    await updateAdminRow(adminId, {
      loginAttempts: next.loginAttempts,
      lockedUntil: next.lockedUntil?.toISOString() ?? null,
    });
    return;
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      loginAttempts: next.loginAttempts,
      lockedUntil: next.lockedUntil,
    },
  });
}

export async function recordLoginSuccess(adminId: string): Promise<void> {
  const cleared = clearLockState();
  const now = new Date();

  if (canUseSupabaseDataLayer()) {
    await updateAdminRow(adminId, {
      ...cleared,
      lockedUntil: null,
      lastLoginAt: now.toISOString(),
    });
    return;
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      loginAttempts: cleared.loginAttempts,
      lockedUntil: cleared.lockedUntil,
      lastLoginAt: now,
    },
  });
}

export { isLocked };
