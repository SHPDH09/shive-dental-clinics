import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { resolveAuthSecret } from "@/lib/auth-env";
import { verifyEnvAdmin } from "@/lib/env-admin";
import { verifyAdminViaSupabase } from "@/lib/supabase/admin-auth";

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

        const loginId = parsed.data.loginId.trim();
        const password = parsed.data.password;

        try {
          const { prisma } = await import("@/lib/prisma");
          const admin = await prisma.admin.findFirst({
            where: {
              OR: [{ loginId }, { email: loginId }],
            },
          });
          if (admin) {
            const valid = await bcrypt.compare(password, admin.passwordHash);
            if (valid) {
              return {
                id: admin.id,
                email: admin.email ?? admin.loginId,
                name: admin.name,
                role: admin.role,
              };
            }
          }
        } catch (error) {
          console.error("Admin login DB error:", error);
        }

        const supabaseUser = await verifyAdminViaSupabase(loginId, password);
        if (supabaseUser) return supabaseUser;

        const envUser = verifyEnvAdmin(loginId, password);
        if (envUser) return envUser;

        return null;
      },
    }),
  ],
});
