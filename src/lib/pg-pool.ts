import { Pool, type PoolConfig } from "pg";

function sslFromConnectionString(connectionString: string): PoolConfig["ssl"] | undefined {
  try {
    const url = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require") return { rejectUnauthorized: false };
    if (sslmode === "verify-full" || sslmode === "verify-ca") return true;
    return undefined;
  } catch {
    return undefined;
  }
}

export function createPgPool(connectionString: string) {
  const serverless = { max: 1, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 15_000 };

  return new Pool({
    connectionString,
    ssl: sslFromConnectionString(connectionString),
    ...serverless,
  });
}
