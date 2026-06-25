"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Car, DollarSign, AlertTriangle, ShoppingBag } from "lucide-react";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { useUserInboxPreferences } from "@/hooks/useUserInboxPreferences";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import {
  ListingStatCell,
  listingTdActions,
  listingTdStat,
  listingThActions,
  listingThStat,
  listingThText,
  listingTdText,
} from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { diasParadoBadgeClass } from "@/lib/dashboard/diasParadoVisual";
import type { DashboardPontosAtencaoItem } from "@/lib/dashboard/summaryTypes";
import type { Vehicle } from "@/types";
import type { LucideIcon } from "lucide-react";

const PREVIEW_ROWS = 8;

const formatCurrencyShort = (value: number) => {
  if (value === 0) return "R$ 0";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const BAR_COLOR_CLASSES = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-purple-500",
] as const;

function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function stableBarColor(key: string): string {
  const idx = stableHash(key.trim().toLowerCase()) % BAR_COLOR_CLASSES.length;
  return BAR_COLOR_CLASSES[idx]!;
}

type KpiTheme = {
  iconBg: string;
  iconColor: string;
  topBorder: string;
  cardTint: string;
};

const KPI_THEMES: Record<string, KpiTheme> = {
  "Estoque Total": {
    iconBg: "bg-blue-100 ring-blue-300/90",
    iconColor: "text-blue-600",
    topBorder: "border-t-blue-600",
    cardTint: "bg-blue-50/50",
  },
  "Valor em estoque": {
    iconBg: "bg-indigo-100 ring-indigo-300/90",
    iconColor: "text-indigo-600",
    topBorder: "border-t-indigo-600",
    cardTint: "bg-indigo-50/50",
  },
  "Lucro do mês": {
    iconBg: "bg-emerald-100 ring-emerald-300/90",
    iconColor: "text-emerald-600",
    topBorder: "border-t-emerald-600",
    cardTint: "bg-emerald-50/50",
  },
  "Vendas mês": {
    iconBg: "bg-blue-100 ring-blue-300/90",
    iconColor: "text-blue-600",
    topBorder: "border-t-blue-600",
    cardTint: "bg-blue-50/50",
  },
};

function dashboardItemToVehicle(row: DashboardPontosAtencaoItem): Vehicle {
  return {
    id: row.vehicleId,
    attributes: {
      brand: row.brand,
      model: row.model,
      version: row.version ?? undefined,
      main_photo: row.mainPhotoUrl
        ? ({ url: row.mainPhotoUrl } as unknown as Vehicle["attributes"]["main_photo"])
        : undefined,
    },
  } as Vehicle;
}

