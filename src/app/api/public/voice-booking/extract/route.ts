import { NextResponse } from "next/server";
import { extractVoiceFieldWithAi } from "@/lib/voice-booking/ai-extract.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await extractVoiceFieldWithAi(body);
  if (!result.ok) {
    const status = result.error === "AI not configured" ? 503 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, extract: result.data });
}
