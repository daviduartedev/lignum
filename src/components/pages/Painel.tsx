"use client";

import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { PainelAlerts } from "@/components/painel/PainelAlerts";
import { PainelProductionChart, PainelRevenueChart } from "@/components/painel/PainelCharts";
import { PainelKpiCard } from "@/components/painel/PainelKpiCard";
import { PainelRecentQuotesTable } from "@/components/painel/PainelRecentQuotesTable";
import { PAINEL_KPIS } from "@/components/painel/painelMockData";
import { toast } from "@/lib/toast";

/** Painel Stitch 01 — layout fiel ao mock; KPIs/gráficos estáticos até cycle 0727. */
export function Painel() {
  return (
    <div className="relative mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel de Controle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral da produção e desempenho financeiro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
            onClick={() => toast.info("Exportação disponível após cycle 0727.")}
          >
            <Download className="h-[18px] w-[18px]" aria-hidden />
            Exportar
          </button>
          <Link
            href="/orcamentos/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            <Plus className="h-[18px] w-[18px]" aria-hidden />
            Novo Orçamento
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PAINEL_KPIS.map((kpi) => (
          <PainelKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PainelRevenueChart />
          <PainelProductionChart />
        </div>
        <PainelAlerts />
      </div>

      <PainelRecentQuotesTable />

      <Link
        href="/producao"
        className="group fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label="Ir para produção"
      >
        <Plus className="h-7 w-7" aria-hidden />
        <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-[#333] px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Produção
        </span>
      </Link>
    </div>
  );
}
