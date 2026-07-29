"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ProductionOrderStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { useProductionOrders } from "@/hooks/useProductionOrders";
import type { ProductionOrderDto } from "@/lib/mappers/productionOrder";
import {
  KANBAN_COLUMNS,
  productionOrderColumnDotClass,
  productionOrderDisplayNumber,
  productionOrderProgressPercent,
  productionOrderStatusLabel,
  productionOrderStatusBadgeClass,
} from "@/lib/productionOrderLabels";
import { cn } from "@/components/ui/utils";
import {
  CalendarDays,
  CheckCircle2,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Table2,
} from "lucide-react";

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function bodyDescription(order: ProductionOrderDto): string {
  const q = order.quote;
  if (!q) return "—";
  const model = q.bodyModelName ?? "Carroceria";
  return `${model} ${q.lengthM}×${q.widthM}×${q.heightM}m`;
}

const BAR_CLASS: Record<ProductionOrderStatus, string> = {
  aguardando: "bg-slate-300",
  andamento: "bg-primary",
  concluida: "bg-[#16a34a]",
  cancelada: "bg-slate-300",
};

const AVATAR_TINT = ["bg-secondary text-primary", "bg-[#e2e8f8] text-accent", "bg-[#dce2f3] text-[#0a1a3d]"];

function EmployeeAvatars({ order }: { order: ProductionOrderDto }) {
  const emps = order.employees ?? [];
  if (emps.length === 0) {
    return <span className="text-[11px] text-muted-foreground">Sem equipe</span>;
  }
  const shown = emps.slice(0, 3);
  const extra = emps.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((e, i) => (
        <span
          key={e.id}
          title={e.name}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-medium",
            AVATAR_TINT[i % AVATAR_TINT.length],
          )}
        >
          {initials(e.name)}
        </span>
      ))}
      {extra > 0 ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-muted text-[10px] font-medium text-muted-foreground">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function KanbanCard({ order }: { order: ProductionOrderDto }) {
  const progress = productionOrderProgressPercent(order.status);
  const isActive = order.status === "andamento";
  const isDone = order.status === "concluida";
  const showPercent = isActive || isDone;

  return (
    <Link
      href={`/producao/${order.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5",
        isActive && "border-l-4 border-l-primary",
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
          {productionOrderDisplayNumber(order)}
        </span>
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-[#16a34a]" aria-label="Concluída" />
        ) : (
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </div>
      <h4 className="mb-0.5 text-[15px] font-medium leading-tight text-foreground">
        {order.quote?.clientName ?? "Cliente"}
      </h4>
      <p className="mb-4 text-[12px] text-muted-foreground">{bodyDescription(order)}</p>
      <div className="mb-3 flex items-center justify-between">
        <EmployeeAvatars order={order} />
        {showPercent ? (
          <span className={cn("text-[12px] font-medium", isDone ? "text-[#16a34a]" : "text-primary")}>{progress}%</span>
        ) : (
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {formatShortDate(order.createdAt)}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-all", BAR_CLASS[order.status])} style={{ width: `${progress}%` }} />
      </div>
    </Link>
  );
}

const DOT_CLASS: Record<ProductionOrderStatus, string> = {
  aguardando: "bg-slate-400",
  andamento: "bg-primary",
  concluida: "bg-[#16a34a]",
  cancelada: "bg-[#dc2626]",
};

function KanbanColumn({ status, orders }: { status: ProductionOrderStatus; orders: ProductionOrderDto[] }) {
  return (
    <div className="flex h-full min-h-0 w-[300px] shrink-0 flex-col rounded-2xl bg-muted/60 p-3">
      <div className="mb-3 flex items-center gap-2 px-1.5">
        <span className={cn("h-2 w-2 rounded-full", DOT_CLASS[status])} />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
          {productionOrderStatusLabel(status)}
        </h3>
        <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          {String(orders.length).padStart(2, "0")}
        </span>
        {status === "aguardando" ? (
          <Link
            href="/orcamentos"
            title="Novas ordens nascem de orçamentos aprovados"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-card"
          >
            <Plus className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 pb-2 no-scrollbar">
        {orders.map((order) => (
          <KanbanCard key={order.id} order={order} />
        ))}
        {orders.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-muted-foreground">Nenhuma ordem</p>
        ) : null}
      </div>
    </div>
  );
}

function ProducaoTabela({ orders }: { orders: ProductionOrderDto[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-left text-[12px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">OS</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Modelo</th>
            <th className="px-4 py-3 font-medium">Equipe</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Progresso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-muted/50">
              <td className="px-4 py-3">
                <Link href={`/producao/${o.id}`} className="font-medium text-primary hover:underline">
                  {productionOrderDisplayNumber(o)}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">{o.quote?.clientName ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{bodyDescription(o)}</td>
              <td className="px-4 py-3 text-muted-foreground">{(o.employees ?? []).length || "—"}</td>
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", productionOrderStatusBadgeClass(o.status))}>
                  {productionOrderStatusLabel(o.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{productionOrderProgressPercent(o.status)}%</td>
            </tr>
          ))}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma ordem de produção.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function ProducaoKanban() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "tabela">("kanban");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const { data: orders, isLoading, isError, refetch } = useProductionOrders();

  const filtered = useMemo(() => {
    const list = orders ?? [];
    if (!deferredSearch) return list;
    return list.filter((o) => {
      const num = productionOrderDisplayNumber(o).toLowerCase();
      const client = (o.quote?.clientName ?? "").toLowerCase();
      const emp = (o.employees ?? []).some((e) => e.name.toLowerCase().includes(deferredSearch));
      return num.includes(deferredSearch) || client.includes(deferredSearch) || emp;
    });
  }, [orders, deferredSearch]);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((s) => [s, [] as ProductionOrderDto[]])) as Record<
      ProductionOrderStatus,
      ProductionOrderDto[]
    >;
    for (const o of filtered) map[o.status]?.push(o);
    return map;
  }, [filtered]);

  const activeCount = byStatus.andamento.length;
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
  }, [orders]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl pl-10"
            placeholder="Buscar OS, cliente ou funcionário…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              view === "kanban" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" /> Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("tabela")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              view === "tabela" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Table2 className="h-4 w-4" /> Tabela
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando ordens…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Erro ao carregar ordens de produção.</p>
          <button type="button" className="mt-2 text-sm underline" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : view === "kanban" ? (
        <section className="min-h-0 flex-1 overflow-x-auto pb-2">
          <div className="flex h-full gap-4">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn key={status} status={status} orders={byStatus[status]} />
            ))}
          </div>
        </section>
      ) : (
        <section className="flex-1">
          <ProducaoTabela orders={filtered} />
        </section>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Sistema online · {activeCount} OS em processamento
        </span>
        <span suppressHydrationWarning>Última atualização: {lastUpdate ?? "—"}</span>
      </div>

      <Link
        href="/orcamentos"
        title="Novas ordens nascem de orçamentos aprovados"
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
