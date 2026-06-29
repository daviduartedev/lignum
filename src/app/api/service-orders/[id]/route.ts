import type { NextRequest } from "next/server";
import { serviceOrderUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { parseDateInput, parseOptionalDate } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { resolveServiceOrderInternalId } from "@/lib/serviceOrderResolve";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveServiceOrderInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }
  const row = await prisma.serviceOrder.findUnique({ where: { id: internalId } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(productionWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveServiceOrderInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  const raw: unknown = await req.json();
  const parsed = serviceOrderUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const { entryDate, dueDate, serviceType, serviceTypeOtherText, ...rest } = d;
  const data = stripUndefined({
    ...rest,
    ...(serviceType !== undefined ? { serviceType } : {}),
    ...(serviceTypeOtherText !== undefined
      ? {
          serviceTypeOtherText:
            serviceType === "outros" || serviceType === undefined
              ? String(serviceTypeOtherText ?? "").trim() || null
              : null,
        }
      : {}),
    ...(entryDate ? { entryDate: parseDateInput(entryDate) } : {}),
    ...(dueDate !== undefined ? { dueDate: parseOptionalDate(dueDate) } : {}),
  } as Record<string, unknown>);
  try {
    const updated = await prisma.serviceOrder.update({
      where: { id: num },
      data,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(productionWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveServiceOrderInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  try {
    await prisma.serviceOrder.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
