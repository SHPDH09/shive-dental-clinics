import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SETTINGS_ID = "default";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  let settings = await prisma.clinicSettings.findUnique({ where: { id: SETTINGS_ID } });

  if (!settings) {
    settings = await prisma.clinicSettings.create({ data: { id: SETTINGS_ID } });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  delete body.id;
  delete body.updatedAt;

  const settings = await prisma.clinicSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...body },
    update: body,
  });

  return NextResponse.json(settings);
}
