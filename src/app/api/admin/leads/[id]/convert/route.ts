import { requirePermission } from "@/lib/api-auth";
import { convertLeadToPatient } from "@/lib/leads/convert-lead";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { session, error } = await requirePermission("leads", "edit");
  if (error) return error;

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as { linkPatientId?: string };

  try {
    const result = await convertLeadToPatient(id, {
      forceLinkPatientId: body.linkPatientId,
      createdBy: session!.user.id,
    });
    if (result.duplicate) {
      return NextResponse.json(
        {
          duplicate: true,
          patientId: result.patientId,
          message: "Patient already exists with this phone. Link this lead?",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Conversion failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
