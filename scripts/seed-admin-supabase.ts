import "dotenv/config";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl, getSupabaseSecretKey } from "../src/lib/supabase/env";

const loginId = process.env.ADMIN_LOGIN_ID ?? "rk331159@gmail.com";
const email = process.env.ADMIN_EMAIL?.trim() || loginId;
const password = process.env.ADMIN_PASSWORD ?? "Raunak@12583";
const name = process.env.ADMIN_NAME ?? "Shiv Dental Admin";

async function main() {
  const secret = getSupabaseSecretKey();
  if (!secret) {
    console.error("SUPABASE_SECRET_KEY is required for REST seed (or run supabase/seed-admin.sql in SQL Editor).");
    process.exit(1);
  }

  const supabase = createClient(getSupabaseProjectUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await supabase.from("Admin").delete().or(`loginId.eq.${loginId},email.eq.${email}`);

  const passwordHash = await bcrypt.hash(password, 12);
  const id = `cl${Date.now().toString(36)}admin`;

  const { data, error } = await supabase
    .from("Admin")
    .insert({
      id,
      loginId,
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    })
    .select("id, loginId, email, role")
    .single();

  if (error) {
    console.error("Insert failed:", error.message);
    if (error.code === "PGRST205") {
      console.error("Run supabase/seed-admin.sql in Supabase SQL Editor, or npm run db:push with SUPABASE_DB_PASSWORD.");
    }
    process.exit(1);
  }

  console.log("Admin created via Supabase:", data);
}

void main();
