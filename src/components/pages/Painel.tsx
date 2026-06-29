"use client";

import { FileText, Factory, Package, Wallet, Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StitchKpiCard, StitchPageHeader } from "@/components/ui/stitch";

const PLACEHOLDER_KPIS = [
  { label: "Orçamentos", icon: FileText, cycle: "0713" },
  { label: "Produção / OS", icon: Factory, cycle: "0720" },
  { label: "Estoque materiais", icon: Package, cycle: "0720" },
  { label: "Financeiro", icon: Wallet, cycle: "0727" },
] as const;

/**
 * Painel Lignum — placeholders até KPIs reais (mini-cycle pós-0727).
 * KPIs Movix de veículo removidos no 0713 Stage 1 (ADR-0009).
 */
export function Painel() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <StitchPageHeader
        title="Painel"
        description="Visão geral da operação Lignum. Indicadores completos de carrocerias após os cycles de domínio."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLACEHOLDER_KPIS.map((item) => (
          <StitchKpiCard
            key={item.label}
            label={item.label}
            value="—"
            sublabel={`Módulo em construção (cycle ${item.cycle})`}
            icon={item.icon}
          />
        ))}
      </div>

      <Card className="border border-dashed border-border bg-muted/20 p-8 md:p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Hammer className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard em evolução</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Os KPIs de revenda de veículos foram desactivados. O painel completo com métricas de orçamentos,
          produção e lucro será entregue após os cycles <strong className="font-medium text-foreground">0713–0727</strong>.
        </p>
      </Card>
    </div>
  );
}
