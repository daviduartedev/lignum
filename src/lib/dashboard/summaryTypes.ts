/** Resposta de `GET /api/dashboard/summary` (dados agregados do painel). */
export type DashboardPontosAtencaoItem = {
  vehicleId: number;
  routeId: string;
  plate: string;
  displayName: string;
  dias: number;
  brand: string;
  model: string;
  version: string | null;
  mainPhotoUrl: string | null;
};

export type DashboardTopMarca = {
  marca: string;
  vendasCount: number;
};

export type DashboardVendaMesResumo = {
  ano: number;
  mes: number;
  vendasCount: number;
};

export type DashboardSummary = {
  pontosAtencaoDiasMin: number;
  disponivelCount: number;
  valorEmEstoque: number;
  diasParadoMedio: number;
  margemMesPct: number;
  /** Lucro bruto realizado no mês civil (SP): soma (finalPrice − purchasePrice − manutenção) por venda. */
  lucroMesReais: number;
  vendasMesCount: number;
  pontosAtencaoCount: number;
  /** Primeiros 5 itens (ordenados por dias desc.), mesma origem que `pontosAtencaoListaCompleta`. */
  pontosAtencao: DashboardPontosAtencaoItem[];
  /** Lista completa de veículos disponíveis acima do limiar (dias desc.); usada no painel para «Ver mais». */
  pontosAtencaoListaCompleta: DashboardPontosAtencaoItem[];
  topMarcasMonths: number;
  topMarcas: DashboardTopMarca[];
  vendasResumoMonths: number;
  vendasPorMesResumo: DashboardVendaMesResumo[];
};
