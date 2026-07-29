"use client";

import Link from "next/link";
import Image from "next/image";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { UsedBodyStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { StitchKpiCard, StitchPageHeader } from "@/components/ui/stitch";
import { useUsedBodiesPage, useUsedBodyStatusCounts } from "@/hooks/useUsedBodies";
import { formatBRL } from "@/lib/pdf/format";
import {
  formatUsedBodyMeasures,
  usedBodyConditionDotClass,
  usedBodyConditionLabel,
  usedBodyStatusBadgeClass,
  usedBodyStatusLabel,
} from "@/lib/usedBodyLabels";
import { cn } from "@/components/ui/utils";
import { ImageIcon, Loader2, Pencil, Plus, Search, Truck } from "lucide-react";

const STATUS_FILTERS: Array<{ value: UsedBodyStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "disponivel", label: "Disponível" },
  { value: "reservada", label: "Reservada" },
  { value: "vendida", label: "Vendida" },
  { value: "em_reforma", label: "Em reforma" },
];

export function CarroceriasUsadasLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UsedBodyStatus | "all">("all");
  const deferredSearch = useDeferredValue(search.trim());

  const { data: counts } = useUsedBodyStatusCounts();
  const { data, isLoading, isError, refetch } = useUsedBodiesPage(page, {
    q: deferredSearch,
    status: statusFilter === "all" ? undefined : statusFilter,
    pageSize: 12,
  });

  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const items = data?.items ?? [];

  const kpis = useMemo(
    () => ({
      total: counts?.total ?? meta?.total ?? items.length,
      disponivel: counts?.disponivel ?? 0,
      reservada: counts?.reservada ?? 0,
      vendida: counts?.vendida ?? 0,
    }),
    [counts, meta?.total, items.length],
  );

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Carrocerias Usadas"
        description="Gerencie o catálogo de carrocerias seminovas e usadas disponíveis em estoque."
        actions={
          <Button asChild>
            <Link href="/carrocerias-usadas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova carroceria usada
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StitchKpiCard label="Total em catálogo" value={String(kpis.total)} tone="primary" solid />
        <StitchKpiCard label="Disponíveis" value={String(kpis.disponivel)} tone="success" solid />
        <StitchKpiCard label="Reservadas" value={String(kpis.reservada)} tone="warning" solid />
        <StitchKpiCard label="Vendidas" value={String(kpis.vendida)} tone="accent" solid />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f.value
                  ? "border-primary bg-secondary text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          Não foi possível carregar as carrocerias.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhuma carroceria usada encontrada.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const routeId = item.documentId ?? String(item.id);
            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
              >
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  {item.mainPhotoUrl ? (
                    <Image
                      src={item.mainPhotoUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Truck className="h-12 w-12 opacity-40" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <Badge className={cn("shadow-sm", usedBodyStatusBadgeClass(item.status))}>
                      {usedBodyStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight text-foreground">{item.title}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">#{item.id}</span>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Medidas</p>
                      <p className="font-medium">{formatUsedBodyMeasures(item.lengthM, item.widthM, item.heightM)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", usedBodyConditionDotClass(item.condition))} />
                        <p className="font-medium">{usedBodyConditionLabel(item.condition)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor entrada</p>
                      <p className="font-medium tabular-nums">{formatBRL(item.entryValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor venda</p>
                      <p className="font-semibold tabular-nums text-secondary">
                        {item.saleValue != null ? formatBRL(item.saleValue) : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/carrocerias-usadas/${routeId}/editar`}>
                        Ver detalhes
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/carrocerias-usadas/${routeId}/editar`} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={meta.pageSize}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
