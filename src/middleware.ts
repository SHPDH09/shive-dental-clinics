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

  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/maintenance" ||
    pathname.includes(".");

  if (!isAdminArea && !isStatic) {
    try {
      const statusUrl = new URL("/api/site-status", req.nextUrl.origin);
      const res = await fetch(statusUrl);
      if (res.ok) {
        const json = (await res.json()) as { maintenance?: boolean };
        if (json.maintenance && pathname !== "/maintenance") {
          const url = req.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Continue if status check fails
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/((?!_next/static|_next/image).*)"],
};
