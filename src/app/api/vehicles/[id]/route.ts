import type { NextRequest } from "next/server";
import { vehicleUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles, adminOnlyRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const row = await prisma.vehicle.findUnique({ where: { id: num } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(commercialWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const raw: unknown = await req.json();
  const parsed = vehicleUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const data = stripUndefined({
    ...d,
    mainPhotoUrl: d.mainPhotoUrl === "" ? null : d.mainPhotoUrl,
    buyerId: d.buyerId === null ? null : d.buyerId,
    doorsCount: d.doorsCount === null ? null : d.doorsCount,
    lastLicensingDate: d.lastLicensingDate === null ? null : d.lastLicensingDate ? new Date(d.lastLicensingDate) : undefined,
    purchaseEntryAt: d.purchaseEntryAt === null ? null : d.purchaseEntryAt ? new Date(d.purchaseEntryAt) : undefined,
    purchaseEntryMileage: d.purchaseEntryMileage === null ? null : d.purchaseEntryMileage,
    purchaseSupplierId: d.purchaseSupplierId === null ? null : d.purchaseSupplierId,
    purchasePaymentJson: d.purchasePaymentJson === null ? null : d.purchasePaymentJson,
  } as Record<string, unknown>);
  try {
    const updated = await prisma.vehicle.update({
      where: { id: num },
      data,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

/** Apenas administrador, eliminação física (raro). O fluxo normal usa PUT com status `removido`. */
export const DELETE = withRole(adminOnlyRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  try {
    await prisma.vehicle.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
