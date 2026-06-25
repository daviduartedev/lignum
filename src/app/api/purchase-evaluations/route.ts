import type { Prisma } from "@prisma/client";
import { PurchaseEvaluationOutcome } from "@prisma/client";
import type { NextRequest } from "next/server";
import { purchaseEvaluationCreateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const vehicleId = searchParams.get("vehicleId");
  const outcome = searchParams.get("outcome");

  const where: Prisma.PurchaseEvaluationWhereInput = {};
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    where.vehicleId = Number(vehicleId);
  }
  if (outcome && ["pendente", "nao_comprado", "comprado"].includes(outcome)) {
    where.outcome = outcome as Prisma.EnumPurchaseEvaluationOutcomeFilter["equals"];
  }

  const [total, data] = await prisma.$transaction([
    prisma.purchaseEvaluation.count({ where }),
    prisma.purchaseEvaluation.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
      include: { vehicle: true, client: true },
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(staffRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = purchaseEvaluationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.purchaseEvaluation.create({
      data: {
        documentId: d.documentId,
        vehicleId: d.vehicleId,
        clientId: d.clientId ?? undefined,
        outcome: d.outcome,
        reasonCode: d.reasonCode ?? undefined,
        reasonDetail: d.reasonDetail?.trim() || undefined,
      },
    });

    if (d.outcome === PurchaseEvaluationOutcome.nao_comprado) {
      await tx.vehicle.update({
        where: { id: d.vehicleId },
        data: { status: "standby_nao_compra" },
      });
    }

    if (d.outcome === PurchaseEvaluationOutcome.comprado) {
      const v = await tx.vehicle.findUnique({ where: { id: d.vehicleId } });
      if (v && !["disponivel", "reservado", "repasse", "vendido"].includes(v.status)) {
        await tx.vehicle.update({
          where: { id: d.vehicleId },
          data: { status: "disponivel" },
        });
      }
    }

    return row;
  });

  const full = await prisma.purchaseEvaluation.findUnique({
    where: { id: created.id },
    include: { vehicle: true, client: true },
  });

  return ok(full ?? created, { status: 201 });
});
