import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calculateNoteFinalPrice } from "@/lib/pricing";
import { serializeNote } from "@/lib/serializers";
import { z } from "zod";

const noteSchema = z.object({
  name: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(10),
  coverImage: z.string().optional().nullable(),
  pdfPath: z.string().optional().nullable(),
  notesLink: z.string().url().optional().nullable(),
  price: z.number().nonnegative(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().nonnegative(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function GET(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const notes = await prisma.note.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ notes: notes.map((n) => serializeNote(n)) });
}

export async function POST(req: Request) {
  const { error } = await requireUser("ADMIN");
  if (error) return error;
  const parsed = noteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid note payload." }, { status: 400 });
  if (!parsed.data.pdfPath && !parsed.data.notesLink) {
    return NextResponse.json({ error: "Upload a PDF or provide an external notes link." }, { status: 400 });
  }

  const finalPrice = calculateNoteFinalPrice(
    parsed.data.price,
    parsed.data.discountType,
    parsed.data.discountValue,
  );

  const note = await prisma.note.create({
    data: {
      name: parsed.data.name.trim(),
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      coverImage: parsed.data.coverImage ?? null,
      pdfPath: parsed.data.pdfPath ?? null,
      notesLink: parsed.data.notesLink ?? null,
      price: parsed.data.price,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      finalPrice,
      status: parsed.data.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ note: serializeNote(note) }, { status: 201 });
}
