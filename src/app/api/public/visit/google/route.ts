import { recordWebsiteVisitLead } from "@/lib/record-website-visit-lead";
import { verifyGoogleIdToken } from "@/lib/verify-google-id-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  credential: z.string().min(20),
  visitorId: z.string().min(8).max(64),
  path: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (!checkRateLimit(`visit-google:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const profile = await verifyGoogleIdToken(parsed.data.credential);
    if (!profile) {
      return NextResponse.json({ error: "Could not verify Google sign-in" }, { status: 401 });
    }

    await recordWebsiteVisitLead({
      visitorId: parsed.data.visitorId,
      path: parsed.data.path || "/",
      name: profile.name,
      email: profile.email,
      phone: null,
      queryKeys: ["google_one_tap"],
      clientIp: ip,
    });

    return NextResponse.json({ ok: true, name: profile.name, email: profile.email });
  } catch (e) {
    console.error("Google visit lead error:", e);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
