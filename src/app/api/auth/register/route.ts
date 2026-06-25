import { hash } from "bcryptjs";
import type { NextRequest } from "next/server";
import { adminUserCreateSchema } from "@/lib/zodSchemas";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";

/**
 * Criação de usuários, apenas administradores (substitui cadastro público Strapi).
 * Multitenant (cycle 0614 Stage 4): o novo usuário herda o tenant do admin que o cria.
 */
export const POST = withRole(["admin"], async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", 400, { message: "JSON inválido." });
  }

  const parsed = adminUserCreateSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { email, password, name, role, lgpdConsentVersion } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return fail("CONFLICT", 409, { message: "Este e-mail já está registrado." });
  }

  const passwordHash = await hash(password, 12);
  const now = new Date();
  const created = await prisma.user.create({
    data: {
      email: emailNorm,
      name: name ?? null,
      passwordHash,
      role,
      lgpdConsentVersion,
      lgpdConsentAt: now,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return ok(created, { status: 201 });
});
