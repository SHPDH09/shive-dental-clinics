import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.heroStat.findMany({
      skip,
      take: limit,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.heroStat.count(),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const data = await req.json();
  const item = await prisma.heroStat.create({ data });
  return NextResponse.json(item);
}
