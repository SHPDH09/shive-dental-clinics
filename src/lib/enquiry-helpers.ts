import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import type { AuditEntry, ConversationEntry } from "@/lib/enquiry-sources";

export function parseConversation(raw: unknown): ConversationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ConversationEntry[];
}

export function parseAuditLog(raw: unknown): AuditEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as AuditEntry[];
}

export function appendAudit(log: AuditEntry[], action: string, by?: string): AuditEntry[] {
  return [...log, { id: createId(), action, at: new Date().toISOString(), by }];
}

export async function findPatientIdByPhone(phone: string): Promise<string | null> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) return null;
  try {
    const patient = await prisma.patient.findFirst({
      where: { phone: { contains: digits } },
      select: { id: true },
    });
    return patient?.id ?? null;
  } catch {
    return null;
  }
}

export async function getPatientContext(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      patientCode: true,
      name: true,
      phone: true,
      email: true,
      appointments: {
        orderBy: { appointmentDate: "desc" },
        take: 8,
        select: {
          id: true,
          appointmentCode: true,
          treatmentName: true,
          appointmentDate: true,
          status: true,
        },
      },
      enquiries: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, createdAt: true, status: true },
      },
    },
  });
  return patient;
}
