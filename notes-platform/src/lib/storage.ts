import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PDF_TYPE = "application/pdf";
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_PDF = 25 * 1024 * 1024;

const PUBLIC_BUCKET = process.env.STORAGE_PUBLIC_BUCKET || "note-covers";
const PRIVATE_BUCKET = process.env.STORAGE_PRIVATE_BUCKET || "note-pdfs";

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.STORAGE_SECRET_KEY?.trim();
  if (!url || !key) {
    throw new Error("Storage is not configured (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function validateImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Cover must be JPEG, PNG, or WebP.");
  if (file.size > MAX_IMAGE) throw new Error("Cover image must be under 5MB.");
}

export function validatePdf(file: File) {
  if (file.type !== PDF_TYPE) throw new Error("Notes file must be a PDF.");
  if (file.size > MAX_PDF) throw new Error("PDF must be under 25MB.");
}

export async function uploadPublicImage(file: File, folder = "covers"): Promise<string> {
  validateImage(file);
  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PUBLIC_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPrivatePdf(file: File): Promise<string> {
  validatePdf(file);
  const supabase = getSupabaseAdmin();
  const path = `pdfs/${randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(path, buffer, {
    contentType: PDF_TYPE,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getSignedPdfUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function isStorageConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.STORAGE_SECRET_KEY?.trim();
  return Boolean(url && key);
}
