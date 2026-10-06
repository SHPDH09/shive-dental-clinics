import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calculateNoteFinalPrice } from "@/lib/pricing";
import { serializeNote } from "@/lib/serializers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const noteUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  coverImage: z.string().optional().nullable(),
  pdfPath: z.string().optional().nullable(),
  notesLink: z.string().url().optional().nullable(),
  price: z.number().nonnegative().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ note: serializeNote(note) });
}

export async function PATCH(req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  const parsed = noteUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const price = parsed.data.price ?? Number(existing.price);
  const discountType = parsed.data.discountType ?? existing.discountType;
  const discountValue = parsed.data.discountValue ?? Number(existing.discountValue);
  const finalPrice = calculateNoteFinalPrice(price, discountType, discountValue);

  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.title != null ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.description != null ? { description: parsed.data.description.trim() } : {}),
      ...(parsed.data.coverImage !== undefined ? { coverImage: parsed.data.coverImage } : {}),
      ...(parsed.data.pdfPath !== undefined ? { pdfPath: parsed.data.pdfPath } : {}),
      ...(parsed.data.notesLink !== undefined ? { notesLink: parsed.data.notesLink } : {}),
      ...(parsed.data.price != null ? { price: parsed.data.price } : {}),
      ...(parsed.data.discountType != null ? { discountType: parsed.data.discountType } : {}),
      ...(parsed.data.discountValue != null ? { discountValue: parsed.data.discountValue } : {}),
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
      finalPrice,
    },
  });

  return NextResponse.json({ note: serializeNote(note) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const { id } = await params;
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
