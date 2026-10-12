import { getCachedPublicSiteStatus } from "@/lib/cached-public";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const status = await getCachedPublicSiteStatus();
    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ maintenance: false, message: "" });
  }
}
