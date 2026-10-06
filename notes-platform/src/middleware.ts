import { decode } from "next-auth/jwt";
import { resolveAuthSecret, sessionCookieName } from "@/lib/auth-env";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function getToken(req: NextRequest) {
  const secret = resolveAuthSecret();
  if (!secret) return null;
  const name = sessionCookieName();
  const raw = req.cookies.get(name)?.value;
  if (!raw) return null;
  try {
    return await decode({ token: raw, secret, salt: name });
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken(req);
  const role = token?.role as string | undefined;
  const loggedIn = Boolean(token?.sub);

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (loggedIn && role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }
    if (!loggedIn || role !== "ADMIN") {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const studentRoutes = ["/dashboard", "/cart", "/purchases", "/transactions", "/profile", "/checkout"];
  if (studentRoutes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!loggedIn || role !== "STUDENT") {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/cart",
    "/purchases",
    "/transactions",
    "/profile",
    "/checkout/:path*",
  ],
};
