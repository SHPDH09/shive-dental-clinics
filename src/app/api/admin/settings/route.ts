import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";
import { NextResponse } from "next/server";

const SETTINGS_ID = "default";

const defaultSettings = {
  id: SETTINGS_ID,
  clinicName: "Shiv Dental Clinic",
  tagline: null,
  phone: null,
  email: null,
  address: null,
  mapEmbedUrl: null,
  whatsappNumber: null,
  showRevenueCard: false,
  monthlyRevenue: null,
};

async function getSettingsSupabase() {
  const sb = await getAdminSupabaseClient();
  const { data, error } = await sb
    .from("ClinicSettings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const now = new Date().toISOString();
  const { data: created, error: createError } = await sb
    .from("ClinicSettings")
    .insert({ ...defaultSettings, updatedAt: now })
    .select()
    .single();
  if (createError) throw createError;
  return created;
}

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    if (canUseSupabaseDataLayer()) {
      const settings = await getSettingsSupabase();
      return NextResponse.json(settings);
    }

    let settings = await prisma.clinicSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) {
      settings = await prisma.clinicSettings.create({ data: { id: SETTINGS_ID } });
    }
    return NextResponse.json(settings);
  } catch (e) {
    console.error("GET /api/admin/settings:", e);
    return NextResponse.json(defaultSettings);
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  delete body.id;
  delete body.updatedAt;

  try {
    if (canUseSupabaseDataLayer()) {
      const sb = await getAdminSupabaseClient();
      const { data, error: upsertError } = await sb
        .from("ClinicSettings")
        .upsert({ id: SETTINGS_ID, ...body, updatedAt: new Date().toISOString() })
        .select()
        .single();
      if (upsertError) throw upsertError;
      return NextResponse.json(data);
    }

    const settings = await prisma.clinicSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...body },
      update: body,
    });
    return NextResponse.json(settings);
  } catch (e) {
    console.error("PATCH /api/admin/settings:", e);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
