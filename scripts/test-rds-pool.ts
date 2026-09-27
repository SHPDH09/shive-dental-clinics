import { Pool } from "pg";

const host = "database-1.cluster-c5mm0sc887f3.ap-south-1.rds.amazonaws.com";
const port = 5432;

const pool = new Pool({
  host,
  port,
  user: "test",
  password: "test",
  database: "postgres",
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("SUCCESS: connected");
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      if ("code" in error) {
        console.error("code:", (error as NodeJS.ErrnoException).code);
      }
    } else {
      console.error(String(error));
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
