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

function withLibpqSslCompat(connectionString: string): string {
  try {
    const url = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
    if (url.searchParams.get("sslmode") === "require" && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
      return url.toString().replace(/^postgres:/, "postgresql:");
    }
  } catch {
    /* keep original */
  }
  return connectionString;
}

export function createPgPool(connectionString: string) {
  const serverless = { max: 1, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 15_000 };
  const normalized = withLibpqSslCompat(connectionString);

  return new Pool({
    connectionString: normalized,
    ssl: sslFromConnectionString(normalized),
    ...serverless,
  });
}
