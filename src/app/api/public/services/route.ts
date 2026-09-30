import { getPublicServices } from "@/lib/public-data";
import { NextResponse } from "next/server";

/** Lightweight service list for voice booking (public, no auth). */
export async function GET() {
  try {
    const services = await getPublicServices();
    return NextResponse.json({
      items: services.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    });
  } catch (e) {
    console.error("Public services list:", e);
    return NextResponse.json({ items: [] });
  }
}
