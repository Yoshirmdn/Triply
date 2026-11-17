import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (token.role === "SUPER_ADMIN" || token.role === "USER")
        session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
