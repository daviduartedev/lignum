import type { ProductionOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  deductBomStockForProductionOrder,
  reverseBomStockForProductionOrder,
} from "@/lib/production/deductBomStock";

const ALLOWED: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
  aguardando: ["andamento", "cancelada"],
  andamento: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

export function canTransitionProductionStatus(
  from: ProductionOrderStatus,
  to: ProductionOrderStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function buildProductionOrderNumber(id: number, date = new Date()): string {
  const year = date.getFullYear();
  return `OP-${year}-${String(id).padStart(4, "0")}`;
}

export async function startProductionOrder(orderId: number, opts?: { createdByUserId?: number }) {
  const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (!canTransitionProductionStatus(order.status, "andamento")) {
    throw new Error("INVALID_TRANSITION");
  }

  return deductBomStockForProductionOrder(orderId, opts);
}

export async function completeProductionOrder(orderId: number) {
  const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (!canTransitionProductionStatus(order.status, "concluida")) {
    throw new Error("INVALID_TRANSITION");
  }

  return prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: "concluida", completedAt: new Date() },
    include: productionOrderInclude,
  });
}

export async function cancelProductionOrder(orderId: number, opts?: { createdByUserId?: number }) {
  const order = await prisma.productionOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("NOT_FOUND");
  if (!canTransitionProductionStatus(order.status, "cancelada")) {
    throw new Error("INVALID_TRANSITION");
  }

  if (order.status === "andamento") {
    return reverseBomStockForProductionOrder(orderId, opts);
  }

  return prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: "cancelada", cancelledAt: new Date() },
    include: productionOrderInclude,
  });
}

export const productionOrderInclude = {
  quote: {
    include: {
      client: { select: { id: true, fullName: true, document: true, email: true } },
      bodyModel: { select: { id: true, name: true } },
    },
  },
  technicalSheet: true,
  employees: {
    include: {
      employee: { select: { id: true, name: true, roleTitle: true, isActive: true } },
    },
  },
  stockMovements: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: {
      material: { select: { id: true, sku: true, name: true, unit: true } },
    },
  },
} as const;

export async function createProductionOrderForConversion(
  quoteId: number,
  technicalSheetId: number,
  tx: Pick<typeof prisma, "productionOrder"> = prisma,
) {
  const provisional = await tx.productionOrder.create({
    data: {
      quoteId,
      technicalSheetId,
      status: "aguardando",
    },
  });

  const orderNumber = buildProductionOrderNumber(provisional.id);
  return tx.productionOrder.update({
    where: { id: provisional.id },
    data: { orderNumber },
    include: productionOrderInclude,
  });
}
