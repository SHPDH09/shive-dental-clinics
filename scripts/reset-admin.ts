import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPgPool } from "../src/lib/pg-pool";

const loginId = process.env.ADMIN_LOGIN_ID ?? "1A74N3077";
const password = process.env.ADMIN_PASSWORD ?? "Rishikesh@2028";
const name = process.env.ADMIN_NAME ?? "Shiv Dental Admin";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = createPgPool(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const deleted = await prisma.admin.deleteMany({});
  console.log(`Removed ${deleted.count} existing admin account(s).`);

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({
    data: {
      loginId,
      name,
      email: null,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Created admin:", admin.loginId, "(id:", admin.id, ")");
  await prisma.$disconnect();
  await pool.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
