import { randomUUID } from "crypto";
import { getSupabaseProjectUrl, getSupabaseSecretKey } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-quicktime"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const STORAGE_BUCKET = "uploads";

export function validateUpload(file: File, kind: "image" | "video") {
  const allowed = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const max = kind === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (!allowed.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }
  if (file.size > max) {
    throw new Error(`File too large. Max ${max / (1024 * 1024)}MB`);
  }
}

function safeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40) || "general";
}

async function maybeOptimizeImage(buffer: Buffer, mime: string): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  if (!IMAGE_TYPES.includes(mime)) {
    return { buffer, ext: "bin", contentType: mime };
  }
  try {
    const sharp = (await import("sharp")).default;
    const optimized = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { buffer: optimized, ext: "webp", contentType: "image/webp" };
  } catch {
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    return { buffer, ext, contentType: mime };
  }
}

async function saveToSupabaseStorage(file: File, folder: string): Promise<string> {
  const secret = getSupabaseSecretKey();
  if (!secret) {
    throw new Error("File storage is not configured (missing SUPABASE_SECRET_KEY).");
  }

  const supabase = createClient(getSupabaseProjectUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const raw = Buffer.from(await file.arrayBuffer());
  const isVideo = VIDEO_TYPES.includes(file.type);
  const { buffer, ext, contentType } = isVideo
    ? { buffer: raw, ext: file.name.split(".").pop()?.toLowerCase() || "mp4", contentType: file.type }
    : await maybeOptimizeImage(raw, file.type);

  const objectPath = `${safeFolder(folder)}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: false,
    cacheControl: "3600",
  });

  if (error) {
    if (/bucket/i.test(error.message)) {
      throw new Error(
        `Storage bucket "${STORAGE_BUCKET}" not found. Create a public bucket named "${STORAGE_BUCKET}" in Supabase Storage.`,
      );
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function saveToLocalDisk(file: File, folder: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const raw = Buffer.from(await file.arrayBuffer());
  const isVideo = VIDEO_TYPES.includes(file.type);
  const { buffer, ext } = isVideo
    ? { buffer: raw, ext: file.name.split(".").pop()?.toLowerCase() || "mp4" }
    : await maybeOptimizeImage(raw, file.type);

  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder(folder));
  await fs.mkdir(uploadDir, { recursive: true });
  const localName = `${randomUUID()}.${ext}`;
  const filePath = path.join(uploadDir, localName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${safeFolder(folder)}/${localName}`;
}

function canWriteLocalUploads(): boolean {
  if (process.env.CF_PAGES === "1" || process.env.CLOUDFLARE_WORKER) return false;
  return typeof process.versions?.node === "string";
}

/** Supabase Storage in production; local `public/uploads` in Node dev when no secret key. */
export async function saveUpload(file: File, folder: string): Promise<string> {
  const kind = VIDEO_TYPES.includes(file.type) ? "video" : "image";
  validateUpload(file, kind);

  if (getSupabaseSecretKey()) {
    return saveToSupabaseStorage(file, folder);
  }

  if (canWriteLocalUploads()) {
    try {
      return await saveToLocalDisk(file, folder);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Local upload failed";
      throw new Error(`${msg}. Set SUPABASE_SECRET_KEY to use cloud storage.`);
    }
  }

  throw new Error(
    "Uploads are not available in this environment. Configure Supabase Storage (public bucket \"uploads\") and SUPABASE_SECRET_KEY.",
  );
}
