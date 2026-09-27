import { crudById } from "@/lib/crud-route";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("messageTemplate", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("messageTemplate", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await crudById("messageTemplate", req, id);
  if (result.error) return result.error;
  return NextResponse.json(result.data);
}
