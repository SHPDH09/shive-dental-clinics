import {
  voiceAiExtractRequestSchema,
  voiceAiExtractResponseSchema,
  type VoiceAiExtractResponse,
  type VoiceAiField,
} from "@/lib/voice-booking/ai-field-types";

function fieldInstructions(field: VoiceAiField): string {
  switch (field) {
    case "intent":
      return "User wants dental appointment or not. value: yes|no|unknown (lowercase words).";
    case "name":
      return "Patient full name, title case, no extra words.";
    case "phone":
      return "Indian mobile: exactly 10 digits, starts 6-9, value digits only.";
    case "email":
      return "Valid email, lowercase.";
    case "service":
      return "Dental treatment name from context list if possible.";
    case "date":
      return "Appointment date ISO yyyy-MM-dd, today onward.";
    case "time":
      return "Time 24h HH:mm.";
    case "confirm":
      return "User confirms booking yes/no.";
    default:
      return "";
  }
}

export function isVoiceAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function extractVoiceFieldWithAi(
  body: unknown,
): Promise<{ ok: true; data: VoiceAiExtractResponse } | { ok: false; error: string }> {
  const parsed = voiceAiExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "AI not configured" };
  }

  const { field, transcript, context } = parsed.data;
  const model = process.env.VOICE_AI_MODEL?.trim() || "gpt-4o-mini";

  const system = `You are the Shiv Dental Clinic phone receptionist (female, warm Hinglish/Hindi).
Clean messy Indian voice-to-text into structured booking data. Be fast and precise.
Return ONLY JSON: {"value":string|null,"say":string,"intent":"yes"|"no"|"unknown"|null,"confidence":0-1}
"say": one short natural reply (max 2 sentences) for TTS — human, not robotic.
${fieldInstructions(field)}
If transcript is empty noise, value null, confidence low.`;

  const userPayload = {
    field,
    transcript,
    context: context ?? {},
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `AI request failed (${res.status})` };
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return { ok: false, error: "Empty AI response" };

  try {
    const raw = JSON.parse(content) as unknown;
    const data = voiceAiExtractResponseSchema.parse(raw);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Invalid AI JSON" };
  }
}
