import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

function getS3Client() {
  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) return null;
  return new S3Client({ region: process.env.AWS_REGION });
}

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

export async function saveUpload(file: File, folder: string): Promise<string> {
  validateUpload(file, VIDEO_TYPES.includes(file.type) ? "video" : "image");
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let outputBuffer = buffer;
  if (IMAGE_TYPES.includes(file.type)) {
    outputBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  }

  const s3 = getS3Client();
  const key = `${folder}/${filename.replace(/\.[^.]+$/, IMAGE_TYPES.includes(file.type) ? ".webp" : `.${ext}`)}`;

  if (s3 && process.env.AWS_S3_BUCKET) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: outputBuffer,
        ContentType: IMAGE_TYPES.includes(file.type) ? "image/webp" : file.type,
      }),
    );
    const base = process.env.AWS_S3_PUBLIC_URL || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    return `${base}/${key}`;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const localName = IMAGE_TYPES.includes(file.type) ? filename.replace(/\.[^.]+$/, ".webp") : filename;
  const filePath = path.join(uploadDir, localName);
  await fs.writeFile(filePath, outputBuffer);
  return `/uploads/${folder}/${localName}`;
}
