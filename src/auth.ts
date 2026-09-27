import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";
import { resolveAuthSecret } from "@/lib/auth-env";
import { verifyEnvAdmin } from "@/lib/env-admin";

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
          const admin = await prisma.admin.findUnique({
            where: { loginId },
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
          console.error("Admin login DB error (will try env admin if configured):", error);
        }

        return verifyEnvAdmin(loginId, password);
      },
    }),
  ],
});
