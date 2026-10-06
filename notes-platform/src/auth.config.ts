import type { NextAuthConfig } from "next-auth";
import { resolveAuthSecret } from "@/lib/auth-env";

export const authConfig = {
  trustHost: true,
  secret: resolveAuthSecret() || undefined,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isAdminRoute = path.startsWith("/admin") && !path.startsWith("/admin/login");
      const isStudentRoute =
        path.startsWith("/dashboard") ||
        path.startsWith("/cart") ||
        path.startsWith("/purchases") ||
        path.startsWith("/transactions") ||
        path.startsWith("/profile") ||
        path.startsWith("/checkout");

      if (!isAdminRoute && !isStudentRoute) return true;
      if (!auth?.user) return false;

      const role = (auth.user as { role?: string }).role;
      if (isAdminRoute) return role === "ADMIN";
      if (isStudentRoute) return role === "STUDENT";
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? token.sub ?? "";
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
