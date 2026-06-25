"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useVehicles } from "@/hooks/useVehicles";
import { vehicleAttrs, vehicleDisplayName, type PaymentMethod, type Sale, type Vehicle } from "@/types";

const PAY_LABEL: Record<PaymentMethod, string> = {
  a_vista: "À vista",
  pix: "PIX",
  financiamento: "Financiamento",
  cartao: "Cartão",
  troca: "Troca",
  promissoria: "Promissória",
};

type MetricTheme = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  topBorder: string;
  cardTint: string;
};

const METRIC_THEMES: Record<string, MetricTheme> = {
  vendidos: {
    icon: ShoppingBag,
    iconBg: "bg-violet-100 ring-violet-300/90",
    iconColor: "text-violet-700",
    topBorder: "border-t-violet-500",
    cardTint: "bg-violet-50/50",
  },
  receita: {
    icon: TrendingUp,
    iconBg: "bg-emerald-100 ring-emerald-300/90",
    iconColor: "text-emerald-700",
    topBorder: "border-t-emerald-500",
    cardTint: "bg-emerald-50/50",
  },
  ticket: {
    icon: BarChart3,
    iconBg: "bg-sky-100 ring-sky-300/90",
    iconColor: "text-sky-700",
    topBorder: "border-t-sky-500",
    cardTint: "bg-sky-50/50",
  },
  margem: {
    icon: TrendingUp,
    iconBg: "bg-teal-100 ring-teal-300/90",
    iconColor: "text-teal-800",
    topBorder: "border-t-teal-600",
    cardTint: "bg-teal-50/50",
  },
  giro: {
    icon: RotateCcw,
    iconBg: "bg-amber-100 ring-amber-300/90",
    iconColor: "text-amber-800",
    topBorder: "border-t-amber-500",
    cardTint: "bg-amber-50/50",
  },
};

