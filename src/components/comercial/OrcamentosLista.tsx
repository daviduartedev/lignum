"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import {
  listingTdActions,
  listingTdStat,
  listingTdText,
  listingThActions,
  listingThStat,
  listingThText,
} from "@/components/ui/ListingStatCell";
import { StitchKpiCard, StitchPageHeader, StitchSectionCard, StitchTableShell } from "@/components/ui/stitch";
import { useQuotesPage } from "@/hooks/useQuotes";
import { formatBRL } from "@/lib/pdf/format";
import { cn } from "@/components/ui/utils";
import {
  QUOTE_STATUS_LABELS,
  quoteAttrs,
  type Quote,
  type QuoteStatus,
} from "@/types/quotes";
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

function statusBadgeClass(s: QuoteStatus): string {
  if (s === "aprovado" || s === "convertido") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (s === "enviado") return "bg-[#DBEAFE] text-[#1D4ED8] border-0";
  if (s === "rascunho") return "bg-[#FEF9C3] text-[#A16207] border-0";
  return "bg-[#FEE2E2] text-[#B91C1C] border-0";
}

export function OrcamentosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data, isLoading, isError, refetch } = useQuotesPage(page, { q: deferredSearch });
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const rows = useMemo(() => {
    return (data?.items ?? []).map((q: Quote) => {
      const a = quoteAttrs(q);
      const routeId = q.documentId ?? String(q.id);
      return {
        routeId,
        number: a.quote_number ?? routeId,
        client: a.client?.data?.attributes.full_name ?? "-",
        total: a.total,
        status: a.status,
        updated: a.updatedAt
          ? new Date(a.updatedAt).toLocaleDateString("pt-BR")
          : "-",
      };
    });
  }, [data?.items]);

  const kpis = useMemo(() => {
    const items = data?.items ?? [];
    const byStatus = (s: QuoteStatus) => items.filter((q) => quoteAttrs(q).status === s).length;
    return {
      total: meta?.total ?? items.length,
      rascunho: byStatus("rascunho"),
      enviado: byStatus("enviado"),
      aprovado: byStatus("aprovado") + byStatus("convertido"),
    };
  }, [data?.items, meta?.total]);

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Orçamentos"
        description="Propostas comerciais de carroceria com cálculo paramétrico e geração de PDF."
        actions={
          <Button asChild>
            <Link href="/orcamentos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo orçamento
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StitchKpiCard label="Total" value={String(kpis.total)} icon={FileText} />
        <StitchKpiCard label="Rascunhos" value={String(kpis.rascunho)} />
        <StitchKpiCard label="Enviados" value={String(kpis.enviado)} />
        <StitchKpiCard label="Aprovados / convertidos" value={String(kpis.aprovado)} />
      </div>

      <StitchSectionCard title="Lista de orçamentos">
        <StitchTableShell
          toolbar={
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por número ou cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              Não foi possível listar os orçamentos.
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando orçamentos…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className={listingThStat}>Nº</th>
                    <th className={listingThText}>Cliente</th>
                    <th className={listingThStat}>Total</th>
                    <th className={listingThStat}>Status</th>
                    <th className={listingThStat}>Atualizado</th>
                    <th className={listingThActions} />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        Nenhum orçamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.routeId} className="border-b last:border-0 hover:bg-muted/30">
                        <td className={listingTdStat}>
                          <Link
                            href={`/orcamentos/${row.routeId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {row.number}
                          </Link>
                        </td>
                        <td className={listingTdText}>{row.client}</td>
                        <td className={listingTdStat}>{formatBRL(row.total)}</td>
                        <td className={listingTdStat}>
                          <Badge className={cn("font-normal", statusBadgeClass(row.status))}>
                            {QUOTE_STATUS_LABELS[row.status]}
                          </Badge>
                        </td>
                        <td className={listingTdStat}>{row.updated}</td>
                        <td className={listingTdActions}>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/orcamentos/${row.routeId}`}>Ver</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex justify-center">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </>
        )}
        </StitchTableShell>
      </StitchSectionCard>
    </div>
  );
}
