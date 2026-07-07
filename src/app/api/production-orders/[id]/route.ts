import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { productionOrderUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { productionOrderInclude } from "@/lib/production/orderTransitions";
import { validateActiveEmployeeIds } from "@/lib/employeeResolve";
import { resolveProductionOrderInternalId } from "@/lib/productionOrderResolve";
import { zodErrorResponse } from "@/lib/routeUtils";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveProductionOrderInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const row = await prisma.productionOrder.findUnique({
    where: { id: internalId },
    include: productionOrderInclude,
  });
  if (!row) return fail("NOT_FOUND", 404);
  return ok(row);
});

export const PUT = withRole(productionWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveProductionOrderInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const existing = await prisma.productionOrder.findUnique({
    where: { id: internalId },
    select: { status: true },
  });
  if (!existing) return fail("NOT_FOUND", 404);
  if (existing.status === "concluida") {
    return fail("CONFLICT", 409, { message: "Ordem concluída não pode ser editada." });
  }

  const raw: unknown = await req.json();
  const parsed = productionOrderUpdateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const d = parsed.data;
  const updateData: Prisma.ProductionOrderUpdateInput = {};
  if (d.notes !== undefined) updateData.notes = d.notes;
  if (d.photoUrls !== undefined) updateData.photoUrls = d.photoUrls;

  try {
    if (d.employeeIds !== undefined) {
      const valid = await validateActiveEmployeeIds(d.employeeIds);
      if (!valid) {
        return fail("BAD_REQUEST", 400, { message: "Funcionário inválido ou inativo." });
      }
      await prisma.productionOrderEmployee.deleteMany({ where: { productionOrderId: internalId } });
      if (d.employeeIds.length > 0) {
        await prisma.productionOrderEmployee.createMany({
          data: d.employeeIds.map((employeeId) => ({
            productionOrderId: internalId,
            employeeId,
          })),
        });
      }
    }

    const updated = await prisma.productionOrder.update({
      where: { id: internalId },
      data: updateData,
      include: productionOrderInclude,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
