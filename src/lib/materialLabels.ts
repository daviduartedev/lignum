import type { MaterialCategory } from "@prisma/client";

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  madeira: "Madeira",
  ferragens: "Ferragens",
  tintas: "Tintas",
  estrutura: "Estrutura",
  tampa: "Tampa",
  assoalho: "Assoalho",
  acabamento: "Acabamento",
  consumivel: "Consumível",
  opcional: "Opcional",
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  estorno: "Estorno",
};

export function materialCategoryLabel(category: MaterialCategory): string {
  return MATERIAL_CATEGORY_LABELS[category] ?? category;
}

export function materialStockStatusLabel(belowMinimum: boolean): string {
  return belowMinimum ? "Reposição" : "Disponível";
}

export function materialStockStatusClass(belowMinimum: boolean): string {
  return belowMinimum
    ? "bg-red-100 text-red-800 border border-red-200"
    : "bg-emerald-100 text-emerald-800 border border-emerald-200";
}
