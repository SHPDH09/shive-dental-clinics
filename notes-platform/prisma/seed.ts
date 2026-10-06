import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      name: "Platform Admin",
      email: email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      adminProfile: { create: {} },
    },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id },
    update: {},
  });

  console.log(`Admin ready: ${admin.email}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
