import type { NextRequest } from "next/server";
import { supplierUpdateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import { resolveSupplierInternalId } from "@/lib/supplierResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveSupplierInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }
  const row = await prisma.supplier.findUnique({ where: { id: internalId } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(staffRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveSupplierInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  const raw: unknown = await req.json();
  const parsed = supplierUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const data = stripUndefined({
    ...d,
    email: d.email === "" ? null : d.email,
  } as Record<string, unknown>);
  try {
    const updated = await prisma.supplier.update({
      where: { id: num },
      data,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(staffRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveSupplierInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  try {
    await prisma.supplier.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
