import type { NextAuthConfig } from "next-auth";
import { getAuthUrl, resolveAuthSecret } from "@/lib/auth-env";

export const authConfig = {
  trustHost: true,
  secret: resolveAuthSecret() || undefined,
  ...(getAuthUrl() ? { url: getAuthUrl() } : {}),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith("/admin");
      const isLogin = pathname === "/admin/login";
      const isLoggedIn = !!auth?.user;

      if (isAdminRoute && !isLogin && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
