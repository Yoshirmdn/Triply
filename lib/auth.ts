import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

type AdapterClient = Parameters<typeof PrismaAdapter>[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as unknown as AdapterClient),
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { isActive: true },
      });
      if (existing && !existing.isActive) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (token.role === "SUPER_ADMIN" || token.role === "USER") session.user.role = token.role;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          description: `Akun baru terdaftar: ${user.email ?? "-"}`,
        },
      });
    },
    async signIn({ user }) {
      if (!user.id) return;
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_SIGNED_IN",
          description: `Login: ${user.email ?? "-"}`,
        },
      });
    },
  },
});