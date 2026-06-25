import type { VehicleStatus } from "@prisma/client";

const STATUS_LABELS: Record<VehicleStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  repasse: "Repasse",
  vendido: "Vendido",
  standby_nao_compra: "Standby",
  removido: "Removido",
};

const STATUS_BADGE_CLASSES: Record<VehicleStatus, string> = {
  // Regras de cor (pedido): em estoque=verde, reservados=amarelo, vendidos=azul, removidos=vermelho.
  disponivel: "bg-emerald-200 text-emerald-900 border border-emerald-300",
  reservado: "bg-amber-200 text-amber-900 border border-amber-300",
  vendido: "bg-sky-200 text-sky-900 border border-sky-300",
  removido: "bg-red-200 text-red-900 border border-red-300",
  // Demais: standby fica neutro/pausado (laranja suave).
  standby_nao_compra: "bg-orange-200 text-orange-900 border border-orange-300",
  // Neutro: repasse sem cor especial.
  repasse: "bg-slate-100 text-slate-800 border border-slate-200",
};

export function vehicleStatusLabel(status: VehicleStatus): string {
  return STATUS_LABELS[status];
}

export function vehicleStatusBadgeClass(status: VehicleStatus): string {
  return STATUS_BADGE_CLASSES[status];
}

