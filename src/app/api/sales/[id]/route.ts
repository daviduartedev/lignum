import type { NextRequest } from "next/server";
import { saleUpdateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const row = await prisma.sale.findUnique({ where: { id: num } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(staffRoles, async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const raw: unknown = await req.json();
  const parsed = saleUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const { saleDate, ...rest } = d;
  const data = stripUndefined({
    ...rest,
    ...(saleDate ? { saleDate: parseDateInput(saleDate) } : {}),
  } as Record<string, unknown>);
  try {
    const updated = await prisma.sale.update({
      where: { id: num },
      data,
    });
    return ok(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return fail("CONFLICT", 409, { message: "Já existe uma venda registrada para este veículo." });
    }
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(staffRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  try {
    await prisma.sale.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