function MetricCard({
  label,
  value,
  themeKey,
  footer,
}: {
  label: string;
  value: string;
  themeKey: keyof typeof METRIC_THEMES;
  footer?: React.ReactNode;
}) {
  const theme = METRIC_THEMES[themeKey];
  const Icon = theme.icon;

  return (
    <Card
      className={`border border-border/80 border-t-4 ${theme.topBorder} p-4 shadow-sm transition-shadow hover:shadow-md ${theme.cardTint}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className={`rounded-lg p-2 ring-1 ${theme.iconBg}`}>
          <Icon className={`h-4 w-4 ${theme.iconColor}`} aria-hidden />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </Card>
  );
}

export function RelatorioMensal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const { data: salesData = [], isLoading: loadingS } = useSales();
  const { data: vehiclesData = [], isLoading: loadingV } = useVehicles();

  const { vendasMes, receita, ticket, margemPct, giroMedio, porTipo, topVendas, vendasCsv } = useMemo(() => {
    const sales = Array.isArray(salesData) ? (salesData as Sale[]) : [];
    const vehicles = Array.isArray(vehiclesData) ? (vehiclesData as Vehicle[]) : [];

    const vendasDoMes = sales.filter((s) => {
      const a = s.attributes;
      const d = new Date(String(a.sale_date || ""));
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const receitaT = vendasDoMes.reduce((acc, s) => acc + (Number(s.attributes.final_price) || 0), 0);
    const n = vendasDoMes.length;
    const ticketM = n > 0 ? receitaT / n : 0;

    let totalCusto = 0;
    let totalReceita = 0;
    vendasDoMes.forEach((s) => {
      const a = s.attributes;
      const finalPrice = Number(a.final_price) || 0;
      const vData = a.vehicle?.data;
      let custo = 0;
      if (vData) custo = Number(vehicleAttrs(vData).purchase_price) || 0;
      if (!custo && vData) {
        const found = vehicles.find((v) => v.id === vData.id);
        if (found) custo = Number(vehicleAttrs(found).purchase_price) || 0;
      }
      if (custo > 0 && finalPrice > 0) {
        totalCusto += custo;
        totalReceita += finalPrice;
      }
    });
    const margemPctVal = totalCusto > 0 ? ((totalReceita - totalCusto) / totalCusto) * 100 : 0;

    const disponiveis = vehicles.filter((v) => {
      const st = String(vehicleAttrs(v).status ?? "");
      return st === "disponivel" || st === "reservado";
    });
    const diasSum = disponiveis.reduce((acc, v) => {
      const a = vehicleAttrs(v);
      const created = new Date(String(a.createdAt || Date.now()));
      const dias = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
      return acc + dias;
    }, 0);
    const giroMedioVal = disponiveis.length ? Math.round(diasSum / disponiveis.length) : 0;

    const tipoMap = new Map<string, { q: number; v: number }>();
    vendasDoMes.forEach((s) => {
      const a = s.attributes;
      const pm = String(a.payment_method || "a_vista") as PaymentMethod;
      const label = PAY_LABEL[pm] || pm;
      const fp = Number(a.final_price) || 0;
      const cur = tipoMap.get(label) || { q: 0, v: 0 };
      tipoMap.set(label, { q: cur.q + 1, v: cur.v + fp });
    });
    const porTipoArr = [...tipoMap.entries()].map(([tipo, { q, v }]) => ({
      tipo,
      quantidade: q,
      valor: v,
      percentual: receitaT > 0 ? `${((v / receitaT) * 100).toFixed(1)}%` : "-",
    }));

    const top = [...vendasDoMes]
      .sort((a, b) => (Number(b.attributes.final_price) || 0) - (Number(a.attributes.final_price) || 0))
      .slice(0, 5)
      .map((s) => {
        const a = s.attributes;
        const finalPrice = Number(a.final_price) || 0;
        const vData = a.vehicle?.data;
        let custo = 0;
        if (vData) custo = Number(vehicleAttrs(vData).purchase_price) || 0;
        const nome = vData ? vehicleDisplayName(vData) : "Veículo";
        const custosMan = vData ? Number(vehicleAttrs(vData).estimated_maintenance_cost) || 0 : 0;
        const fipe = vData ? Number(vehicleAttrs(vData).fipe_price) || 0 : 0;
        const lucro = finalPrice - custo - custosMan;
        const margem = custo > 0 ? `${(((finalPrice - custo) / custo) * 100).toFixed(1)}%` : "-";
        const lucroVsFipe = fipe > 0 ? `${((lucro / fipe) * 100).toFixed(1)}%` : "-";
        return { veiculo: nome, valor: finalPrice, lucro, margem, lucroVsFipe };
      });

    const vendasCsv = vendasDoMes.map((s) => {
      const a = s.attributes;
      const d = new Date(String(a.sale_date || ""));
      const dataStr = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
      const vData = a.vehicle?.data;
      const nome = vData ? vehicleDisplayName(vData) : "Veículo";
      const finalPrice = Number(a.final_price) || 0;
      const pm = String(a.payment_method || "a_vista") as PaymentMethod;
      const pag = PAY_LABEL[pm] || pm;
      return { dataStr, veiculo: nome, valor: finalPrice, pagamento: pag };
    });

    return {
      vendasMes: n,
      receita: receitaT,
      ticket: ticketM,
      margemPct: margemPctVal,
      giroMedio: giroMedioVal,
      porTipo: porTipoArr,
      topVendas: top,
      vendasCsv,
    };
  }, [salesData, vehiclesData, m, y]);

  const exportarCsvVendasMes = useCallback(() => {
    const sep = ";";
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Data", "Veículo", "Valor final (BRL)", "Forma de pagamento"].join(sep);
    const lines = vendasCsv.map((r) =>
      [esc(r.dataStr), esc(r.veiculo), String(r.valor).replace(".", ","), esc(r.pagamento)].join(sep),
    );
    const bom = "\uFEFF";
    const csv = bom + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-mensal-vendas-${y}-${String(m + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vendasCsv, y, m]);

  const tituloMes = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  if (loadingS || loadingV) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Calculando indicadores…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Relatório mensal</h1>
          <p className="text-sm capitalize text-muted-foreground">{tituloMes}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            className="border-border/80 bg-card"
            onClick={exportarCsvVendasMes}
            title="Descarrega CSV com as vendas do mês (separador ;, UTF-8 com BOM)"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV vendas
          </Button>
          <Button variant="outline" type="button" className="border-border/80 bg-card" disabled title="Exportação PDF em roadmap">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <Card className="border border-border/80 border-t-4 border-t-violet-500 bg-violet-50/30 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2 ring-1 ring-violet-300/90">
            <CalendarDays className="h-5 w-5 text-violet-700" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Métricas do mês</h2>
            <p className="text-xs text-muted-foreground">Vendas e giro de estoque no mês civil corrente.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="Veículos vendidos" value={String(vendasMes)} themeKey="vendidos" />
          <MetricCard
            label="Receita (preço final)"
            value={receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            themeKey="receita"
          />
          <MetricCard
            label="Ticket médio"
            value={ticket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            themeKey="ticket"
          />
          <MetricCard label="Margem média (custo aquisição)" value={`${margemPct.toFixed(1)}%`} themeKey="margem" />
          <MetricCard
            label="Giro médio (estoque atual)"
            value={`${giroMedio} dias`}
            themeKey="giro"
            footer={
              <Link href="/giro" className="inline-block text-xs font-medium text-emerald-700 hover:underline">
                Ver análise de giro
              </Link>
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border border-border/80 border-t-4 border-t-sky-500 bg-sky-50/30 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 px-5 py-4">
            <div className="rounded-lg bg-sky-100 p-2 ring-1 ring-sky-300/90">
              <CreditCard className="h-5 w-5 text-sky-700" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-foreground">Vendas por forma de pagamento</h2>
          </div>
          <div className="p-5">
            {porTipo.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma venda neste mês.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40">
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Qtd
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Valor
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {porTipo.map((item, index) => (
                      <tr key={index} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5 text-foreground">{item.tipo}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{item.quantidade}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                          {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{item.percentual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden border border-border/80 border-t-4 border-t-amber-500 bg-amber-50/30 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 px-5 py-4">
            <div className="rounded-lg bg-amber-100 p-2 ring-1 ring-amber-300/90">
              <Trophy className="h-5 w-5 text-amber-800" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-foreground">Maiores vendas do mês</h2>
          </div>
          <div className="p-5">
            {topVendas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                Sem vendas para ranquear.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40">
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Veículo
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Valor
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Lucro est.
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Lucro × FIPE
                      </th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Margem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendas.map((item, index) => (
                      <tr key={index} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5 text-foreground">{item.veiculo}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-emerald-700">
                          {item.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{item.lucroVsFipe}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-emerald-700">{item.margem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="flex items-start gap-3 border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
        <div>
          <h3 className="mb-1 text-sm font-semibold text-blue-900">DRE / custos operacionais</h3>
          <p className="text-sm text-blue-900/90">
            Agregação de despesas por categoria depende de lançamentos financeiros (roadmap). Por ora use{" "}
            <Link href="/financeiro" className="font-medium text-emerald-700 underline">
              Financeiro
            </Link>{" "}
            e promissórias.
          </p>
        </div>
      </Card>
    </div>
  );
}
