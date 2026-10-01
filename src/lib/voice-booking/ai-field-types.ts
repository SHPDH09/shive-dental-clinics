import { z } from "zod";

export const voiceAiFieldSchema = z.enum([
  "intent",
  "name",
  "phone",
  "email",
  "service",
  "date",
  "time",
  "confirm",
]);

export type VoiceAiField = z.infer<typeof voiceAiFieldSchema>;

export const voiceAiExtractRequestSchema = z.object({
  field: voiceAiFieldSchema,
  transcript: z.string().min(1).max(2500),
  context: z
    .object({
      firstName: z.string().optional(),
      services: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
      draft: z
        .object({
          patientName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          treatmentName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const voiceAiExtractResponseSchema = z.object({
  value: z.string().nullable(),
  say: z.string().max(600),
  intent: z.enum(["yes", "no", "unknown"]).nullable(),
  confidence: z.number().min(0).max(1),
});

export type VoiceAiExtractResponse = z.infer<typeof voiceAiExtractResponseSchema>;
