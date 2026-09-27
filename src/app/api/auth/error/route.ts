import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Avoid NextAuth default /api/auth/error 500 — send users to login with a query flag. */
export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const error = incoming.searchParams.get("error") ?? "AuthError";
  const login = new URL("/admin/login", incoming.origin);
  login.searchParams.set("error", error);
  return NextResponse.redirect(login);
}
