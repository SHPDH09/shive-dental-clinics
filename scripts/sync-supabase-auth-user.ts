import "dotenv/config";
import { createSupabaseServiceClient } from "../src/lib/supabase/service";

const email = process.env.ADMIN_EMAIL ?? "rk331159@gmail.com";
const password = process.env.ADMIN_PASSWORD ?? "Raunak@12583";

async function main() {
  const supabase = createSupabaseServiceClient();
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("Updated Supabase Auth user:", email);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log("Created Supabase Auth user:", data.user?.email);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
