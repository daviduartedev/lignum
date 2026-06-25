import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { RateLimitedSignin } from "@/lib/authSigninErrors";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { checkLoginFailuresAllowed, clearLoginFailuresRemote, recordLoginFailureRemote } from "@/lib/loginFailureRateLimit";

/**
 * NextAuth v5, substitui o plugin users-permissions do Strapi.
 * Sessão em JWT; o campo `role` replica o modelo de autorização do ERP.
 * Defina `AUTH_SECRET` (e em produção `AUTH_URL` / `NEXTAUTH_URL` conforme docs).
 *
 * O middleware importa apenas `auth.config.ts` + `next-auth` para não embutir Prisma/bcrypt no Edge.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const emailNorm = email.toLowerCase().trim();
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "local";
        const rateKey = `login:${ip}:${emailNorm}`;
        if (!(await checkLoginFailuresAllowed(rateKey)).allowed) {
          throw new RateLimitedSignin();
        }

        const user = await prisma.user.findUnique({ where: { email: emailNorm } });
        if (!user) {
          await recordLoginFailureRemote(rateKey);
          return null;
        }
        const passwordOk = await compare(password, user.passwordHash);
        if (!passwordOk) {
          await recordLoginFailureRemote(rateKey);
          return null;
        }
        await clearLoginFailuresRemote(rateKey);
        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
});

/**
 * Equivalente tipado ao antigo `getServerSession()` do NextAuth v4.
 * Em rotas do App Router, prefira `auth()` diretamente.
 */
export async function getServerSession() {
  return auth();
}
