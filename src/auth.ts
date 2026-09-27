import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { resolveAuthSecret } from "@/lib/auth-env";
import { authenticateAdmin } from "@/lib/supabase/admin-login";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: resolveAuthSecret() || undefined,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        loginId: { label: "Admin ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await authenticateAdmin(parsed.data.loginId.trim(), parsed.data.password);
        return user;
      },
    }),
  ],
});
