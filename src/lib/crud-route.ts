import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  supabaseCrudById,
  supabaseCrudHandlers,
  useSupabaseCrud,
} from "@/lib/supabase/crud";
import { canUseSupabaseDataLayer } from "@/lib/supabase/data-client";
import { errorMessageFromUnknown, mapSupabaseErrorMessage } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

type ModelName =
  | "patient"
  | "appointment"
  | "lead"
  | "service"
  | "serviceCategory"
  | "doctor"
  | "testimonial"
  | "media"
  | "beforeAfter"
  | "enquiry"
  | "messageTemplate"
  | "heroStat"
  | "notification"
  | "branch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDelegate(model: ModelName): any {
  return prisma[model as keyof typeof prisma];
}

function dbErrorResponse(e: unknown, status = 503) {
  const msg = mapSupabaseErrorMessage(errorMessageFromUnknown(e));
  console.error("Admin CRUD error:", e);
  return NextResponse.json({ error: msg }, { status });
}

export function createCrudHandlers(model: ModelName, options?: { searchFields?: string[] }) {
  const sb = supabaseCrudHandlers(model, options);

  return {
    async GET(req: Request) {
      const { error } = await requireAdminSession();
      if (error) return error;

      if (useSupabaseCrud()) {
        return sb.GET(req);
      }

      const delegate = getDelegate(model);
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
      const q = searchParams.get("q")?.trim();
      const status = searchParams.get("status");
      const skip = (page - 1) * limit;

      try {
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
      } catch (e) {
        if (canUseSupabaseDataLayer()) {
          return sb.GET(req);
        }
        return dbErrorResponse(e);
      }
    },

    async POST(req: Request) {
      const { error } = await requireAdminSession();
      if (error) return error;

      if (useSupabaseCrud()) {
        return sb.POST(req);
      }

      try {
        const delegate = getDelegate(model);
        const data = await req.json();
        const item = await delegate.create({ data });
        return NextResponse.json(item);
      } catch (e) {
        if (canUseSupabaseDataLayer()) {
          return sb.POST(req);
        }
        return dbErrorResponse(e);
      }
    },
  };
}

export async function crudById(model: ModelName, req: Request, id: string) {
  const { error } = await requireAdminSession();
  if (error) return { error };

  if (useSupabaseCrud()) {
    return supabaseCrudById(model, req, id);
  }

  const delegate = getDelegate(model);

  try {
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
  } catch (e) {
    if (canUseSupabaseDataLayer()) {
      return supabaseCrudById(model, req, id);
    }
    return { error: dbErrorResponse(e) };
  }

  return { error: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
}
