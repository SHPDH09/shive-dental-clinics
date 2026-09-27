import { decode } from "next-auth/jwt";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type AdminSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

async function sessionFromCookie(): Promise<AdminSession | null> {
  const secret = resolveAuthSecret();
  const name = sessionCookieName();
  const cookieStore = await cookies();
  const raw = cookieStore.get(name)?.value;
  if (!raw) return null;

  const token = await decode({ token: raw, secret, salt: name });
  if (!token?.sub) return null;

  return {
    user: {
      id: token.sub,
      name: (token.name as string | undefined) ?? null,
      email: (token.email as string | undefined) ?? null,
      role: (token as { role?: string }).role,
    },
  };
}

export async function requireAdminSession() {
  let session: AdminSession | null = null;

  try {
    const { auth } = await import("@/auth");
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.id) {
      session = nextAuthSession as AdminSession;
    }
  } catch {
    // NextAuth can throw when misconfigured; fall back to cookie JWT.
  }

  if (!session) {
    session = await sessionFromCookie();
  }

  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireSuperAdminSession() {
  const { session, error } = await requireAdminSession();
  if (error) return { session: null, error };

  const role = session!.user.role;
  if (role !== "SUPER_ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
