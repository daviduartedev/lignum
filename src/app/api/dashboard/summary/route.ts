import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { bucketSalesCountsPerMonth, computeTopMarcas } from "@/lib/dashboard/commerceAggregates";
import { getDashboardTopBrandsMonths, getDashboardVendasResumoMonths } from "@/lib/dashboard/dashboardPeriodEnv";
import { loadPontosAtencaoCore } from "@/lib/dashboard/pontosAtencaoCore";
import { prisma } from "@/lib/db";
import {
  getSpYearMonth,
  listConsecutiveSpMonthsOldestFirst,
  utcBoundsForCalendarMonth,
  utcRangeForSpMonthWindow,
} from "@/lib/dashboard/spCalendar";
import type { DashboardSummary } from "@/lib/dashboard/summaryTypes";
import { ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest) => {
  const now = new Date();

  const {
    diasMin,
    disponivelCount: n,
    valorEmEstoque,
    diasParadoMedio,
    pontosAtencaoCount,
    pontosAtencaoTop5: pontosAtencao,
    pontosAtencaoFull: pontosAtencaoListaCompleta,
  } = await loadPontosAtencaoCore(prisma, now);

  const { y, m } = getSpYearMonth(now);
  const { start: monthStart, end: monthEnd } = utcBoundsForCalendarMonth(y, m);

  const saleWhere: Prisma.SaleWhereInput = {
    saleDate: { gte: monthStart, lte: monthEnd },
  };

  const sales = await prisma.sale.findMany({
    where: saleWhere,
    select: {
      finalPrice: true,
      vehicle: {
        select: {
          purchasePrice: true,
          estimatedMaintenanceCost: true,
        },
      },
    },
  });

  let sumReceita = 0;
  let sumLucro = 0;
  let lucroMesReais = 0;
  for (const s of sales) {
    const receita = Number(s.finalPrice);
    const custo = Number(s.vehicle.purchasePrice);
    const manut = Number(s.vehicle.estimatedMaintenanceCost ?? 0);
    if (receita > 0 && custo > 0) {
      sumReceita += receita;
      const lucroLinha = receita - custo - (Number.isFinite(manut) ? manut : 0);
      sumLucro += receita - custo;
      lucroMesReais += lucroLinha;
    }
  }
  const margemMesPct = sumReceita > 0 ? (sumLucro / sumReceita) * 100 : 0;
  const vendasMesCount = sales.length;

  const topMarcasMonths = getDashboardTopBrandsMonths();
  const vendasResumoMonths = getDashboardVendasResumoMonths();

  const { start: brandStart, end: brandEnd } = utcRangeForSpMonthWindow(now, topMarcasMonths);
  const { start: resumoStart, end: resumoEnd } = utcRangeForSpMonthWindow(now, vendasResumoMonths);

  const [salesForBrands, salesForResumo] = await Promise.all([
    prisma.sale.findMany({
      where: { saleDate: { gte: brandStart, lte: brandEnd } },
      select: { vehicle: { select: { brand: true } } },
    }),
    prisma.sale.findMany({
      where: { saleDate: { gte: resumoStart, lte: resumoEnd } },
      select: { saleDate: true },
    }),
  ]);

  const topMarcas = computeTopMarcas(
    salesForBrands.map((s) => ({ brand: s.vehicle.brand })),
    5,
  );

  const resumoMonthsOrdered = listConsecutiveSpMonthsOldestFirst(now, vendasResumoMonths);
  const vendasPorMesResumo = bucketSalesCountsPerMonth(salesForResumo, resumoMonthsOrdered);

  const payload: DashboardSummary = {
    pontosAtencaoDiasMin: diasMin,
    disponivelCount: n,
    valorEmEstoque,
    diasParadoMedio,
    margemMesPct,
    lucroMesReais,
    vendasMesCount,
    pontosAtencaoCount,
    pontosAtencao,
    pontosAtencaoListaCompleta,
    topMarcasMonths,
    topMarcas,
    vendasResumoMonths,
    vendasPorMesResumo,
  };

  return ok(payload);
});
