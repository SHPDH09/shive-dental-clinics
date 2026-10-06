import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeNote } from "@/lib/serializers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minDiscount = searchParams.get("minDiscount");
  const sort = searchParams.get("sort") ?? "newest";
  const status = searchParams.get("status");

  const session = await auth();
  const ownedIds =
    session?.user?.role === "STUDENT"
      ? new Set(
          (
            await prisma.purchase.findMany({
              where: { userId: session.user.id },
              select: { noteId: true },
            })
          ).map((p) => p.noteId),
        )
      : new Set<string>();

  const notes = await prisma.note.findMany({
    where: {
      ...(status ? { status: status as "ACTIVE" | "DISABLED" } : { status: "ACTIVE" }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "price_asc"
        ? { finalPrice: "asc" }
        : sort === "price_desc"
          ? { finalPrice: "desc" }
          : sort === "popular"
            ? { purchaseCount: "desc" }
            : { createdAt: "desc" },
  });

  let filtered = notes;
  if (minPrice) filtered = filtered.filter((n) => Number(n.finalPrice) >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter((n) => Number(n.finalPrice) <= Number(maxPrice));
  if (minDiscount) {
    filtered = filtered.filter((n) => {
      const price = Number(n.price);
      const final = Number(n.finalPrice);
      if (price <= 0) return false;
      return ((price - final) / price) * 100 >= Number(minDiscount);
    });
  }

  return NextResponse.json({
    notes: filtered.map((n) => serializeNote(n, ownedIds.has(n.id))),
  });
}
