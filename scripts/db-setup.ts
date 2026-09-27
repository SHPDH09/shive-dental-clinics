import "dotenv/config";
import { execSync } from "child_process";
import { createPgPool } from "../src/lib/pg-pool";

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Missing DATABASE_URL in .env");
    process.exit(1);
  }

  const pool = createPgPool(url);
  try {
    const r = await pool.query("SELECT current_database() AS db, current_user AS usr");
    console.log("DB_OK", r.rows[0]);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("DB_FAIL", msg);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("Testing PostgreSQL (password auth)...");
  const ok = await testConnection();
  if (!ok) {
    console.error(`
Could not connect. Check DATABASE_URL (host, port, user, password, database name).
For hosted Postgres with SSL, add ?sslmode=require to the URL.
`);
    process.exit(1);
  }

  console.log("Running prisma db push...");
  execSync("npx prisma db push", { stdio: "inherit" });
  console.log("Running seed...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  console.log("Setup complete.");
}

void main();
