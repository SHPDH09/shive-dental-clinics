import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const skip = (page - 1) * limit;
  const readParam = searchParams.get("read");

  const where =
    readParam === "true" || readParam === "1"
      ? { read: true }
      : readParam === "false" || readParam === "0"
        ? { read: false }
        : {};

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const data = await req.json();
  const item = await prisma.notification.create({ data });
  return NextResponse.json(item);
}
