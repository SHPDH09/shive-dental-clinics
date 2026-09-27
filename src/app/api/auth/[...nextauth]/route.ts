import { enforceRateLimit } from "@/lib/rate-limit";
import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const { GET: authGET, POST: authPOST } = handlers;

export async function GET(req: NextRequest) {
  try {
    return await authGET(req);
  } catch (error) {
    console.error("Auth GET failed:", error);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "nextauth", 15, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    return await authPOST(req);
  } catch (error) {
    console.error("Auth POST failed:", error);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}
