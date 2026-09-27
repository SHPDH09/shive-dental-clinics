import { handlers } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-env";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const { GET: authGET, POST: authPOST } = handlers;

export async function GET(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      {
        error: "AUTH_SECRET is not set. Add it in Cloudflare → Workers → Settings → Variables.",
      },
      { status: 503 },
    );
  }
  try {
    return await authGET(req);
  } catch (error) {
    console.error("Auth GET failed:", error);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "AUTH_SECRET is not set in Cloudflare Variables." },
      { status: 503 },
    );
  }
  try {
    return await authPOST(req);
  } catch (error) {
    console.error("Auth POST failed:", error);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}
