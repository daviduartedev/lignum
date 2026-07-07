"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { ProductionOrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StitchKpiCard, StitchPageHeader } from "@/components/ui/stitch";
import { useProductionOrders, useProductionOrderStatusCounts } from "@/hooks/useProductionOrders";
import type { ProductionOrderDto } from "@/lib/mappers/productionOrder";
import {
  KANBAN_COLUMNS,
  productionOrderColumnDotClass,
  productionOrderDisplayNumber,
  productionOrderProgressPercent,
  productionOrderStatusLabel,
} from "@/lib/productionOrderLabels";
import { cn } from "@/components/ui/utils";
import { Factory, Loader2, Search } from "lucide-react";

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function bodyDescription(order: ProductionOrderDto): string {
  const q = order.quote;
  if (!q) return "—";
  const model = q.bodyModelName ?? "Carroceria";
  return `${model} ${q.lengthM}×${q.widthM}×${q.heightM}m`;
}

function KanbanCard({ order }: { order: ProductionOrderDto }) {
  const progress = productionOrderProgressPercent(order.status);
  const isActive = order.status === "andamento";

  return (
    <Link
      href={`/producao/${order.id}`}
      className={cn(
        "block rounded-lg border border-outline-variant bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        isActive && "border-l-4 border-l-secondary",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="rounded bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">
          {productionOrderDisplayNumber(order)}
        </span>
      </div>
      <h4 className="mb-1 text-sm font-bold text-on-surface">
        {order.quote?.clientName ?? "Cliente"}
      </h4>
      <p className="mb-4 text-xs text-muted-foreground">{bodyDescription(order)}</p>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {order.employeeIds.length > 0 ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface-container-highest text-[10px] font-bold">
              +{order.employeeIds.length}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sem equipe</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-xs">{formatShortDate(order.createdAt)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
        <div
          className={cn(
            "h-full transition-all",
            order.status === "concluida" ? "bg-emerald-500" : order.status === "andamento" ? "bg-secondary" : "bg-outline",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </Link>
  );
}

function KanbanColumn({
  status,
  orders,
  count,
}: {
  status: ProductionOrderStatus;
  orders: ProductionOrderDto[];
  count: number;
}) {
  return (
    <div className="kanban-column flex h-full min-w-[300px] max-w-[320px] flex-col rounded-xl border border-outline-variant bg-surface-container-low/50 p-3">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", productionOrderColumnDotClass(status))} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
            {productionOrderStatusLabel(status)}
          </h3>
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] text-muted-foreground">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {orders.map((order) => (
          <KanbanCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Nenhuma ordem</p>
        )}
      </div>
    </div>
  );
}

export function ProducaoKanban() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const { data: counts } = useProductionOrderStatusCounts();
  const { data: orders, isLoading, isError, refetch } = useProductionOrders();

  const filtered = useMemo(() => {
    const list = orders ?? [];
    if (!deferredSearch) return list;
    return list.filter((o) => {
      const num = productionOrderDisplayNumber(o).toLowerCase();
      const client = (o.quote?.clientName ?? "").toLowerCase();
      const quoteNum = (o.quote?.quoteNumber ?? "").toLowerCase();
      const employeeMatch = o.employeeIds.some((id) => String(id).includes(deferredSearch));
      return (
        num.includes(deferredSearch) ||
        client.includes(deferredSearch) ||
        quoteNum.includes(deferredSearch) ||
        employeeMatch
      );
    });
  }, [orders, deferredSearch]);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((s) => [s, [] as ProductionOrderDto[]])) as Record<
      ProductionOrderStatus,
      ProductionOrderDto[]
    >;
    for (const o of filtered) {
      map[o.status]?.push(o);
    }
    return map;
  }, [filtered]);

  const kpis = {
    total: counts?.total ?? filtered.length,
    aguardando: counts?.aguardando ?? byStatus.aguardando.length,
    andamento: counts?.andamento ?? byStatus.andamento.length,
    concluida: counts?.concluida ?? byStatus.concluida.length,
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <StitchPageHeader
        title="Produção"
        description="Acompanhe ordens de produção no kanban por status."
        actions={
          <Badge variant="outline" className="gap-1">
            <Factory className="h-3.5 w-3.5" />
            Kanban
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StitchKpiCard label="Total de OPs" value={String(kpis.total)} tone="primary" solid />
        <StitchKpiCard label="Aguardando" value={String(kpis.aguardando)} tone="accent" solid />
        <StitchKpiCard label="Em andamento" value={String(kpis.andamento)} tone="warning" solid />
        <StitchKpiCard label="Concluídas" value={String(kpis.concluida)} tone="success" solid />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar OS, cliente ou funcionário…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando ordens…
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Erro ao carregar ordens de produção.</p>
          <button type="button" className="mt-2 text-sm underline" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <section className="flex-1 overflow-x-auto pb-4">
          <div className="flex h-full min-h-[480px] gap-4">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={byStatus[status]}
                count={byStatus[status].length}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
