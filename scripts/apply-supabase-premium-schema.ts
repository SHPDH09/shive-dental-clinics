import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const ref = "ojfxtzwzpoosmzotzyxm";

function wranglerVar(name: string): string | undefined {
  const raw = readFileSync(join(__dirname, "../wrangler.jsonc"), "utf8").replace(/\/\/.*$/gm, "");
  const m = raw.match(new RegExp(`"${name}"\\s*:\\s*"([^"]+)"`));
  return m?.[1];
}

function dbPassword(): string {
  const fromEnv = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  const b64 = wranglerVar("SUPABASE_DB_PW_B64");
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  throw new Error("Set SUPABASE_DB_PASSWORD or SUPABASE_DB_PW_B64 in wrangler.jsonc");
}

function poolerUrl(password: string, port: 5432 | 6543) {
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:${port}/postgres?sslmode=require&uselibpqcompat=true`;
}

async function runFile(client: pg.Client, relativePath: string) {
  const sql = readFileSync(join(__dirname, "..", relativePath), "utf8");
  console.log(`Applying ${relativePath}…`);
  await client.query(sql);
  console.log(`OK ${relativePath}`);
}

async function main() {
  const password = dbPassword();

  const client = new pg.Client({
    connectionString: poolerUrl(password, 6543),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await runFile(client, "supabase/migration-admins-premium.sql");
  await runFile(client, "supabase/migration-doctors-premium.sql");
  await runFile(client, "supabase/migration-branches-premium.sql");
  await runFile(client, "supabase/migration-services-premium.sql");
  await runFile(client, "supabase/migration-settings-premium.sql");
  await runFile(client, "supabase/migration-messages-premium.sql");
  await runFile(client, "supabase/migration-hero-slides.sql");
  await runFile(client, "supabase/rls-authenticated-admin.sql");
  await client.query(`NOTIFY pgrst, 'reload schema';`);

  const check = await client.query<{ reg: string | null }>(
    `SELECT to_regclass('public."ServiceCategory"') AS reg`,
  );
  console.log("ServiceCategory:", check.rows[0]?.reg ?? "MISSING");

  await client.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
