import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { createPgPool } from "../src/lib/pg-pool";

const loginId = process.env.ADMIN_LOGIN_ID ?? "rk331159@gmail.com";
const password = process.env.ADMIN_PASSWORD ?? "Raunak@12583";
const email = process.env.ADMIN_EMAIL?.trim() || loginId;
const name = process.env.ADMIN_NAME ?? "Shiv Dental Admin";

async function main() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    console.error("DATABASE_URL or SUPABASE_DB_PASSWORD is required");
    process.exit(1);
  }

  const pool = createPgPool(connectionString);
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const deleted = await prisma.admin.deleteMany({});
  console.log(`Removed ${deleted.count} existing admin account(s).`);

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({
    data: {
      loginId,
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created admin:", admin.loginId, admin.email ?? "", "(id:", admin.id, ")");
  await prisma.$disconnect();
  await pool.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
