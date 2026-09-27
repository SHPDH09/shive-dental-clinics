import { findAdminById, findAdminByLogin } from "@/lib/supabase/admins-data";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { readWorkerEnv } from "@/lib/worker-env";
import { prisma } from "@/lib/prisma";

/** Map session JWT id (Auth UUID / env-bootstrap) to Admin table primary key. */
export async function resolveAdminDbId(
  sessionId: string,
  email?: string | null,
): Promise<string | null> {
  const loginCandidates = [
    email?.trim(),
    readWorkerEnv("ADMIN_EMAIL")?.trim(),
    readWorkerEnv("ADMIN_LOGIN_ID")?.trim(),
  ].filter(Boolean) as string[];

  if (canUseSupabaseDataLayer()) {
    const byId = await findAdminById(sessionId);
    if (byId?.id) return byId.id as string;

    for (const login of loginCandidates) {
      const row = await findAdminByLogin(login);
      if (row?.id) return row.id as string;
    }
    return null;
  }

  const byId = await prisma.admin.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (byId) return byId.id;

  for (const login of loginCandidates) {
    const row = await prisma.admin.findFirst({
      where: { OR: [{ loginId: login }, { email: login }] },
      select: { id: true },
    });
    if (row) return row.id;
  }

  return null;
}
