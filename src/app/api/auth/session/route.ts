import { decode } from "next-auth/jwt";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Stable session endpoint (avoids Auth.js 503 when dashboard AUTH_SECRET is missing). */
export async function GET() {
  try {
    const secret = resolveAuthSecret();
    const name = sessionCookieName();
    const cookieStore = await cookies();
    const raw = cookieStore.get(name)?.value;
    if (!raw) {
      return NextResponse.json(null);
    }

    const token = await decode({ token: raw, secret, salt: name });
    if (!token?.sub) {
      return NextResponse.json(null);
    }

    const expires = token.exp
      ? new Date(Number(token.exp) * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      user: {
        id: token.sub,
        name: token.name ?? "Admin",
        email: token.email ?? undefined,
        role: (token as { role?: string }).role,
      },
      expires,
    });
  } catch (error) {
    console.error("Session read failed:", error);
    return NextResponse.json(null);
  }
}
