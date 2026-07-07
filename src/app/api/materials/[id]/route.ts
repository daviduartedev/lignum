import type { NextRequest } from "next/server";
import { materialUpdateSchema } from "@/lib/zodSchemas";
import { adminOnlyRoles, allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { dispatchMinStockAlerts } from "@/lib/materials/minStockAlert";
import { zodErrorResponse } from "@/lib/routeUtils";
import { resolveMaterialInternalId } from "@/lib/materialResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const materialInclude = { supplier: { select: { id: true, companyName: true } } } as const;

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveMaterialInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const row = await prisma.material.findUnique({
    where: { id: internalId },
    include: {
      ...materialInclude,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!row) return fail("NOT_FOUND", 404);
  return ok(row);
});

export const PUT = withRole(productionWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveMaterialInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const raw: unknown = await req.json();
  const parsed = materialUpdateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.name !== undefined) updateData.name = d.name;
  if (d.category !== undefined) updateData.category = d.category;
  if (d.unit !== undefined) updateData.unit = d.unit;
  if (d.minStock !== undefined) updateData.minStock = d.minStock;
  if (d.avgCost !== undefined) updateData.avgCost = d.avgCost;
  if (d.supplierId !== undefined) {
    updateData.supplier = d.supplierId ? { connect: { id: d.supplierId } } : { disconnect: true };
  }

  try {
    const updated = await prisma.material.update({
      where: { id: internalId },
      data: updateData,
      include: materialInclude,
    });
    await dispatchMinStockAlerts(updated.id);
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(adminOnlyRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveMaterialInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);
  try {
    await prisma.material.delete({ where: { id: internalId } });
    return ok({ id: internalId });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
