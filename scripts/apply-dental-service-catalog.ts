/**
 * Upsert full dental service catalog (categories + services) into the connected database.
 * Usage: DATABASE_URL=... npx tsx scripts/apply-dental-service-catalog.ts
 */
import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPgPool } from "../src/lib/pg-pool";
import {
  DENTAL_CATALOG_CATEGORIES,
  DENTAL_CATALOG_SERVICES,
} from "../src/lib/dental-service-catalog";

const pool = createPgPool(process.env.DATABASE_URL!);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categoryIds: Record<string, string> = {};

  for (let i = 0; i < DENTAL_CATALOG_CATEGORIES.length; i++) {
    const cat = DENTAL_CATALOG_CATEGORIES[i]!;
    const row = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: i },
      create: { name: cat.name, slug: cat.slug, sortOrder: i },
    });
    categoryIds[cat.slug] = row.id;
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
    `Catalog synced: ${DENTAL_CATALOG_CATEGORIES.length} categories, ${DENTAL_CATALOG_SERVICES.length} services.`,
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
