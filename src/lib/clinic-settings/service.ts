import { mergeExtended, DEFAULT_EXTENDED } from "@/lib/clinic-settings/defaults";
import { secretsMeta, stripSecretsFromPatch, toAdminResponse, type DbSettingsRow } from "@/lib/clinic-settings/sanitize";
import type { ClinicSecrets } from "@/lib/clinic-settings/types";
import { prisma } from "@/lib/prisma";
import { canUseSupabaseDataLayer, getAdminSupabaseClient } from "@/lib/supabase/data-client";

const SETTINGS_ID = "default";

function mergeSecrets(existing: unknown, patch: Partial<ClinicSecrets>): ClinicSecrets {
  const base = { ...(existing as ClinicSecrets) };
  for (const [k, v] of Object.entries(patch)) {
    if (v) (base as Record<string, string>)[k] = v;
  }
  return base;
}

export async function loadSettingsRow(): Promise<DbSettingsRow> {
  if (canUseSupabaseDataLayer()) {
    const sb = await getAdminSupabaseClient();
    const { data, error } = await sb
      .from("ClinicSettings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as DbSettingsRow;
    const now = new Date().toISOString();
    const { data: created, error: createError } = await sb
      .from("ClinicSettings")
      .insert({
        id: SETTINGS_ID,
        clinicName: "Shiv Dental Clinic",
        extendedSettings: DEFAULT_EXTENDED,
        secrets: {},
        updatedAt: now,
      })
      .select("*")
      .single();
    if (createError) throw createError;
    return created as DbSettingsRow;
  }

  let row = await prisma.clinicSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) {
    row = await prisma.clinicSettings.create({
      data: {
        id: SETTINGS_ID,
        extendedSettings: DEFAULT_EXTENDED as object,
      },
    });
  }
  return row as unknown as DbSettingsRow;
}

export async function getAdminSettings() {
  const row = await loadSettingsRow();
  const extended = mergeExtended(row.extendedSettings ?? {});
  const response = toAdminResponse({ ...row, extendedSettings: extended });
  response.extended = extended;
  response.secretsMeta = secretsMeta(row.secrets);
  return response;
}

export async function getPublicSiteStatus() {
  const row = await loadSettingsRow();
  const extended = mergeExtended(row.extendedSettings ?? {});
  return {
    maintenance: extended.maintenance.enabled,
    message: extended.maintenance.message,
  };
}

export async function saveAdminSettings(body: Record<string, unknown>) {
  const { data, secrets: secretPatch } = stripSecretsFromPatch(body);

  const existing = await loadSettingsRow();
  const existingSecrets = (existing.secrets ?? {}) as ClinicSecrets;

  if (data.extended && typeof data.extended === "object") {
    data.extendedSettings = mergeExtended({
      ...mergeExtended(existing.extendedSettings ?? {}),
      ...(data.extended as object),
    });
    delete data.extended;
  }

  const nextSecrets =
    Object.keys(secretPatch).length > 0
      ? mergeSecrets(existingSecrets, secretPatch)
      : existingSecrets;

  if (canUseSupabaseDataLayer()) {
    const sb = await getAdminSupabaseClient();
    const payload = {
      id: SETTINGS_ID,
      ...data,
      secrets: nextSecrets,
      updatedAt: new Date().toISOString(),
    };
    const { data: saved, error } = await sb
      .from("ClinicSettings")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return getAdminSettingsFromRow(saved as DbSettingsRow);
  }

  const saved = await prisma.clinicSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data, secrets: nextSecrets },
    update: { ...data, secrets: nextSecrets },
  });

  return getAdminSettingsFromRow(saved as unknown as DbSettingsRow);
}

function getAdminSettingsFromRow(row: DbSettingsRow) {
  const extended = mergeExtended(row.extendedSettings ?? {});
  const response = toAdminResponse({ ...row, extendedSettings: extended });
  response.extended = extended;
  response.secretsMeta = secretsMeta(row.secrets);
  return response;
}
