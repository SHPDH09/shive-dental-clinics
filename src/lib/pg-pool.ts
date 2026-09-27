import { Signer } from "@aws-sdk/rds-signer";
import { Pool, type PoolConfig } from "pg";

function parseDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
  const databasePath = url.pathname.replace(/^\//, "").split("/")[0];
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    database: databasePath ? decodeURIComponent(databasePath) : undefined,
  };
}

function iamAuthEnabled(): boolean {
  return process.env.DATABASE_IAM_AUTH === "true";
}

export function createPgPool(connectionString: string) {
  const isRds = connectionString.includes("rds.amazonaws.com");
  const ssl = isRds ? { rejectUnauthorized: false as const } : undefined;
  const serverless = { max: 1, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 15_000 };

  if (iamAuthEnabled()) {
    const { host, port, user, database } = parseDatabaseUrl(connectionString);
    const region = process.env.AWS_REGION ?? "ap-south-1";
    const signer = new Signer({
      region,
      hostname: host,
      port,
      username: user,
    });

    const config: PoolConfig = {
      host,
      port,
      user,
      database,
      password: () => signer.getAuthToken(),
      ssl,
      ...serverless,
    };
    return new Pool(config);
  }

  return new Pool({
    connectionString,
    ssl,
    ...serverless,
  });
}
