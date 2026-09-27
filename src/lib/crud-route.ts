import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ModelName =
  | "patient"
  | "appointment"
  | "lead"
  | "service"
  | "doctor"
  | "testimonial"
  | "media"
  | "beforeAfter"
  | "enquiry"
  | "heroStat"
  | "notification";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const models: Record<ModelName, any> = {
  patient: prisma.patient,
  appointment: prisma.appointment,
  lead: prisma.lead,
  service: prisma.service,
  doctor: prisma.doctor,
  testimonial: prisma.testimonial,
  media: prisma.media,
  beforeAfter: prisma.beforeAfter,
  enquiry: prisma.enquiry,
  heroStat: prisma.heroStat,
  notification: prisma.notification,
};

export function createCrudHandlers(model: ModelName, options?: { searchFields?: string[] }) {
  const delegate = models[model];

  return {
    async GET(req: Request) {
      const { error } = await requireAdminSession();
      if (error) return error;

      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
      const q = searchParams.get("q")?.trim();
      const status = searchParams.get("status");
      const skip = (page - 1) * limit;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      if (status) where.status = status;
      if (q && options?.searchFields?.length) {
        where.OR = options.searchFields.map((field) => ({
          [field]: { contains: q, mode: "insensitive" },
        }));
      }

      const [items, total] = await Promise.all([
        delegate.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        delegate.count({ where }),
      ]);

      return NextResponse.json({ items, total, page, limit });
    },

    async POST(req: Request) {
      const { error } = await requireAdminSession();
      if (error) return error;
      const data = await req.json();
      const item = await delegate.create({ data });
      return NextResponse.json(item);
    },
  };
}

export async function crudById(model: ModelName, req: Request, id: string) {
  const { error } = await requireAdminSession();
  if (error) return { error };

  const delegate = models[model];

  if (req.method === "GET") {
    const item = await delegate.findUnique({ where: { id } });
    if (!item) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    return { data: item };
  }

  if (req.method === "PATCH") {
    const data = await req.json();
    const item = await delegate.update({ where: { id }, data });
    return { data: item };
  }

  if (req.method === "DELETE") {
    await delegate.delete({ where: { id } });
    return { data: { success: true } };
  }

  return { error: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
}
