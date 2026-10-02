/**
 * Writes scripts/supabase-dental-service-catalog-generated.sql
 * Run: npx tsx scripts/generate-dental-catalog-sql.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DENTAL_CATALOG_CATEGORIES,
  DENTAL_CATALOG_SERVICES,
} from "../src/lib/dental-service-catalog";

function sqlStr(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function catId(slug: string) {
  return `scat_${slug.replace(/-/g, "_")}`;
}

function svcId(slug: string) {
  return `svc_${slug.replace(/-/g, "_")}`;
}

const lines: string[] = [
  "-- Shiv Dental Clinic — full service catalog (generated)",
  "-- Supabase → SQL Editor → paste & Run (backup first)",
  "-- Regenerate: npx tsx scripts/generate-dental-catalog-sql.ts",
  "",
  "BEGIN;",
  "",
];

for (let i = 0; i < DENTAL_CATALOG_CATEGORIES.length; i++) {
  const c = DENTAL_CATALOG_CATEGORIES[i]!;
  lines.push(`INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")`);
  lines.push(
    `VALUES (${sqlStr(catId(c.slug))}, ${sqlStr(c.name)}, ${sqlStr(c.slug)}, ${i}, NOW(), NOW())`,
  );
  lines.push(`ON CONFLICT ("slug") DO UPDATE SET`);
  lines.push(`  "name" = EXCLUDED."name",`);
  lines.push(`  "sortOrder" = EXCLUDED."sortOrder",`);
  lines.push(`  "updatedAt" = NOW();`);
  lines.push("");
}

for (let i = 0; i < DENTAL_CATALOG_SERVICES.length; i++) {
  const s = DENTAL_CATALOG_SERVICES[i]!;
  const cid = catId(s.categorySlug);
  lines.push(`INSERT INTO "Service" (`);
  lines.push(
    `  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",`,
  );
  lines.push(
    `  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",`,
  );
  lines.push(`  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"`);
  lines.push(`) VALUES (`);
  lines.push(`  ${sqlStr(svcId(s.slug))},`);
  lines.push(`  ${sqlStr(s.name)},`);
  lines.push(`  ${sqlStr(s.slug)},`);
  lines.push(`  ${sqlStr(s.description)},`);
  lines.push(`  ${sqlStr(s.shortDesc)},`);
  lines.push(`  ${sqlStr(s.whatIsTreatment)},`);
  lines.push(`  ${sqlStr(s.image)},`);
  lines.push(`  ${sqlStr(s.icon)},`);
  lines.push(
    `  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = ${sqlStr(s.categorySlug)} LIMIT 1),`,
  );
  lines.push(`  ${sqlStr(s.duration)},`);
  lines.push(`  ${sqlJson(s.benefits)},`);
  lines.push(`  ${sqlJson(s.steps)},`);
  lines.push(`  ${sqlJson(s.faqs)},`);
  lines.push(`  ${s.featured ? "true" : "false"},`);
  lines.push(`  true,`);
  lines.push(`  ${i},`);
  lines.push(`  false,`);
  lines.push(`  NOW(), NOW()`);
  lines.push(`)`);
  lines.push(`ON CONFLICT ("slug") DO UPDATE SET`);
  lines.push(`  "name" = EXCLUDED."name",`);
  lines.push(`  "description" = EXCLUDED."description",`);
  lines.push(`  "shortDesc" = EXCLUDED."shortDesc",`);
  lines.push(`  "whatIsTreatment" = EXCLUDED."whatIsTreatment",`);
  lines.push(`  "image" = EXCLUDED."image",`);
  lines.push(`  "icon" = EXCLUDED."icon",`);
  lines.push(`  "categoryId" = EXCLUDED."categoryId",`);
  lines.push(`  "treatmentDuration" = EXCLUDED."treatmentDuration",`);
  lines.push(`  "benefits" = EXCLUDED."benefits",`);
  lines.push(`  "treatmentSteps" = EXCLUDED."treatmentSteps",`);
  lines.push(`  "faqs" = EXCLUDED."faqs",`);
  lines.push(`  "featured" = EXCLUDED."featured",`);
  lines.push(`  "enabled" = true,`);
  lines.push(`  "sortOrder" = EXCLUDED."sortOrder",`);
  lines.push(`  "updatedAt" = NOW();`);
  lines.push("");
}

lines.push(`-- Link all catalog services to every branch (booking dropdown)`);
lines.push(`UPDATE "Branch"`);
lines.push(`SET "serviceIds" = (`);
lines.push(`  SELECT COALESCE(jsonb_agg("id" ORDER BY "sortOrder"), '[]'::jsonb)`);
lines.push(`  FROM "Service"`);
lines.push(`  WHERE "enabled" = true AND "slug" IN (`);
const slugList = DENTAL_CATALOG_SERVICES.map((s) => sqlStr(s.slug)).join(", ");
lines.push(`    ${slugList}`);
lines.push(`  )`);
lines.push(`)::json`);
lines.push(`WHERE "published" = true;`);
lines.push("");
lines.push(`NOTIFY pgrst, 'reload schema';`);
lines.push("COMMIT;");

const outPath = join(__dirname, "supabase-dental-service-catalog-generated.sql");
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath} (${DENTAL_CATALOG_CATEGORIES.length} categories, ${DENTAL_CATALOG_SERVICES.length} services)`);
