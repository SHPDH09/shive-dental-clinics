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
  try {
    return await authPOST(req);
  } catch (error) {
    console.error("Auth POST failed:", error);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}
