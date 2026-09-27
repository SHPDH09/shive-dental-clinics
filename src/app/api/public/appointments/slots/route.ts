import { enforceRateLimit } from "@/lib/rate-limit";
import { getAvailableAppointmentSlots } from "@/lib/appointment-slots";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "appointment-slots", 90, 60 * 1000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId")?.trim();
  const date = searchParams.get("date")?.trim();

  if (!doctorId || !date) {
    return NextResponse.json({ error: "doctorId and date are required" }, { status: 400 });
  }

  try {
    const { slots, closed } = await getAvailableAppointmentSlots(doctorId, date);
    return NextResponse.json({ slots, closed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load slots" }, { status: 503 });
  }
}
