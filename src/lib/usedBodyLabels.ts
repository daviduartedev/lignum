import type { UsedBodyCondition, UsedBodyStatus } from "@prisma/client";

export const USED_BODY_STATUS_LABELS: Record<UsedBodyStatus, string> = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  em_reforma: "Em reforma",
};

export const USED_BODY_CONDITION_LABELS: Record<UsedBodyCondition, string> = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
};

const STATUS_BADGE_CLASSES: Record<UsedBodyStatus, string> = {
  disponivel: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  reservada: "bg-amber-100 text-amber-900 border border-amber-200",
  vendida: "bg-sky-100 text-sky-900 border border-sky-200",
  em_reforma: "bg-violet-100 text-violet-900 border border-violet-200",
};

const CONDITION_DOT_CLASSES: Record<UsedBodyCondition, string> = {
  excelente: "bg-emerald-500",
  bom: "bg-green-500",
  regular: "bg-yellow-500",
  ruim: "bg-red-500",
};

export function usedBodyStatusLabel(status: UsedBodyStatus): string {
  return USED_BODY_STATUS_LABELS[status];
}

export function usedBodyStatusBadgeClass(status: UsedBodyStatus): string {
  return STATUS_BADGE_CLASSES[status];
}

export function usedBodyConditionLabel(condition: UsedBodyCondition): string {
  return USED_BODY_CONDITION_LABELS[condition];
}

export function usedBodyConditionDotClass(condition: UsedBodyCondition): string {
  return CONDITION_DOT_CLASSES[condition];
}

export function formatUsedBodyMeasures(lengthM: number, widthM: number, heightM?: number | null): string {
  const base = `${lengthM.toFixed(2)}m x ${widthM.toFixed(2)}m`;
  if (heightM != null && heightM > 0) return `${base} x ${heightM.toFixed(2)}m`;
  return base;
}
