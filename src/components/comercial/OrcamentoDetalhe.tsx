"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StitchPageHeader, StitchSectionCard, StitchTableShell } from "@/components/ui/stitch";
import {
  listingTdStat,
  listingTdText,
  listingThStat,
  listingThText,
} from "@/components/ui/ListingStatCell";
import {
  useConvertQuote,
  useDeleteQuote,
  useQuote,
  useUpdateQuote,
} from "@/hooks/useQuotes";
import { formatBRL } from "@/lib/pdf/format";
import { quotePdfUrl, technicalSheetPdfUrl } from "@/services/internal/quotes";
import { cn } from "@/components/ui/utils";
import {
  COVER_STYLE_LABELS,
  FINISH_TYPE_LABELS,
  FLOOR_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
  quoteAttrs,
  type QuoteStatus,
} from "@/types/quotes";
import type { BomLine } from "@/lib/quotes/bomBuilder";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

function statusBadgeClass(s: QuoteStatus): string {
  if (s === "aprovado" || s === "convertido") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (s === "enviado") return "bg-[#DBEAFE] text-[#1D4ED8] border-0";
  if (s === "rascunho") return "bg-[#FEF9C3] text-[#A16207] border-0";
  return "bg-[#FEE2E2] text-[#B91C1C] border-0";
}

export function OrcamentoDetalhe({ routeId }: { routeId: string }) {
  const { data: quote, isLoading, isError } = useQuote(routeId);
  const updateMutation = useUpdateQuote();
  const convertMutation = useConvertQuote();
  const deleteMutation = useDeleteQuote();

  const a = quote ? quoteAttrs(quote) : null;
  const bom = useMemo(() => {
    const raw = a?.technical_sheet?.data?.attributes.bom;
    return Array.isArray(raw) ? (raw as BomLine[]) : [];
  }, [a?.technical_sheet?.data?.attributes.bom]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando orçamento…
      </div>
    );
  }

  if (isError || !quote || !a) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Orçamento não encontrado</AlertTitle>
        <AlertDescription>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/orcamentos">Voltar à lista</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const canEdit = a.status === "rascunho" || a.status === "enviado";
  const canApprove = a.status === "enviado";
  const canConvert = a.status === "aprovado" && !a.technical_sheet?.data;
  const isConverted = a.status === "convertido";

  return (
    <div className="space-y-6 max-w-[1200px]">
      <StitchPageHeader
        title={a.quote_number ?? `Orçamento #${quote.id}`}
        description={a.client?.data?.attributes.full_name ?? "Cliente"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/orcamentos">Lista</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={quotePdfUrl(routeId)} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                PDF orçamento
              </a>
            </Button>
            {isConverted ? (
              <Button variant="outline" asChild>
                <a href={technicalSheetPdfUrl(routeId)} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  PDF ficha técnica
                </a>
              </Button>
            ) : null}
            {a.status === "rascunho" ? (
              <Button
                onClick={() => updateMutation.mutate({ routeId, data: { status: "enviado" } })}
                disabled={updateMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            ) : null}
            {canApprove ? (
              <Button
                onClick={() => updateMutation.mutate({ routeId, data: { status: "aprovado" } })}
                disabled={updateMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            ) : null}
            {canConvert ? (
              <Button onClick={() => convertMutation.mutate(routeId)} disabled={convertMutation.isPending}>
                Gerar ficha técnica
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Excluir este orçamento?")) deleteMutation.mutate(routeId, { onSuccess: () => {} });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge className={cn("font-normal", statusBadgeClass(a.status))}>
          {QUOTE_STATUS_LABELS[a.status]}
        </Badge>
        <span className="inline-flex items-baseline gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm">
          <span className="text-xs font-medium text-primary-foreground/80">Total</span>
          <span className="text-2xl font-bold tabular-nums">{formatBRL(a.total)}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StitchSectionCard title="Especificação">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dimensões</dt>
              <dd>
                {a.length_m} × {a.width_m} × {a.height_m} m
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tampa</dt>
              <dd>{COVER_STYLE_LABELS[a.cover_style]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Assoalho</dt>
              <dd>{FLOOR_TYPE_LABELS[a.floor_type]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Acabamento</dt>
              <dd>{FINISH_TYPE_LABELS[a.finish_type]}</dd>
            </div>
            {a.payment_terms ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Pagamento</dt>
                <dd className="text-right max-w-[60%]">{a.payment_terms}</dd>
              </div>
            ) : null}
            {a.delivery_days != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Entrega</dt>
                <dd>{a.delivery_days} dias</dd>
              </div>
            ) : null}
          </dl>
        </StitchSectionCard>

        <StitchSectionCard title="Resumo financeiro">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatBRL(a.subtotal)}</dd>
            </div>
            {a.discount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd>- {formatBRL(a.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <dt>Total</dt>
              <dd className="text-primary">{formatBRL(a.total)}</dd>
            </div>
            {a.margin_percent != null ? (
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Margem estimada</dt>
                <dd>{a.margin_percent.toFixed(1)}%</dd>
              </div>
            ) : null}
          </dl>
        </StitchSectionCard>
      </div>

      <StitchSectionCard title="Itens do orçamento">
        <StitchTableShell>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className={listingThText}>Descrição</th>
                <th className={listingThStat}>Qtd</th>
                <th className={listingThStat}>Unit.</th>
                <th className={listingThStat}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(a.items ?? []).map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className={listingTdText}>{item.description}</td>
                  <td className={listingTdStat}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className={listingTdStat}>{formatBRL(item.unit_price)}</td>
                  <td className={listingTdStat}>{formatBRL(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </StitchTableShell>
      </StitchSectionCard>

      {bom.length > 0 ? (
        <StitchSectionCard title="Ficha técnica · lista de materiais (BOM)">
        <StitchTableShell>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className={listingThStat}>SKU</th>
                  <th className={listingThText}>Descrição</th>
                  <th className={listingThStat}>Qtd</th>
                  <th className={listingThStat}>Un</th>
                  <th className={listingThStat}>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((line, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className={listingTdStat}>{line.sku}</td>
                    <td className={listingTdText}>{line.description}</td>
                    <td className={listingTdStat}>{line.quantity}</td>
                    <td className={listingTdStat}>{line.unit}</td>
                    <td className={listingTdStat}>{line.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StitchTableShell>
        </StitchSectionCard>
      ) : null}

      {a.notes ? (
        <StitchSectionCard title="Observações">
          <p className="text-sm whitespace-pre-wrap">{a.notes}</p>
        </StitchSectionCard>
      ) : null}
    </div>
  );
}
