import { NextResponse } from "next/server";

export async function requireAdminSession() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireSuperAdminSession() {
  const { session, error } = await requireAdminSession();
  if (error) return { session: null, error };

  const role = (session!.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
