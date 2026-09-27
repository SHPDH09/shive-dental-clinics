import "dotenv/config";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectUrl, getSupabaseSecretKey } from "../src/lib/supabase/env";

const loginId = (process.env.ADMIN_EMAIL ?? process.env.ADMIN_LOGIN_ID ?? "").trim();
const email = (process.env.ADMIN_EMAIL ?? loginId).trim();
const password = process.env.ADMIN_PASSWORD?.trim();
const name = process.env.ADMIN_NAME?.trim() || "Shiv Dental Admin";
const purgeOthers = process.env.PURGE_OTHER_ADMINS === "1";

async function main() {
  if (!loginId || !password) {
    console.error("Set ADMIN_EMAIL (or ADMIN_LOGIN_ID) and ADMIN_PASSWORD in the environment.");
    process.exit(1);
  }

  const secret = getSupabaseSecretKey();
  if (!secret) {
    console.error("SUPABASE_SECRET_KEY / SUPABASE_SKEY_B64 is required.");
    process.exit(1);
  }

  const supabase = createClient(getSupabaseProjectUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase
    .from("Admin")
    .select("id")
    .or(`loginId.eq.${loginId},email.eq.${email}`)
    .maybeSingle();

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  if (existing?.id) {
    const { error } = await supabase
      .from("Admin")
      .update({
        loginId: email,
        email,
        name,
        passwordHash,
        role: "SUPER_ADMIN",
        active: true,
        updatedAt: now,
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Update failed:", error.message);
      process.exit(1);
    }
    console.log("Admin updated:", email);
  } else {
    const id = `adm_${Date.now().toString(36)}`;
    const { error } = await supabase.from("Admin").insert({
      id,
      loginId: email,
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      console.error("Insert failed:", error.message);
      process.exit(1);
    }
    console.log("Admin created:", email);
  }

  if (purgeOthers) {
    const { error } = await supabase
      .from("Admin")
      .delete()
      .neq("email", email)
      .neq("loginId", email);
    if (error) console.warn("Purge warning:", error.message);
    else console.log("Removed other admin rows (PURGE_OTHER_ADMINS=1).");
  }
}

void main();
