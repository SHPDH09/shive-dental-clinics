import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD ?? "Raunak@12583";
const ref = "ojfxtzwzpoosmzotzyxm";
const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true`;

async function main() {
  const sql = readFileSync(join(__dirname, "../supabase/rls-authenticated-admin.sql"), "utf8");
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("RLS policies applied for authenticated admin users.");
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
