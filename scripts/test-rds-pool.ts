import "dotenv/config";
import { createPgPool } from "../src/lib/pg-pool";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = createPgPool(url);
  try {
    const result = await pool.query("SELECT 1 AS ok");
    console.log("DB_OK", result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      console.error("DB_FAIL", error.message);
      if ("code" in error) console.error("code:", (error as NodeJS.ErrnoException).code);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
