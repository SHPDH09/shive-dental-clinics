import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function mapPatientUpdate(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const fields = [
    "name",
    "phone",
    "email",
    "gender",
    "address",
    "medicalNotes",
    "treatmentHistory",
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field] === "" ? null : body[field];
    }
  }

  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth =
      body.dateOfBirth === null || body.dateOfBirth === ""
        ? null
        : new Date(String(body.dateOfBirth));
  }

  return data;
}

export async function GET(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const item = await prisma.patient.findUnique({
    where: { id },
    include: { appointments: { orderBy: { appointmentDate: "desc" }, take: 20 } },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json()) as Record<string, unknown>;
  const data = mapPatientUpdate(body);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const item = await prisma.patient.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { id } = await context.params;

  try {
    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
