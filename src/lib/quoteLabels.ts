import type { QuoteStatus } from "@/types/quotes";
import { QUOTE_STATUS_LABELS } from "@/types/quotes";

export function quoteStatusLabel(status: QuoteStatus): string {
  return QUOTE_STATUS_LABELS[status];
}

export function quoteStatusBadgeClass(status: QuoteStatus): string {
  if (status === "aprovado" || status === "convertido") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (status === "enviado") return "bg-[#DBEAFE] text-[#1D4ED8] border-0";
  if (status === "rascunho") return "bg-[#FEF9C3] text-[#A16207] border-0";
  return "bg-[#FEE2E2] text-[#B91C1C] border-0";
}

/** Rótulo curto para tabelas compactas (ex.: painel). */
export function quoteStatusShortLabel(status: QuoteStatus): string {
  if (status === "aprovado" || status === "convertido") return "Aprovado";
  if (status === "enviado") return "Em análise";
  if (status === "rascunho") return "Pendente";
  if (status === "cancelado") return "Cancelado";
  return quoteStatusLabel(status);
}

export function quoteStatusShortBadgeClass(status: QuoteStatus): string {
  if (status === "aprovado" || status === "convertido") return "bg-green-100 text-green-700";
  if (status === "enviado") return "bg-blue-100 text-blue-700";
  if (status === "rascunho") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}
