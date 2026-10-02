/**
 * Upsert dental service catalog into the connected database.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/apply-dental-service-catalog.ts
 *   SERVICES_ONLY=1 DATABASE_URL=... npx tsx scripts/apply-dental-service-catalog.ts
 *
 * SERVICES_ONLY=1 — use existing ServiceCategory rows (match by slug); only upsert services.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPgPool } from "../src/lib/pg-pool";
import {
  DENTAL_CATALOG_CATEGORIES,
  DENTAL_CATALOG_SERVICES,
} from "../src/lib/dental-service-catalog";

function resolveDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() ||
    (process.env.SUPABASE_DB_PW_B64
      ? Buffer.from(process.env.SUPABASE_DB_PW_B64, "base64").toString("utf8")
      : "");
  if (!password) {
    try {
      const raw = readFileSync(join(__dirname, "../wrangler.jsonc"), "utf8").replace(/\/\/.*$/gm, "");
      const b64 = raw.match(/"SUPABASE_DB_PW_B64"\s*:\s*"([^"]+)"/)?.[1];
      if (b64) {
        const pw = Buffer.from(b64, "base64").toString("utf8");
        const ref = raw.match(/"SUPABASE_URL"\s*:\s*"https:\/\/([^.]+)/)?.[1] ?? "ojfxtzwzpoosmzotzyxm";
        return `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true`;
      }
    } catch {
      /* ignore */
    }
  }
  if (password) {
    const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "ojfxtzwzpoosmzotzyxm";
    return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true`;
  }
  throw new Error("Set DATABASE_URL or SUPABASE_DB_PASSWORD / SUPABASE_DB_PW_B64");
}

const servicesOnly =
  process.argv.includes("--services-only") || process.env.SERVICES_ONLY === "1";

const pool = createPgPool(resolveDatabaseUrl());
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categoryIds: Record<string, string> = {};

  if (servicesOnly) {
    const rows = await prisma.serviceCategory.findMany({
      select: { id: true, slug: true, name: true },
    });
    for (const row of rows) categoryIds[row.slug] = row.id;
    const needed = [...new Set(DENTAL_CATALOG_SERVICES.map((s) => s.categorySlug))];
    const missing = needed.filter((slug) => !categoryIds[slug]);
    if (missing.length > 0) {
      throw new Error(
        `Missing categories in DB (add or fix slug): ${missing.join(", ")}. Found: ${rows.map((r) => r.slug).join(", ")}`,
      );
    }
    console.log(`Services-only mode: linked to ${rows.length} existing categories.`);
  } else {
    for (let i = 0; i < DENTAL_CATALOG_CATEGORIES.length; i++) {
      const cat = DENTAL_CATALOG_CATEGORIES[i]!;
      const row = await prisma.serviceCategory.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, sortOrder: i },
        create: { name: cat.name, slug: cat.slug, sortOrder: i },
      });
      categoryIds[cat.slug] = row.id;
    }
  }

  const catalogSlugs = new Set<string>();

  for (let i = 0; i < DENTAL_CATALOG_SERVICES.length; i++) {
    const svc = DENTAL_CATALOG_SERVICES[i]!;
    catalogSlugs.add(svc.slug);
    const categoryId = categoryIds[svc.categorySlug];
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        description: svc.description,
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        image: svc.image,
        icon: svc.icon,
        categoryId,
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        faqs: svc.faqs,
        featured: svc.featured ?? false,
        sortOrder: i,
        enabled: true,
        ...(svc.price ? { price: new Prisma.Decimal(svc.price) } : {}),
      },
      create: {
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        image: svc.image,
        icon: svc.icon,
        categoryId,
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        faqs: svc.faqs,
        featured: svc.featured ?? false,
        sortOrder: i,
        enabled: true,
        price: svc.price ? new Prisma.Decimal(svc.price) : null,
      },
    });
  }

  const allIds = await prisma.service.findMany({
    where: { slug: { in: [...catalogSlugs] }, enabled: true },
    select: { id: true },
  });

  const branches = await prisma.branch.findMany({ select: { id: true } });
  for (const b of branches) {
    await prisma.branch.update({
      where: { id: b.id },
      data: { serviceIds: allIds.map((s) => s.id) },
    });
  }

  console.log(
    servicesOnly
      ? `Services synced: ${DENTAL_CATALOG_SERVICES.length} treatments (categories unchanged).`
      : `Catalog synced: ${DENTAL_CATALOG_CATEGORIES.length} categories, ${DENTAL_CATALOG_SERVICES.length} services.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
