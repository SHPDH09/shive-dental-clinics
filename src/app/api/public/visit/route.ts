import { recordWebsiteVisitLead } from "@/lib/record-website-visit-lead";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().min(1).max(500),
  referrer: z.string().max(2000).optional().nullable(),
  name: z.string().max(120).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  queryKeys: z.array(z.string().max(80)).max(30).optional(),
  captureSource: z.string().max(40).optional(),
});

function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(userAgent);
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent");

    if (isLikelyBot(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    if (!checkRateLimit(`visit:${ip}`, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid visit payload" }, { status: 400 });
    }

    const data = parsed.data;
    if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!checkRateLimit(`visit-vid:${data.visitorId}`, 120, 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ ok: true, throttled: true });
    }

    const result = await recordWebsiteVisitLead({
      visitorId: data.visitorId,
      path: data.path,
      referrer: data.referrer,
      name: data.name?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      queryKeys: data.queryKeys,
      captureSource: data.captureSource ?? null,
      userAgent: ua,
      clientIp: ip,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Visit lead error:", e);
    return NextResponse.json({ error: "Could not record visit" }, { status: 500 });
  }
}
