import { authenticateAdmin } from "@/lib/supabase/admin-login";
import { SUPABASE_ACCESS_COOKIE } from "@/lib/supabase/data-client";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { loginSchema } from "@/lib/validations";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = resolveAuthSecret();
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
  const name = sessionCookieName();
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

  if (user.accessToken) {
    res.cookies.set(SUPABASE_ACCESS_COOKIE, user.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return res;
}
