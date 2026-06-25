import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Config partilhada e compatível com Edge (middleware).
 * Credenciais e Prisma ficam apenas em `auth.ts`.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role: Role }).role;
        token.email = user.email;
        token.sessionIssuedAt = Date.now();
      }
      if (!token.sessionIssuedAt && typeof token.iat === "number") {
        token.sessionIssuedAt = token.iat * 1000;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as Record<string, unknown>;
        if (typeof s.name === "string") {
          token.name = s.name;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role) ?? "read_only";
        session.user.sessionIssuedAt =
          typeof token.sessionIssuedAt === "number" ? token.sessionIssuedAt : undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
