import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializeNote } from "@/lib/serializers";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const items = await prisma.cartItem.findMany({
    where: { userId: session!.user.id },
    include: { note: true },
    orderBy: { createdAt: "desc" },
  });

  const owned = await prisma.purchase.findMany({
    where: { userId: session!.user.id },
    select: { noteId: true },
  });
  const ownedSet = new Set(owned.map((p) => p.noteId));

  let subtotal = 0;
  let total = 0;
  const serialized = items
    .filter((i) => i.note.status === "ACTIVE")
    .map((item) => {
      const note = serializeNote(item.note, ownedSet.has(item.noteId));
      subtotal += note.price;
      total += note.finalPrice;
      return { cartItemId: item.id, note };
    });

  return NextResponse.json({
    items: serialized,
    subtotal,
    discount: subtotal - total,
    total,
    appliedCoupon: null,
  });
}

export async function POST(req: Request) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { noteId?: string };
  if (!body.noteId) return NextResponse.json({ error: "noteId is required." }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id: body.noteId } });
  if (!note || note.status !== "ACTIVE") {
    return NextResponse.json({ error: "Note unavailable." }, { status: 404 });
  }

  const owned = await prisma.purchase.findUnique({
    where: { userId_noteId: { userId: session!.user.id, noteId: body.noteId } },
  });
  if (owned) return NextResponse.json({ error: "You already own this note." }, { status: 409 });

  await prisma.cartItem.upsert({
    where: { userId_noteId: { userId: session!.user.id, noteId: body.noteId } },
    create: { userId: session!.user.id, noteId: body.noteId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
