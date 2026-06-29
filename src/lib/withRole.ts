import { auth } from "@/lib/auth";
import { fail } from "@/lib/jsonResponse";
import { isSessionRevoked, isUserActive } from "@/lib/sessionRevocation";
import { logSecurityError } from "@/lib/secureLogger";
import type { Role } from "@prisma/client";
import type { NextRequest } from "next/server";

/** Contexto dos Route Handlers (Next.js 15, `params` assíncrono). */
export type RouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Envolve um Route Handler com verificação de papel (RBAC single-tenant).
 * - 401: sem sessão / sessão revogada
 * - 403: papel não permitido
 */
export function withRole(
  allowed: Role | Role[],
  handler: (req: NextRequest, ctx: RouteContext) => Promise<Response>,
): (req: NextRequest, ctx: { params: Promise<Record<string, string | string[] | undefined>> }) => Promise<Response> {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return async (req, ctx) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return fail("UNAUTHENTICATED", 401);
      }
      if (await isSessionRevoked(session.user.id, session.user.sessionIssuedAt)) {
        return fail("UNAUTHENTICATED", 401);
      }
      const userId = Number(session.user.id);
      if (Number.isInteger(userId) && userId > 0 && !(await isUserActive(userId))) {
        return fail("UNAUTHENTICATED", 401);
      }
      const role = session.user.role;
      if (!roles.includes(role)) {
        return fail("FORBIDDEN", 403);
      }
      return await handler(req, ctx);
    } catch (e) {
      const correlationId = logSecurityError("api.route", e, {
        method: req.method,
        path: req.nextUrl.pathname,
      });
      return fail("INTERNAL_ERROR", 500, { correlationId });
    }
  };
}
