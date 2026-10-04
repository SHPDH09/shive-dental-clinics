import { enforceRateLimit } from "@/lib/rate-limit";
import { getPublicBookingAvailability, isDateOpenForBooking } from "@/lib/appointment-slots";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "appointment-availability", 90, 60 * 1000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId")?.trim();
  const branchId = searchParams.get("branchId")?.trim() || null;
  const date = searchParams.get("date")?.trim();

  if (!doctorId || !branchId) {
    return NextResponse.json({ error: "doctorId and branchId are required" }, { status: 400 });
  }

  try {
    const { weekdays } = await getPublicBookingAvailability(doctorId, branchId);
    const openDays = weekdays.filter((w) => w.enabled);
    const payload: Record<string, unknown> = {
      weekdays,
      openDayLabels: openDays.map((w) => w.label),
      openDayShort: openDays.map((w) => w.shortLabel),
    };
    if (date) {
      payload.dateOpen = isDateOpenForBooking(date, weekdays);
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load availability" }, { status: 503 });
  }
}
