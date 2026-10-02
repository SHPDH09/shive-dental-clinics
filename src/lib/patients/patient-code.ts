import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

const PREFIX = "SDC";

function parseSequence(code: string): number {
  const m = code.match(/^SDC-(\d+)/i);
  return m ? parseInt(m[1]!, 10) : 0;
}

function formatCode(n: number): string {
  return `${PREFIX}-${String(n).padStart(6, "0")}`;
}

export async function generatePatientCode(): Promise<string> {
  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminSupabaseClient();
      const { data } = await sb
        .from("Patient")
        .select("patientCode")
        .ilike("patientCode", "SDC-%")
        .order("patientCode", { ascending: false })
        .limit(1);
      const last = data?.[0]?.patientCode as string | undefined;
      const next = last ? parseSequence(last) + 1 : 1;
      return formatCode(next);
    } catch {
      return formatCode(Math.floor(Date.now() / 1000) % 999999);
    }
  }

  const last = await prisma.patient.findFirst({
    where: { patientCode: { startsWith: `${PREFIX}-` } },
    orderBy: { patientCode: "desc" },
    select: { patientCode: true },
  });
  const next = last ? parseSequence(last.patientCode) + 1 : 1;
  return formatCode(next);
}
