import type { ProductionOrderStatus } from "@prisma/client";

export const PRODUCTION_ORDER_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  aguardando: "Aguardando",
  andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const KANBAN_COLUMNS: ProductionOrderStatus[] = [
  "aguardando",
  "andamento",
  "concluida",
  "cancelada",
];

const STATUS_BADGE: Record<ProductionOrderStatus, string> = {
  aguardando: "bg-slate-100 text-slate-800 border border-slate-200",
  andamento: "bg-blue-100 text-blue-900 border border-blue-200",
  concluida: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelada: "bg-red-100 text-red-800 border border-red-200",
};

const COLUMN_DOT: Record<ProductionOrderStatus, string> = {
  aguardando: "bg-outline",
  andamento: "bg-secondary",
  concluida: "bg-emerald-500",
  cancelada: "bg-red-500",
};

export function productionOrderStatusLabel(status: ProductionOrderStatus): string {
  return PRODUCTION_ORDER_STATUS_LABELS[status];
}

export function productionOrderStatusBadgeClass(status: ProductionOrderStatus): string {
  return STATUS_BADGE[status];
}

export function productionOrderColumnDotClass(status: ProductionOrderStatus): string {
  return COLUMN_DOT[status];
}

export function productionOrderProgressPercent(status: ProductionOrderStatus): number {
  if (status === "aguardando") return 0;
  if (status === "andamento") return 50;
  if (status === "concluida") return 100;
  return 0;
}

export function productionOrderDisplayNumber(order: {
  orderNumber?: string | null;
  id: number;
}): string {
  return order.orderNumber ?? `OP-${order.id}`;
}
