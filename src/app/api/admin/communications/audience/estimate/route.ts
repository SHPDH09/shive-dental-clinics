import { requirePermission } from "@/lib/api-auth";
import { countAudience, type AudienceFilter } from "@/lib/communications/audience";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  const filter = (await req.json()) as AudienceFilter;
  const count = await countAudience(filter);
  return NextResponse.json({ count, filter });
}
