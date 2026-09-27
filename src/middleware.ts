import { decode } from "next-auth/jwt";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function isLoggedIn(req: NextRequest): Promise<boolean> {
  const name = sessionCookieName();
  const raw = req.cookies.get(name)?.value;
  if (!raw) return false;
  try {
    const token = await decode({
      token: raw,
      secret: resolveAuthSecret(),
      salt: name,
    });
    return Boolean(token?.sub);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin");
  const loggedIn = await isLoggedIn(req);

  if (isAdminArea && !isLogin && !loggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && loggedIn) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
