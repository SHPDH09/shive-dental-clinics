import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

const DEFAULT_TEMPLATES = [
  {
    slug: "appointment-confirmation",
    name: "Appointment Confirmation",
    channel: "EMAIL",
    category: "APPOINTMENT",
    subject: "Your appointment is confirmed — Shiv Dental Clinic",
    body: "Hello {{patient_name}}, your appointment at Shiv Dental Clinic is confirmed for {{appointment_date}} at {{appointment_time}} with {{doctor_name}}.",
  },
  {
    slug: "appointment-reminder",
    name: "Appointment Reminder",
    channel: "WHATSAPP",
    category: "APPOINTMENT",
    subject: "Appointment reminder",
    body: "Hello {{patient_name}}, this is a reminder about your appointment at Shiv Dental Clinic on {{appointment_date}} at {{appointment_time}}.",
  },
  {
    slug: "appointment-cancellation",
    name: "Appointment Cancellation",
    channel: "SMS",
    category: "APPOINTMENT",
    subject: "Appointment cancelled",
    body: "Hello {{patient_name}}, your appointment scheduled for {{appointment_date}} has been cancelled. Please contact us to reschedule. {{clinic_phone}}",
  },
  {
    slug: "follow-up-reminder",
    name: "Follow-Up Reminder",
    channel: "WHATSAPP",
    category: "FOLLOW_UP",
    subject: "Follow-up due",
    body: "Hello {{patient_name}}, your dental follow-up is due. Please contact Shiv Dental Clinic to schedule your appointment.",
  },
  {
    slug: "general-enquiry",
    name: "General Enquiry",
    channel: "EMAIL",
    category: "GENERAL",
    subject: "Thank you for contacting Shiv Dental Clinic",
    body: "Thank you for contacting Shiv Dental Clinic. Our team will get back to you shortly.",
  },
];

const DEFAULT_AUTOMATIONS = [
  {
    trigger: "APPOINTMENT_CREATED",
    name: "Confirmation on booking",
    channel: "EMAIL",
    templateSlug: "appointment-confirmation",
    timingLabel: "Immediately",
    offsetMinutes: 0,
  },
  {
    trigger: "APPOINTMENT_REMINDER_24H",
    name: "24h reminder",
    channel: "WHATSAPP",
    templateSlug: "appointment-reminder",
    timingLabel: "24 hours before",
    offsetMinutes: -1440,
  },
  {
    trigger: "APPOINTMENT_COMPLETED",
    name: "Follow-up after visit",
    channel: "EMAIL",
    templateSlug: "follow-up-reminder",
    timingLabel: "After completion",
    offsetMinutes: 0,
  },
];

export async function ensureCommunicationDefaults() {
  if (useSupabaseCrud()) {
    const sb = await getAdminSupabaseClient();
    for (let i = 0; i < DEFAULT_TEMPLATES.length; i++) {
      const t = DEFAULT_TEMPLATES[i]!;
      await sb.from("MessageTemplate").upsert(
        {
          id: createId(),
          name: t.name,
          slug: t.slug,
          subject: t.subject,
          body: t.body,
          channel: t.channel,
          category: t.category,
          variables: [
            "patient_name",
            "patient_id",
            "doctor_name",
            "service_name",
            "appointment_date",
            "appointment_time",
            "branch_name",
            "clinic_phone",
            "clinic_whatsapp",
          ],
          sortOrder: i,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "slug" },
      );
    }
    for (let i = 0; i < DEFAULT_AUTOMATIONS.length; i++) {
      const a = DEFAULT_AUTOMATIONS[i]!;
      await sb.from("CommunicationAutomation").upsert(
        {
          id: createId(),
          name: a.name,
          trigger: a.trigger,
          channel: a.channel,
          enabled: true,
          timingLabel: a.timingLabel,
          offsetMinutes: a.offsetMinutes,
          templateSlug: a.templateSlug,
          sortOrder: i,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "trigger,channel" },
      );
    }
    return;
  }

  for (let i = 0; i < DEFAULT_TEMPLATES.length; i++) {
    const t = DEFAULT_TEMPLATES[i]!;
    await prisma.messageTemplate.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        subject: t.subject,
        body: t.body,
        channel: t.channel as never,
        category: t.category,
        variables: [
          "patient_name",
          "patient_id",
          "doctor_name",
          "service_name",
          "appointment_date",
          "appointment_time",
          "branch_name",
          "clinic_phone",
          "clinic_whatsapp",
        ],
        sortOrder: i,
      },
      create: {
        name: t.name,
        slug: t.slug,
        subject: t.subject,
        body: t.body,
        channel: t.channel as never,
        category: t.category,
        variables: [
          "patient_name",
          "patient_id",
          "doctor_name",
          "service_name",
          "appointment_date",
          "appointment_time",
          "branch_name",
          "clinic_phone",
          "clinic_whatsapp",
        ],
        sortOrder: i,
      },
    });
  }

  for (let i = 0; i < DEFAULT_AUTOMATIONS.length; i++) {
    const a = DEFAULT_AUTOMATIONS[i]!;
    await prisma.communicationAutomation.upsert({
      where: {
        trigger_channel: { trigger: a.trigger, channel: a.channel as never },
      },
      update: {
        name: a.name,
        enabled: true,
        timingLabel: a.timingLabel,
        offsetMinutes: a.offsetMinutes,
        templateSlug: a.templateSlug,
        sortOrder: i,
      },
      create: {
        name: a.name,
        trigger: a.trigger,
        channel: a.channel as never,
        enabled: true,
        timingLabel: a.timingLabel,
        offsetMinutes: a.offsetMinutes,
        templateSlug: a.templateSlug,
        sortOrder: i,
      },
    });
  }
}
