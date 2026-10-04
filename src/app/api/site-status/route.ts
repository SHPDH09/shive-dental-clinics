import { getPublicSiteStatus } from "@/lib/clinic-settings/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getPublicSiteStatus();
    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ maintenance: false, message: "" });
  }
}
