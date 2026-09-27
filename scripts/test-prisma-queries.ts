import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { subDays } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildReportsData } from "../src/lib/reports/build-reports";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { createPgPool } from "../src/lib/pg-pool";
import { prisma as appPrisma } from "../src/lib/prisma";

function loadWranglerVars(): void {
  const path = join(__dirname, "../wrangler.jsonc");
  const raw = readFileSync(path, "utf8").replace(/\/\/.*$/gm, "");
  for (const m of raw.matchAll(/"([A-Z0-9_]+)"\s*:\s*"([^"]+)"/g)) {
    const [, key, value] = m;
    if (key && value && !process.env[key]?.trim()) {
      process.env[key] = value;
    }
  }
}

function maskUrl(url: string): string {
  return url.replace(/:([^:@/]+)@/, ":****@");
}

async function runStep(name: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    const result = await fn();
    console.log(`OK ${name}`, JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`FAIL ${name}`, error.message);
      if ("code" in error) console.error("  code:", (error as NodeJS.ErrnoException).code);
      if ("meta" in error) console.error("  meta:", JSON.stringify((error as { meta?: unknown }).meta));
    } else {
      console.error(`FAIL ${name}`, error);
    }
    process.exitCode = 1;
  }
}

async function runSuite(label: string, prisma: PrismaClient): Promise<boolean> {
  console.log(`\n=== ${label} ===`);
  let ok = true;

  const to = new Date();
  const from = subDays(to, 30);

  const steps: [string, () => Promise<unknown>][] = [
    [
      "clinicSettings.findUnique",
      () => prisma.clinicSettings.findUnique({ where: { id: "default" } }),
    ],
    [
      "appointment.groupBy",
      () =>
        prisma.appointment.groupBy({
          by: ["status"],
          _count: true,
          where: { appointmentDate: { gte: from, lte: to } },
        }),
    ],
    [
      "branch.findMany",
      () =>
        prisma.branch.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 5,
        }),
    ],
  ];

  for (const [name, fn] of steps) {
    const before = process.exitCode;
    await runStep(name, fn);
    if (process.exitCode && process.exitCode !== before) ok = false;
  }

  return ok;
}

async function main() {
  loadWranglerVars();

  const url = resolveDatabaseUrl();
  if (!url) {
    console.error("resolveDatabaseUrl() returned undefined (need SUPABASE_DB_PW_B64 or DATABASE_URL)");
    process.exit(1);
  }
  console.log("DATABASE", maskUrl(url));

  const to = new Date();
  const from = subDays(to, 30);

  console.log("\n=== app prisma (PrismaNeon + poolQueryViaFetch, src/lib/prisma.ts) ===");
  await runStep("clinicSettings.findUnique", () =>
    appPrisma.clinicSettings.findUnique({ where: { id: "default" } }),
  );
  await runStep("appointment.groupBy", () =>
    appPrisma.appointment.groupBy({
      by: ["status"],
      _count: true,
      where: { appointmentDate: { gte: from, lte: to } },
    }),
  );
  await runStep("branch.findMany", () =>
    appPrisma.branch.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 5,
    }),
  );

  neonConfig.poolQueryViaFetch = true;
  const neonPrisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  await runSuite("PrismaNeon (poolQueryViaFetch=true)", neonPrisma);
  await neonPrisma.$disconnect();

  neonConfig.poolQueryViaFetch = false;
  const neonWsPrisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  await runSuite("PrismaNeon (poolQueryViaFetch=false)", neonWsPrisma);
  await neonWsPrisma.$disconnect();

  const pool = createPgPool(url);
  const pgPrisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const pgOk = await runSuite("PrismaPg (node pg pool)", pgPrisma);
  await pgPrisma.$disconnect();
  await pool.end();

  if (pgOk) {
    await runStep("buildReportsData (uses app prisma proxy)", () =>
      buildReportsData(
        { preset: "last_3_months", from, to },
        {
          summary: true,
          appointments: true,
          patients: true,
          patientsDetail: false,
          leads: true,
          services: true,
          doctors: true,
          branches: true,
          revenue: true,
          retention: true,
          customReport: true,
          exportCsv: true,
          exportExcel: true,
          exportPdf: true,
        },
      ).then((payload) => ({
        clinicName: payload.clinicName,
        dbUnavailable: payload.dbUnavailable,
        summary: payload.summary,
        branchRowCount: payload.branches.rows.length,
      })),
    );
  } else {
    console.log("\nSKIP buildReportsData — PrismaPg queries failed");
  }

  try {
    await appPrisma.$disconnect();
  } catch {
    /* neon client may never have connected */
  }
}

void main();
