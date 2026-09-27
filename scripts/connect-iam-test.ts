import "dotenv/config";
import { createPgPool } from "../src/lib/pg-pool";

function awsCredentialsLikelyAvailable(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_PROFILE ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
      process.env.AWS_ROLE_ARN,
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  if (!awsCredentialsLikelyAvailable()) {
    console.log("SKIP: No AWS credentials detected; IAM DB auth test not run.");
    console.log("Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY, AWS_PROFILE, or an instance/task role.");
    return;
  }

  process.env.DATABASE_IAM_AUTH = "true";
  console.log("Trying IAM database authentication (DATABASE_IAM_AUTH=true)...");

  const pool = createPgPool(url);
  try {
    const result = await pool.query("SELECT 1 AS ok");
    console.log("IAM_DB_OK", result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      console.error("IAM_DB_FAIL", error.message);
      if ("code" in error) console.error("code:", (error as NodeJS.ErrnoException).code);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
