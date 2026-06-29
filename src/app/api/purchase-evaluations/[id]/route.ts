import { PurchaseEvaluationOutcome } from "@prisma/client";
import type { NextRequest } from "next/server";
import { purchaseEvaluationUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
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
  const row = await prisma.purchaseEvaluation.findUnique({
    where: { id: num },
    include: { vehicle: true, client: true },
  });
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
  const parsed = purchaseEvaluationUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const data = stripUndefined({
    ...d,
    clientId: d.clientId === null ? null : d.clientId,
  } as Record<string, unknown>);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.purchaseEvaluation.update({
      where: { id: num },
      data: data as Parameters<typeof tx.purchaseEvaluation.update>[0]["data"],
    });

    if (d.outcome === PurchaseEvaluationOutcome.nao_comprado) {
      await tx.vehicle.update({
        where: { id: row.vehicleId },
        data: { status: "standby_nao_compra" },
      });
    }
    if (d.outcome === PurchaseEvaluationOutcome.comprado) {
      const v = await tx.vehicle.findUnique({ where: { id: row.vehicleId } });
      if (v && !["disponivel", "reservado", "repasse", "vendido"].includes(v.status)) {
        await tx.vehicle.update({
          where: { id: row.vehicleId },
          data: { status: "disponivel" },
        });
      }
    }

    return row;
  });

  const full = await prisma.purchaseEvaluation.findUnique({
    where: { id: updated.id },
    include: { vehicle: true, client: true },
  });

  return ok(full ?? updated);
});
