/** Catálogo base de SKUs do BOM para seed e validação de produção. */
export const BOM_CATALOG_SEED: Array<{
  sku: string;
  name: string;
  category:
    | "estrutura"
    | "tampa"
    | "assoalho"
    | "acabamento"
    | "consumivel"
    | "opcional"
    | "madeira"
    | "ferragens"
    | "tintas";
  unit: string;
  minStock: number;
  initialStock: number;
  avgCost: number;
}> = [
  { sku: "EST-PER", name: "Perfis estruturais galvanizados", category: "estrutura", unit: "m", minStock: 50, initialStock: 120, avgCost: 45 },
  { sku: "EST-CHP", name: "Chapas laterais", category: "estrutura", unit: "m²", minStock: 20, initialStock: 80, avgCost: 180 },
  { sku: "TMP-PLN", name: "Kit tampa plana", category: "tampa", unit: "kit", minStock: 2, initialStock: 6, avgCost: 3200 },
  { sku: "TMP-ARQ", name: "Kit tampa arqueada", category: "tampa", unit: "kit", minStock: 2, initialStock: 4, avgCost: 3800 },
  { sku: "TMP-BAS", name: "Kit tampa basculante + dobradiças", category: "tampa", unit: "kit", minStock: 1, initialStock: 3, avgCost: 4500 },
  { sku: "ASS-MAD", name: "Assoalho compensado naval", category: "assoalho", unit: "m²", minStock: 15, initialStock: 40, avgCost: 95 },
  { sku: "ASS-ACO", name: "Chapa assoalho aço 3mm", category: "assoalho", unit: "m²", minStock: 10, initialStock: 25, avgCost: 210 },
  { sku: "ASS-ALU", name: "Chapa assoalho alumínio", category: "assoalho", unit: "m²", minStock: 8, initialStock: 18, avgCost: 320 },
  { sku: "ACB-PIN", name: "Tinta PU + primer", category: "acabamento", unit: "lote", minStock: 3, initialStock: 10, avgCost: 480 },
  { sku: "ACB-VER", name: "Verniz marítimo", category: "acabamento", unit: "lote", minStock: 2, initialStock: 8, avgCost: 520 },
  { sku: "ACB-LAM", name: "Lâmina natural", category: "acabamento", unit: "m²", minStock: 5, initialStock: 12, avgCost: 140 },
  { sku: "CON-PAR", name: "Parafusos, rebites e selantes", category: "consumivel", unit: "kit", minStock: 5, initialStock: 20, avgCost: 85 },
];
