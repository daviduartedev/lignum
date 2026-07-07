"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Loader2, MoreVertical } from "lucide-react";
import { PAINEL_MOCK_QUOTES } from "@/components/painel/painelMockData";
import { useQuotesPage } from "@/hooks/useQuotes";
import { formatBRL } from "@/lib/pdf/format";
import { quoteAttrs, type Quote, type QuoteStatus } from "@/types/quotes";
import { cn } from "@/components/ui/utils";

type QuoteRow = {
  initials: string;
  client: string;
  model: string;
  value: string;
  status: string;
  statusClass: string;
  date: string;
  href?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatQuoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function statusDisplay(status: QuoteStatus): { label: string; className: string } {
  if (status === "aprovado" || status === "convertido") {
    return { label: "Aprovado", className: "bg-green-100 text-green-700" };
  }
  if (status === "enviado") {
    return { label: "Em Análise", className: "bg-blue-100 text-blue-700" };
  }
  if (status === "rascunho") {
    return { label: "Pendente", className: "bg-orange-100 text-orange-700" };
  }
  return { label: "Recusado", className: "bg-red-100 text-red-700" };
}

function mapQuote(q: Quote): QuoteRow {
  const a = quoteAttrs(q);
  const client = a.client?.data?.attributes.full_name ?? "Cliente";
  const model = a.body_model?.data?.attributes.name ?? "Carroceria paramétrica";
  const st = statusDisplay(a.status);
  const routeId = q.documentId ?? String(q.id);
  return {
    initials: initialsFromName(client),
    client,
    model,
    value: formatBRL(a.total),
    status: st.label,
    statusClass: st.className,
    date: formatQuoteDate(a.createdAt),
    href: `/orcamentos/${routeId}`,
  };
}

export function PainelRecentQuotesTable() {
  const { data, isLoading } = useQuotesPage(1, { pageSize: 4 });

  const rows = useMemo<QuoteRow[]>(() => {
    const items = data?.items ?? [];
    if (items.length > 0) return items.slice(0, 4).map(mapQuote);
    return PAINEL_MOCK_QUOTES.map((r) => ({ ...r }));
  }, [data?.items]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="text-lg font-semibold text-foreground">Últimos Orçamentos</h3>
        <Link href="/orcamentos" className="text-sm font-medium text-secondary-foreground hover:underline">
          Ver todos
        </Link>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando…
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-muted/40">
              <tr>
                {["Cliente", "Modelo", "Valor", "Status", "Data", ""].map((h, i) => (
                  <th
                    key={h || "actions"}
                    className={cn(
                      "px-6 py-4 text-xs font-medium uppercase text-muted-foreground",
                      i === 5 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={`${row.client}-${row.date}`} className="group transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary/30 text-xs font-bold text-secondary-foreground">
                        {row.initials}
                      </div>
                      {row.href ? (
                        <Link href={row.href} className="text-sm font-medium hover:text-primary">
                          {row.client}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{row.client}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{row.model}</td>
                  <td className="px-6 py-4 text-sm font-semibold tabular-nums">{row.value}</td>
                  <td className="px-6 py-4">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-medium", row.statusClass)}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm tabular-nums text-muted-foreground">{row.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                      aria-label="Mais opções"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