function StockDisponivelPrioridadeTable({
  lista,
  verTodosHref,
  onOpenListaCompleta,
}: {
  lista: DashboardPontosAtencaoItem[];
  verTodosHref: string;
  onOpenListaCompleta: () => void;
}) {
  const router = useRouter();

  if (lista.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Stock disponível em dia</p>
      </div>
    );
  }

  const preview = lista.slice(0, PREVIEW_ROWS);
  const hasMore = lista.length > PREVIEW_ROWS;

  return (
    <div className="px-4 pb-4 pt-3 md:px-6 md:pb-5 md:pt-4">
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-border/80">
              <th className={`${listingThText} min-w-[10rem]`}>Veículo</th>
              <th className={listingThStat}>Placa</th>
              <th className={listingThStat}>Dias</th>
              <th className={listingThActions}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((row) => (
              <tr
                key={`${row.vehicleId}-${row.routeId}`}
                className="border-b border-border/80 last:border-0 transition-colors hover:bg-muted/50"
              >
                <td className={`${listingTdText} py-3.5 pr-3`}>
                  <VehicleListingCell vehicle={dashboardItemToVehicle(row)} />
                </td>
                <td className={`${listingTdStat} py-3.5`}>
                  <ListingStatCell
                    hideLabel
                    label="Placa"
                    value={row.plate?.trim() ? <MercosulPlate plate={row.plate} /> : "-"}
                    valueClassName="font-normal"
                  />
                </td>
                <td className={`${listingTdStat} py-3.5`}>
                  <ListingStatCell
                    hideLabel
                    label="Dias"
                    value={
                      <span
                        className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${diasParadoBadgeClass(row.dias)}`}
                      >
                        {row.dias}
                      </span>
                    }
                    valueClassName="font-normal"
                  />
                </td>
                <td className={`${listingTdActions} py-3.5`}>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    onClick={() => router.push(`/veiculo/${row.routeId}`)}
                  >
                    Ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2">
          {hasMore ? (
            <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={onOpenListaCompleta}>
              Lista completa ({lista.length})
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50" asChild>
            <Link href={verTodosHref}>Filtrar no estoque</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Painel() {
  const router = useRouter();
  const [listaCompletaOpen, setListaCompletaOpen] = useState(false);
  const { data: summary, isLoading, isError } = useDashboardSummary();
  const { data: inboxPrefs } = useUserInboxPreferences();

  const stats = useMemo(() => {
    if (!summary) return null;

    const {
      valorEmEstoque,
      lucroMesReais,
      vendasMesCount,
      pontosAtencaoDiasMin,
      disponivelCount,
    } = summary;

    return {
      kpis: [
        {
          label: "Estoque Total",
          value: "-",
          icon: Car,
        },
        { label: "Valor em estoque", value: formatCurrencyShort(valorEmEstoque), icon: DollarSign },
        {
          label: "Lucro do mês",
          value: formatCurrencyShort(lucroMesReais),
          change: "Vendas − compra − custos",
          trend: lucroMesReais > 0 ? ("up" as const) : ("down" as const),
          icon: TrendingUp,
        },
        {
          label: "Vendas mês",
          value: String(vendasMesCount),
          change: "No período (SP)",
          trend: vendasMesCount > 0 ? ("up" as const) : ("down" as const),
          icon: ShoppingBag,
        },
      ],
      diasMin: pontosAtencaoDiasMin,
      disponivelCount,
    };
  }, [summary]);

  if (isLoading) {
    return <PainelSkeleton />;
  }

  if (isError || !stats || !summary) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Painel</h1>
        <p className="text-sm text-destructive">Não foi possível carregar o resumo. Atualize a página ou tente novamente.</p>
      </div>
    );
  }

  const { kpis, diasMin, disponivelCount } = stats;
  const kpisWithEstoque = kpis.map((k, i) => (i === 0 ? { ...k, value: String(disponivelCount) } : k));
  const prioridadeCount = summary.pontosAtencaoCount;

  const verTodosHref = `/estoque?tab=estoque&diasMin=${diasMin}`;
  const listaParadosCompleta = summary.pontosAtencaoListaCompleta ?? summary.pontosAtencao;
  const piorCaso = listaParadosCompleta[0] ?? summary.pontosAtencao[0];
  const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });
  const showAttentionStripe = inboxPrefs?.showDashboardAttentionStripe ?? true;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Painel</h1>
      </div>

      {piorCaso && showAttentionStripe ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl bg-orange-500 px-4 py-3.5 text-sm text-white shadow-md ring-2 ring-orange-600/40"
          role="status"
          aria-labelledby="painel-pior-caso-titulo"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-white" aria-hidden />
          <p id="painel-pior-caso-titulo" className="font-semibold shrink-0 text-white">
            Caso mais urgente ({summary.pontosAtencaoDiasMin}+ dias)
          </p>
          <span className="text-orange-50 min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{piorCaso.displayName}</span>
            {piorCaso.plate?.trim() ? <MercosulPlate plate={piorCaso.plate} /> : null}
            <span>
              · <strong className="tabular-nums text-white">{piorCaso.dias}</strong> dias parado
            </span>
          </span>
          <button
            type="button"
            className="text-xs font-semibold shrink-0 rounded-md bg-orange-700 px-3 py-1.5 text-white hover:bg-orange-800 transition-colors"
            onClick={() => router.push(`/veiculo/${piorCaso.routeId}`)}
          >
            Abrir ficha
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5 items-start">
        {kpisWithEstoque.map((kpi, index) => {
          const Icon = kpi.icon as LucideIcon;
          const trendUp = kpi.trend === "up";
          const theme = KPI_THEMES[kpi.label] ?? KPI_THEMES["Estoque Total"]!;

          return (
            <Card
              key={index}
              className={`p-5 border border-border/80 border-t-4 ${theme.topBorder} shadow-sm hover:shadow-md transition-shadow ${theme.cardTint}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`p-2 rounded-lg ring-1 ${theme.iconBg}`}>
                  <Icon className={`w-5 h-5 ${theme.iconColor}`} aria-hidden />
                </div>
                {kpi.change ? (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`flex items-center gap-1 text-[11px] font-medium ${trendUp ? "text-emerald-700" : "text-amber-800"}`}>
                      {trendUp ? <TrendingUp className="w-3 h-3 shrink-0" aria-hidden /> : <TrendingDown className="w-3 h-3 shrink-0" aria-hidden />}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground tabular-nums">{kpi.value}</div>
              <div className="mt-0.5 text-sm text-muted-foreground leading-snug">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden border-border/80 border-t-4 border-t-emerald-500 shadow-md bg-card">
        <div className="border-b border-border/70 px-5 py-4 md:px-6 md:flex md:items-center md:justify-between md:gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground md:text-lg">Veículos parados com prioridade de giro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Disponíveis com ≥ {diasMin} dias parados, ordenados por tempo no stock (maior primeiro).
              {prioridadeCount > 0 ? (
                <>
                  {" "}
                  <span className="tabular-nums font-medium text-foreground">{prioridadeCount}</span> veículo(s) nesta lista.
                </>
              ) : null}
            </p>
          </div>
          {prioridadeCount > 0 ? (
            <Link
              href={verTodosHref}
              className="text-xs font-semibold text-emerald-700 hover:underline shrink-0 mt-2 md:mt-0"
            >
              Filtrar no estoque
            </Link>
          ) : null}
        </div>
        <StockDisponivelPrioridadeTable
          lista={listaParadosCompleta}
          verTodosHref={verTodosHref}
          onOpenListaCompleta={() => setListaCompletaOpen(true)}
        />
      </Card>

      <Dialog open={listaCompletaOpen} onOpenChange={setListaCompletaOpen}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-1 border-b border-border/80 px-6 py-4 text-left">
            <DialogTitle className="text-lg">Lista completa</DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-2 py-2">
            <ul className="space-y-1">
              {listaParadosCompleta.map((row, idx) => (
                <li key={`${row.routeId}-${idx}`}>
                  <button
                    type="button"
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 text-left transition-colors hover:border-emerald-400/60 hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_7rem_4rem]"
                    onClick={() => {
                      setListaCompletaOpen(false);
                      router.push(`/veiculo/${row.routeId}`);
                    }}
                  >
                    <VehicleListingCell vehicle={dashboardItemToVehicle(row)} />
                    <ListingStatCell
                      hideLabel
                      label="Placa"
                      value={row.plate?.trim() ? <MercosulPlate plate={row.plate} /> : "-"}
                      valueClassName="font-normal"
                    />
                    <ListingStatCell
                      hideLabel
                      label="Dias"
                      value={
                        <span
                          className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${diasParadoBadgeClass(row.dias)}`}
                        >
                          {row.dias}
                        </span>
                      }
                      valueClassName="font-normal"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 border border-border/80 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Marcas mais vendidas</h2>
          {summary.topMarcas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            (() => {
              const maxBrand = Math.max(1, summary.topMarcas[0]?.vendasCount ?? 1);
              return (
                <ol className="space-y-3">
                  {summary.topMarcas.map((row, i) => (
                    <li key={`${row.marca}-${i}`} className="text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-foreground font-medium flex items-center gap-2 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${stableBarColor(row.marca)}`} aria-hidden />
                          <span className="truncate">{row.marca}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{row.vendasCount} veículos</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stableBarColor(row.marca)}`}
                          style={{
                            width: `${Math.max(4, Math.round((row.vendasCount / maxBrand) * 100))}%`,
                          }}
                          aria-hidden
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              );
            })()
          )}
        </Card>

        <Card className="p-6 border border-border/80 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Resumo de vendas por mês</h2>
          {summary.vendasPorMesResumo.every((r) => r.vendasCount === 0) ? (
            <p className="text-sm text-muted-foreground">Sem vendas registradas nesses meses.</p>
          ) : (
            (() => {
              const maxMes = Math.max(1, ...summary.vendasPorMesResumo.map((r) => r.vendasCount));
              return (
                <ul className="space-y-3">
                  {summary.vendasPorMesResumo.map((row) => {
                    const key = `${row.ano}-${row.mes}`;
                    return (
                      <li key={key} className="text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-foreground capitalize">
                            {monthFmt.format(new Date(Date.UTC(row.ano, row.mes - 1, 15)))}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{row.vendasCount} vendas</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stableBarColor(key)}`}
                            style={{ width: `${Math.max(4, Math.round((row.vendasCount / maxMes) * 100))}%` }}
                            aria-hidden
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()
          )}
        </Card>
      </div>
    </div>
  );
}

function PainelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded-md mb-2" />
        <div className="h-4 w-full max-w-xl bg-muted/70 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5 border border-border/60">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-muted rounded-lg" />
              <div className="w-14 h-4 bg-muted/70 rounded-md" />
            </div>
            <div className="w-20 h-8 bg-muted rounded-md mb-2" />
            <div className="w-28 h-4 bg-muted/70 rounded-md" />
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/60 border-t-4 border-t-emerald-500/50">
        <div className="h-14 border-b border-border/60" />
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/70 rounded-md w-full" />
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 border border-border/60">
          <div className="h-6 w-48 bg-muted rounded-md mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-muted/70 rounded-md w-full" />
            ))}
          </div>
        </Card>
        <Card className="p-6 border border-border/60">
          <div className="h-6 w-56 bg-muted rounded-md mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-muted/70 rounded-md w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
