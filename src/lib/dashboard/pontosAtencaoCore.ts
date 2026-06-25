import type { PrismaClient } from "@prisma/client";
import { getDashboardPontosAtencaoDiasMin } from "@/lib/dashboard/pontosAtencaoEnv";
import type { DashboardPontosAtencaoItem } from "@/lib/dashboard/summaryTypes";

function diasParado(createdAt: Date, now: Date): number {
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

function displayName(row: { brand: string; model: string; version: string | null }): string {
  return [row.brand, row.model, row.version].filter(Boolean).join(" ");
}

/**
 * Mesma regra que `GET /api/dashboard/summary` para veículos disponíveis acima do limiar.
 */
export async function loadPontosAtencaoCore(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<{
  diasMin: number;
  disponivelCount: number;
  valorEmEstoque: number;
  diasParadoMedio: number;
  pontosAtencaoCount: number;
  /** Todos os veículos ≥ limiar, ordenados por dias desc. */
  pontosAtencaoFull: DashboardPontosAtencaoItem[];
  /** Primeiros 5 (vista resumida). */
  pontosAtencaoTop5: DashboardPontosAtencaoItem[];
}> {
  const diasMin = getDashboardPontosAtencaoDiasMin();

  const vehicles = await prisma.vehicle.findMany({
    where: { status: "disponivel" },
    select: {
      id: true,
      documentId: true,
      plate: true,
      brand: true,
      model: true,
      version: true,
      mainPhotoUrl: true,
      purchasePrice: true,
      createdAt: true,
    },
    orderBy: { id: "desc" },
    take: 5000,
  });

  let valorEmEstoque = 0;
  let sumDias = 0;
  const enriched = vehicles.map((v) => {
    const purchase = Number(v.purchasePrice);
    const dias = diasParado(v.createdAt, now);
    valorEmEstoque += Number.isFinite(purchase) ? purchase : 0;
    sumDias += dias;
    return {
      ...v,
      purchasePrice: purchase,
      dias,
    };
  });

  const n = enriched.length;
  const diasParadoMedio = n > 0 ? Math.round(sumDias / n) : 0;

  const atencaoSorted = enriched
    .filter((v) => v.dias >= diasMin)
    .sort((a, b) => b.dias - a.dias);

  const toItem = (v: (typeof enriched)[number]): DashboardPontosAtencaoItem => ({
    vehicleId: v.id,
    routeId: v.documentId ?? String(v.id),
    plate: v.plate,
    displayName: displayName(v),
    dias: v.dias,
    brand: v.brand,
    model: v.model,
    version: v.version,
    mainPhotoUrl: v.mainPhotoUrl,
  });

  const pontosAtencaoFull = atencaoSorted.map(toItem);
  const pontosAtencaoTop5 = pontosAtencaoFull.slice(0, 5);

  return {
    diasMin,
    disponivelCount: n,
    valorEmEstoque,
    diasParadoMedio,
    pontosAtencaoCount: pontosAtencaoFull.length,
    pontosAtencaoFull,
    pontosAtencaoTop5,
  };
}
