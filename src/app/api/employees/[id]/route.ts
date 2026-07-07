import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { employeeUpdateSchema } from "@/lib/zodSchemas";
import { adminOnlyRoles, allStaffReadRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { countEmployeeProductionLinks } from "@/lib/employees/productivity";
import { resolveEmployeeInternalId } from "@/lib/employeeResolve";
import { zodErrorResponse } from "@/lib/routeUtils";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const employeeInclude = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveEmployeeInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const row = await prisma.employee.findUnique({
    where: { id: internalId },
    include: employeeInclude,
  });
  if (!row) return fail("NOT_FOUND", 404);

  const counts = await countEmployeeProductionLinks([internalId]);
  const c = counts.get(internalId);
  return ok({
    ...row,
    assignedOrdersCount: c?.total ?? 0,
    completedOrdersCount: c?.completed ?? 0,
  });
});

export const PUT = withRole(adminOnlyRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveEmployeeInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const raw: unknown = await req.json();
  const parsed = employeeUpdateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const d = parsed.data;
  const updateData: Prisma.EmployeeUpdateInput = {};
  if (d.name !== undefined) updateData.name = d.name;
  if (d.roleTitle !== undefined) updateData.roleTitle = d.roleTitle;
  if (d.commissionPct !== undefined) updateData.commissionPct = d.commissionPct;
  if (d.isActive !== undefined) updateData.isActive = d.isActive;
  if (d.userId !== undefined) {
    updateData.user = d.userId ? { connect: { id: d.userId } } : { disconnect: true };
  }

  try {
    const updated = await prisma.employee.update({
      where: { id: internalId },
      data: updateData,
      include: employeeInclude,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(adminOnlyRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveEmployeeInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const linked = await prisma.productionOrderEmployee.count({ where: { employeeId: internalId } });
  if (linked > 0) {
    const updated = await prisma.employee.update({
      where: { id: internalId },
      data: { isActive: false },
      include: employeeInclude,
    });
    return ok(updated);
  }

  try {
    await prisma.employee.delete({ where: { id: internalId } });
    return ok({ id: internalId });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
