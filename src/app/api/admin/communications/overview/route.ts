import { requirePermission } from "@/lib/api-auth";
import { getCommunicationChannelStatus } from "@/lib/communications/channels";
import { getCommunicationStats } from "@/lib/communications/stats";
import { ensureCommunicationDefaults } from "@/lib/communications/seed-defaults";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requirePermission("messages", "view");
  if (error) return error;

  try {
    await ensureCommunicationDefaults();
  } catch (e) {
    console.warn("ensureCommunicationDefaults:", e);
  }

  const [stats, channels] = await Promise.all([
    getCommunicationStats(),
    getCommunicationChannelStatus(),
  ]);

  return NextResponse.json({ stats, channels });
}
