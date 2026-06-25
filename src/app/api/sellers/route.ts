import { hash } from "bcryptjs";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { staffRoles } from "@/lib/apiRoles";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import { POLICY_PRIVACY_VERSION } from "@/lib/lgpdPolicyMeta";
import { zodErrorResponse } from "@/lib/routeUtils";
import { sellerCreateSchema } from "@/lib/zodSchemas";
import { withRole } from "@/lib/withRole";

const sellerRoles = [Role.admin, Role.authenticated, Role.sales];

/** Vendedores/usuários da loja — escopado ao tenant da sessão (cycle 0614 Stage 4). */
export const GET = withRole(staffRoles, async (_req: NextRequest) => {
  const data = await prisma.user.findMany({
    where: { role: { in: sellerRoles } },
    orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, role: true },
  });
  return ok(data);
});

export const POST = withRole(["admin"], async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", 400, { message: "JSON invalido." });
  }

  const parsed = sellerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail("CONFLICT", 409, { message: "Este e-mail ja esta registrado." });
  }

  const now = new Date();
  const created = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name.trim(),
      passwordHash: await hash(parsed.data.password, 12),
      role: Role.sales,
      lgpdConsentVersion: POLICY_PRIVACY_VERSION,
      lgpdConsentAt: now,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return ok(created, { status: 201 });
});
