import { prisma } from "@/lib/prisma";
import { getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { useSupabaseCrud } from "@/lib/supabase/crud";

const PREFIX = "LEAD";

function parseSequence(code: string): number {
  const m = code.match(/^LEAD-(\d+)/i);
  return m ? parseInt(m[1]!, 10) : 0;
}

function formatCode(n: number): string {
  return `${PREFIX}-${String(n).padStart(6, "0")}`;
}

export async function generateLeadCode(): Promise<string> {
  if (useSupabaseCrud()) {
    try {
      const sb = await getAdminSupabaseClient();
      const { data } = await sb
        .from("Lead")
        .select("leadCode")
        .ilike("leadCode", "LEAD-%")
        .order("leadCode", { ascending: false })
        .limit(1);
      const last = data?.[0]?.leadCode as string | undefined;
      return formatCode(last ? parseSequence(last) + 1 : 1);
    } catch {
      return formatCode(Math.floor(Date.now() / 1000) % 999999);
    }
  }

  const last = await prisma.lead.findFirst({
    where: { leadCode: { startsWith: `${PREFIX}-` } },
    orderBy: { leadCode: "desc" },
    select: { leadCode: true },
  });
  return formatCode(last ? parseSequence(last.leadCode) + 1 : 1);
}
