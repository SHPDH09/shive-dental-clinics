import type { VoiceAiExtractResponse, VoiceAiField } from "@/lib/voice-booking/ai-field-types";
import { normalizeIndianMobile, normalizeVoiceEmail } from "@/lib/voice-booking/validate-contact";

export type VoiceAiContext = {
  firstName?: string;
  services?: { id: string; name: string }[];
  draft?: {
    patientName?: string;
    phone?: string;
    email?: string;
    treatmentName?: string;
  };
};

export async function fetchVoiceAiConfig(): Promise<boolean> {
  try {
    const r = await fetch("/api/public/voice-booking/config", { cache: "no-store" });
    const j = (await r.json()) as { aiAssistant?: boolean };
    return Boolean(j.aiAssistant);
  } catch {
    return false;
  }
}

export async function voiceAiExtract(
  field: VoiceAiField,
  transcript: string,
  context?: VoiceAiContext,
  timeoutMs = 4000,
): Promise<VoiceAiExtractResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/public/voice-booking/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, transcript, context }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; extract?: VoiceAiExtractResponse };
    return json.ok && json.extract ? json.extract : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function sanitizeAiValue(field: VoiceAiField, value: string | null): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (field === "phone") return normalizeIndianMobile(v);
  if (field === "email") return normalizeVoiceEmail(v);
  if (field === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (field === "time" && /^\d{2}:\d{2}$/.test(v)) return v;
  if (field === "intent" || field === "confirm") return v.toLowerCase();
  return v;
}

/** Prefer AI when confident; else local parser result. */
export async function resolveVoiceField(
  field: VoiceAiField,
  transcript: string,
  localValue: string | null,
  aiEnabled: boolean,
  context?: VoiceAiContext,
): Promise<{ value: string | null; say?: string; intent?: "yes" | "no" | "unknown" | null }> {
  if (!aiEnabled || !transcript.trim()) {
    return { value: localValue };
  }

  const ai = await voiceAiExtract(field, transcript, context);
  if (!ai) return { value: localValue };

  const cleaned = sanitizeAiValue(field, ai.value);
  const useAi =
    cleaned &&
    ai.confidence >= 0.62 &&
    (field === "phone" || field === "email" ? Boolean(cleaned) : true);

  return {
    value: useAi ? cleaned : localValue ?? cleaned,
    say: ai.say?.trim() || undefined,
    intent: ai.intent,
  };
}
