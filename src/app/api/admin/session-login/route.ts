import { authenticateAdmin } from "@/lib/supabase/admin-login";
import { resolveAuthSecret } from "@/lib/auth-env";
import { loginSchema } from "@/lib/validations";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sessionCookieName(secure: boolean) {
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export async function POST(req: Request) {
  const secret = resolveAuthSecret();
  if (!secret) {
    return NextResponse.json({ error: "Server session not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const user = await authenticateAdmin(parsed.data.loginId.trim(), parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production";
  const name = sessionCookieName(secure);
  const token = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    secret,
    salt: name,
    maxAge: 60 * 60 * 24 * 30,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
