import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        try {
          const { prisma } = await import("@/lib/prisma");
          const admin = await prisma.admin.findUnique({
            where: { loginId: parsed.data.loginId.trim() },
          });
          if (!admin) return null;

          const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
          if (!valid) return null;

          return {
            id: admin.id,
            email: admin.email ?? admin.loginId,
            name: admin.name,
            role: admin.role,
          };
        } catch (error) {
          console.error("Admin login DB error:", error);
          return null;
        }
      },
    }),
  ],
});
