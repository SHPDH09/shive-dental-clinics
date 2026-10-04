import { decode } from "next-auth/jwt";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { applySecurityHeaders } from "@/lib/security-headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function withSecurityHeaders(res: NextResponse): NextResponse {
  applySecurityHeaders(res.headers);
  return res;
}

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

  // Only decode session JWT on admin routes (avoids Cloudflare Worker CPU limit on public pages).
  if (isAdminArea) {
    const loggedIn = await isLoggedIn(req);
    if (!isLogin && !loggedIn) {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    if (isLogin && loggedIn) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.nextUrl.origin)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Optional maintenance: set MAINTENANCE_MODE=1 on the Worker (no DB fetch in middleware).
  if (
    process.env.MAINTENANCE_MODE === "1" &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/api")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return withSecurityHeaders(NextResponse.rewrite(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    /*
     * Public HTML only — skip API, static assets, and common files (reduces Worker invocations).
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
