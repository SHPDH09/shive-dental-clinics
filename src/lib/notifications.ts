import { prisma } from "@/lib/prisma";
import { supabaseCreate, useSupabaseCrud } from "@/lib/supabase/crud";
import type { NotificationType } from "@/generated/prisma/client";

export async function createNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}) {
  if (useSupabaseCrud()) {
    await supabaseCreate("notification", {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      read: false,
    });
    return;
  }

  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    },
  });
}
