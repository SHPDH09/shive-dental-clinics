import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD before running supabase:apply-rls");
  process.exit(1);
}

const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "ojfxtzwzpoosmzotzyxm";
const poolerHost =
  process.env.SUPABASE_POOLER_HOST?.trim() || "aws-0-ap-south-1.pooler.supabase.com";
const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${poolerHost}:5432/postgres?sslmode=require&uselibpqcompat=true`;

async function applyFile(client: pg.Client, filename: string) {
  const sql = readFileSync(join(__dirname, "../supabase", filename), "utf8");
  await client.query(sql);
  console.log(`Applied ${filename}`);
}

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await applyFile(client, "rls-authenticated-admin.sql");
  await applyFile(client, "rls-anon-deny-sensitive.sql");
  await client.end();
  console.log("RLS policies applied (authenticated + anon deny on sensitive tables).");
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
