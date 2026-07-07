import type { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/jsonResponse";
import { dispatchMinStockAlerts } from "@/lib/materials/minStockAlert";

export type StockMovementTx = Prisma.TransactionClient;

export function dec(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Média ponderada móvel após entrada. */
export function computeWeightedAvgCost(
  currentStock: number,
  avgCost: number,
  incomingQty: number,
  unitCost: number,
): number {
  const totalQty = currentStock + incomingQty;
  if (totalQty <= 0) return round2(unitCost);
  const totalValue = currentStock * avgCost + incomingQty * unitCost;
  return round2(totalValue / totalQty);
}

export type RecordStockMovementInput = {
  materialId: number;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  productionOrderId?: number;
  notes?: string;
  createdByUserId?: number;
};

export class StockInsufficientError extends Error {
  constructor(
    public readonly materialId: number,
    public readonly available: number,
    public readonly requested: number,
  ) {
    super("Saldo insuficiente para a movimentação.");
    this.name = "StockInsufficientError";
  }
}

export async function recordStockMovement(input: RecordStockMovementInput) {
  const result = await prisma.$transaction(async (tx) => recordStockMovementTx(tx, input));

  await dispatchMinStockAlerts(result.material.id);

  return result;
}

export async function recordStockMovementTx(tx: StockMovementTx, input: RecordStockMovementInput) {
  const qty = round4(input.quantity);
  if (qty <= 0) {
    throw new Error("Quantidade deve ser positiva.");
  }

  const material = await tx.material.findUnique({ where: { id: input.materialId } });
  if (!material) {
    throw new Error("Material não encontrado.");
  }

  const currentStock = dec(material.currentStock);
  const avgCost = dec(material.avgCost);
  let nextStock = currentStock;
  let nextAvgCost = avgCost;

  if (input.type === "entrada") {
    const unitCost = input.unitCost ?? avgCost;
    if (unitCost < 0) throw new Error("Custo unitário inválido.");
    nextStock = round4(currentStock + qty);
    nextAvgCost = computeWeightedAvgCost(currentStock, avgCost, qty, unitCost);
  } else if (input.type === "saida") {
    if (currentStock < qty) {
      throw new StockInsufficientError(input.materialId, currentStock, qty);
    }
    nextStock = round4(currentStock - qty);
  } else if (input.type === "estorno") {
    nextStock = round4(currentStock + qty);
  }

  const movement = await tx.stockMovement.create({
    data: {
      materialId: input.materialId,
      type: input.type,
      quantity: qty,
      unitCost: input.type === "entrada" ? (input.unitCost ?? avgCost) : input.unitCost,
      productionOrderId: input.productionOrderId,
      notes: input.notes,
      createdByUserId: input.createdByUserId,
    },
    include: {
      material: { include: { supplier: { select: { id: true, companyName: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  const updatedMaterial = await tx.material.update({
    where: { id: input.materialId },
    data: {
      currentStock: nextStock,
      avgCost: input.type === "entrada" ? nextAvgCost : avgCost,
    },
    include: { supplier: { select: { id: true, companyName: true } } },
  });

  return { movement, material: updatedMaterial };
}

export function stockErrorToResponse(err: unknown): Response | null {
  if (err instanceof StockInsufficientError) {
    return fail("CONFLICT", 409, {
      message: "Saldo insuficiente para concluir a movimentação.",
      details: {
        materialId: [String(err.materialId)],
        available: [String(err.available)],
        requested: [String(err.requested)],
      },
    });
  }
  if (err instanceof Error && err.message === "Material não encontrado.") {
    return fail("NOT_FOUND", 404);
  }
  if (err instanceof Error && err.message.includes("Quantidade")) {
    return fail("VALIDATION_ERROR", 422, { message: err.message });
  }
  return null;
}

export type MaterialStockSummary = {
  id: number;
  currentStock: number;
  minStock: number;
  belowMinimum: boolean;
};

export function materialBelowMinimum(material: { currentStock: unknown; minStock: unknown }): boolean {
  return dec(material.currentStock) < dec(material.minStock);
}
