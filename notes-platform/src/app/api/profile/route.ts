import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { serializeUser } from "@/lib/serializers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional().nullable(),
  profileImage: z.string().url().optional().nullable(),
});

export async function GET() {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ user: serializeUser(user) });
}

export async function PATCH(req: Request) {
  const { session, error } = await requireUser("STUDENT");
  if (error) return error;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session!.user.id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
      ...(parsed.data.profileImage !== undefined ? { profileImage: parsed.data.profileImage } : {}),
    },
  });
  return NextResponse.json({ user: serializeUser(user) });
}
