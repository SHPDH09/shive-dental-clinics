import { getPublicHeroSlides } from "@/lib/hero-slides";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await getPublicHeroSlides();
  return NextResponse.json({ items });
}
