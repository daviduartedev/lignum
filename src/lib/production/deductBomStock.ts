import { prisma } from "@/lib/db";
import { fail } from "@/lib/jsonResponse";
import {
  dec,
  recordStockMovementTx,
  round4,
  type StockMovementTx,
} from "@/lib/materials/stockMovement";
import type { BomLine } from "@/lib/quotes/bomBuilder";
import { productionOrderInclude } from "@/lib/production/orderTransitions";
import { dispatchMinStockAlerts } from "@/lib/materials/minStockAlert";

export class BomSkuMissingError extends Error {
  constructor(public readonly skus: string[]) {
    super("SKU ausente no catálogo de materiais.");
    this.name = "BomSkuMissingError";
  }
}

export type BomStockIssue = {
  sku: string;
  materialId: number;
  available: number;
  requested: number;
};

export class BomStockInsufficientError extends Error {
  constructor(public readonly items: BomStockIssue[]) {
    super("Saldo insuficiente para BOM.");
    this.name = "BomStockInsufficientError";
  }
}

export function parseBomJson(bomJson: unknown): BomLine[] {
  if (!Array.isArray(bomJson)) return [];
  const lines: BomLine[] = [];
  for (const raw of bomJson) {
    if (raw == null || typeof raw !== "object") continue;
    const line = raw as Record<string, unknown>;
    const sku = String(line.sku ?? "").trim();
    const quantity = dec(line.quantity);
    if (!sku || quantity <= 0) continue;
    lines.push({
      sku,
      description: String(line.description ?? sku),
      quantity,
      unit: String(line.unit ?? "un"),
      category: (line.category as BomLine["category"]) ?? "consumivel",
    });
  }
  return lines;
}

export function aggregateBomQuantitiesBySku(bomLines: BomLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of bomLines) {
    const sku = line.sku.trim();
    if (!sku) continue;
    map.set(sku, round4((map.get(sku) ?? 0) + line.quantity));
  }
  return map;
}

export function validateBomAgainstMaterials(
  qtyBySku: Map<string, number>,
  materialsBySku: Map<string, { id: number; sku: string; currentStock: unknown }>,
): { missingSkus: string[]; insufficient: BomStockIssue[] } {
  const missingSkus: string[] = [];
  const insufficient: BomStockIssue[] = [];

  for (const [sku, requested] of qtyBySku) {
    const material = materialsBySku.get(sku);
    if (!material) {
      missingSkus.push(sku);
      continue;
    }
    const available = dec(material.currentStock);
    if (available < requested) {
      insufficient.push({
        sku,
        materialId: material.id,
        available,
        requested,
      });
    }
  }

  return { missingSkus, insufficient };
}

async function loadMaterialsForBom(tx: StockMovementTx, skus: string[]) {
  const materials = await tx.material.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true, currentStock: true },
  });
  return new Map(materials.map((m) => [m.sku, m]));
}

function assertBomResolvable(
  qtyBySku: Map<string, number>,
  materialsBySku: Map<string, { id: number; sku: string; currentStock: unknown }>,
) {
  const { missingSkus, insufficient } = validateBomAgainstMaterials(qtyBySku, materialsBySku);
  if (missingSkus.length > 0) throw new BomSkuMissingError(missingSkus);
  if (insufficient.length > 0) throw new BomStockInsufficientError(insufficient);
}

/** Baixa estoque conforme BOM e inicia a OP (transação atómica). */
export async function deductBomStockForProductionOrder(
  orderId: number,
  opts?: { createdByUserId?: number },
) {
  const affectedMaterialIds: number[] = [];

  const updated = await prisma.$transaction(
    async (tx) => {
      const order = await tx.productionOrder.findUnique({
        where: { id: orderId },
        include: { technicalSheet: true },
      });
      if (!order) throw new Error("NOT_FOUND");

      const bomLines = parseBomJson(order.technicalSheet?.bomJson);
      if (bomLines.length === 0) throw new Error("EMPTY_BOM");

      const qtyBySku = aggregateBomQuantitiesBySku(bomLines);
      const skus = [...qtyBySku.keys()];
      const materialsBySku = await loadMaterialsForBom(tx, skus);
      assertBomResolvable(qtyBySku, materialsBySku);

      for (const [sku, qty] of qtyBySku) {
        const material = materialsBySku.get(sku)!;
        await recordStockMovementTx(tx, {
          materialId: material.id,
          type: "saida",
          quantity: qty,
          productionOrderId: orderId,
          notes: `Baixa BOM ${order.orderNumber ?? `OP-${orderId}`}`,
          createdByUserId: opts?.createdByUserId,
        });
        affectedMaterialIds.push(material.id);
      }

      return tx.productionOrder.update({
        where: { id: orderId },
        data: { status: "andamento", startedAt: new Date() },
        include: productionOrderInclude,
      });
    },
    { timeout: 30_000 },
  );

  for (const materialId of [...new Set(affectedMaterialIds)]) {
    await dispatchMinStockAlerts(materialId);
  }

  return updated;
}

/** Estorna saídas da OP e cancela (quando estava em andamento). */
export async function reverseBomStockForProductionOrder(
  orderId: number,
  opts?: { createdByUserId?: number },
) {
  const affectedMaterialIds: number[] = [];

  const updated = await prisma.$transaction(
    async (tx) => {
      const order = await tx.productionOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new Error("NOT_FOUND");

      const saidas = await tx.stockMovement.findMany({
        where: { productionOrderId: orderId, type: "saida" },
        orderBy: { id: "asc" },
      });

      for (const movement of saidas) {
        await recordStockMovementTx(tx, {
          materialId: movement.materialId,
          type: "estorno",
          quantity: dec(movement.quantity),
          productionOrderId: orderId,
          notes: `Estorno cancelamento ${order.orderNumber ?? `OP-${orderId}`}`,
          createdByUserId: opts?.createdByUserId,
        });
        affectedMaterialIds.push(movement.materialId);
      }

      return tx.productionOrder.update({
        where: { id: orderId },
        data: { status: "cancelada", cancelledAt: new Date() },
        include: productionOrderInclude,
      });
    },
    { timeout: 30_000 },
  );

  for (const materialId of [...new Set(affectedMaterialIds)]) {
    await dispatchMinStockAlerts(materialId);
  }

  return updated;
}

export function bomStockErrorToResponse(err: unknown): Response | null {
  if (err instanceof BomSkuMissingError) {
    return fail("CONFLICT", 409, {
      message: "SKU do BOM ausente no catálogo de materiais.",
      details: { skus: err.skus },
    });
  }
  if (err instanceof BomStockInsufficientError) {
    return fail("CONFLICT", 409, {
      message: "Saldo insuficiente para iniciar a produção.",
      details: { items: err.items },
    });
  }
  if (err instanceof Error && err.message === "EMPTY_BOM") {
    return fail("CONFLICT", 409, { message: "BOM vazio — não é possível iniciar a produção." });
  }
  return null;
}
