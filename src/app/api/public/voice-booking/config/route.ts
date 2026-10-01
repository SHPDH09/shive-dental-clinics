import { NextResponse } from "next/server";
import { isVoiceAiConfigured } from "@/lib/voice-booking/ai-extract.server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    aiAssistant: isVoiceAiConfigured(),
  });
}
