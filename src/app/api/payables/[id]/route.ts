import type { NextRequest } from "next/server";
import { payableUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, financeWriteRoles } from "@/lib/apiRoles";
import { parseDateInput, parseOptionalDate } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { stripUndefined } from "@/lib/stripUndefined";
import { zodErrorResponse } from "@/lib/routeUtils";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr || !Number.isFinite(Number(idStr))) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const row = await prisma.payable.findUnique({ where: { id: Number(idStr) } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(financeWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr || !Number.isFinite(Number(idStr))) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const id = Number(idStr);

  const raw: unknown = await req.json();
  const parsed = payableUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;

  const data = stripUndefined({
    ...(d.documentId !== undefined ? { documentId: d.documentId } : {}),
    ...(d.origin !== undefined ? { origin: d.origin } : {}),
    ...(d.description !== undefined ? { description: d.description ?? "" } : {}),
    ...(d.dueDate !== undefined ? { dueDate: parseDateInput(d.dueDate) } : {}),
    ...(d.amount !== undefined ? { amount: d.amount } : {}),
    ...(d.status !== undefined ? { status: d.status } : {}),
    ...(d.paymentDate !== undefined ? { paymentDate: parseOptionalDate(d.paymentDate ?? undefined) } : {}),
    ...(d.notes !== undefined ? { notes: d.notes } : {}),
    ...(d.vehicleId !== undefined ? { vehicleId: d.vehicleId ?? null } : {}),
    ...(d.supplierId !== undefined ? { supplierId: d.supplierId ?? null } : {}),
  } as Record<string, unknown>);

  try {
    const updated = await prisma.payable.update({ where: { id }, data });
    await prisma.financeNotificationDispatch.updateMany({
      where: {
        eventType: "payable_due",
        eventId: id,
        sentAt: null,
        cancelledAt: null,
      },
      data: { cancelledAt: new Date() },
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(financeWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr || !Number.isFinite(Number(idStr))) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const id = Number(idStr);
  try {
    await prisma.payable.delete({ where: { id } });
    return ok({ id });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

