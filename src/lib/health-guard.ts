import { NextResponse } from "next/server";

/**
 * In production, health routes require HEALTHCHECK_TOKEN (Bearer) or return 404.
 * Set HEALTHCHECK_TOKEN in Cloudflare/Vercel secrets for ops monitoring only.
 */
export function healthGuard(req: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = req.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}
