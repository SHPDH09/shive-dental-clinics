import { Pool } from "pg";

export function createPgPool(connectionString: string) {
  const isRds = connectionString.includes("rds.amazonaws.com");
  return new Pool({
    connectionString,
    ssl: isRds ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
}
