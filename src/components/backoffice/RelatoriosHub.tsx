"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpCircle,
  CalendarRange,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useClients } from "@/hooks/useClients";
import { usePayables } from "@/hooks/usePayables";
import { useQuotesPage } from "@/hooks/useQuotes";
import { useSuppliers } from "@/hooks/useSuppliers";
import type { Client, Supplier } from "@/types";
import { clientAttrs } from "@/types";
import type { Quote } from "@/types/quotes";
import { QUOTE_STATUS_LABELS, quoteAttrs } from "@/types/quotes";
import type { PayableRow } from "@/services/internal/payables";

type CsvValue = string | number | null | undefined;
type CsvRow = Record<string, CsvValue>;

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateIso = (date: Date) => date.toISOString().slice(0, 10);

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: string | null | undefined) => {
  const d = parseDate(value);
  return d ? d.toLocaleDateString("pt-BR") : "-";
};

const csvEscape = (value: CsvValue) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function downloadCsv(filename: string, rows: CsvRow[]) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    columns.join(";"),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function inRange(value: string | null | undefined, start: string, end: string) {
  const d = parseDate(value);
  if (!d) return false;
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T23:59:59`);
  return d >= from && d <= to;
}

function statusLabel(value: string | undefined) {
  const map: Record<string, string> = {
    aberta: "Aberta",
    vencida: "Vencida",
    paga: "Paga",
    cancelada: "Cancelada",
  };
  return map[value || ""] || value || "-";
}

type VisualTheme = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  topBorder: string;
  cardTint: string;
};

const KPI_THEMES: Record<string, VisualTheme> = {
  Orçamentos: {
    icon: ShoppingBag,
    iconBg: "bg-blue-100 ring-blue-300/90",
    iconColor: "text-blue-600",
    topBorder: "border-t-blue-600",
    cardTint: "bg-blue-50/50",
  },
  Pago: {
    icon: Wallet,
    iconBg: "bg-slate-100 ring-slate-300/90",
    iconColor: "text-slate-600",
    topBorder: "border-t-slate-500",
    cardTint: "bg-slate-50/50",
  },
  "A pagar": {
    icon: ArrowUpCircle,
    iconBg: "bg-rose-100 ring-rose-300/90",
    iconColor: "text-rose-600",
    topBorder: "border-t-rose-600",
    cardTint: "bg-rose-50/50",
  },
};

const REPORT_THEMES: Record<string, VisualTheme> = {
  "Orçamentos do periodo": KPI_THEMES.Orçamentos,
  "Contas a pagar": KPI_THEMES["A pagar"],
  "Pago no periodo": KPI_THEMES.Pago,
  "Clientes cadastrados": {
    icon: Users,
    iconBg: "bg-blue-100 ring-blue-300/90",
    iconColor: "text-blue-700",
    topBorder: "border-t-blue-500",
    cardTint: "bg-blue-50/40",
  },
  "Fornecedores cadastrados": {
    icon: Truck,
    iconBg: "bg-slate-100 ring-slate-300/90",
    iconColor: "text-slate-700",
    topBorder: "border-t-slate-500",
    cardTint: "bg-slate-50/60",
  },
};

function ReportTable({ title, rows }: { title: string; rows: CsvRow[] }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const theme = REPORT_THEMES[title] ?? KPI_THEMES.Orçamentos;
  const Icon = theme.icon;

  return (
    <Card className={`overflow-hidden border border-border/80 border-t-4 ${theme.topBorder} shadow-sm ${theme.cardTint}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/80 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`shrink-0 rounded-lg p-2 ring-1 ${theme.iconBg}`}>
            <Icon className={`h-5 w-5 ${theme.iconColor}`} aria-hidden />
          </div>
          <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-border/80 bg-white/80"
          onClick={() => downloadCsv(`${title.toLowerCase().replace(/\s+/g, "-")}.csv`, rows)}
          disabled={rows.length === 0}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV
        </Button>
      </div>
      <div className="p-4 pt-3 sm:p-5 sm:pt-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhum dado encontrado para o periodo.
          </p>
        ) : (
          <div className="max-h-[360px] overflow-y-auto overflow-x-hidden rounded-lg border border-border/60 bg-card">
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                <tr className={`border-b border-border/70 ${theme.topBorder.replace("border-t-", "border-b-")}`}>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="truncate px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-foreground/80 sm:px-2.5 sm:py-2.5"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/30">
                    {columns.map((column) => (
                      <td key={column} className="truncate px-2 py-2 sm:px-2.5 sm:py-2.5">
                        {String(row[column] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pt-1">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground/90">{description}</p>
    </div>
  );
}

export function RelatoriosHub() {
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const [startDate, setStartDate] = useState(dateIso(monthStart));
  const [endDate, setEndDate] = useState(dateIso(today));

  const { data: quotesPage, isLoading: loadingQuotes } = useQuotesPage(1, { pageSize: 500 });
  const { data: clientsData = [], isLoading: loadingClients } = useClients();
  const { data: suppliersData = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: payablesData = [], isLoading: loadingPayables } = usePayables();

  const loading = loadingQuotes || loadingClients || loadingSuppliers || loadingPayables;

  const report = useMemo(() => {
    const quotes = (quotesPage?.items ?? []) as Quote[];
    const clients = clientsData as Client[];
    const suppliers = suppliersData as Supplier[];
    const payables = payablesData as PayableRow[];

    const quotesInRange = quotes.filter((q) => inRange(quoteAttrs(q).createdAt, startDate, endDate));
    const clientsInRange = clients.filter((client) => inRange(clientAttrs(client).createdAt, startDate, endDate));
    const suppliersInRange = suppliers.filter((supplier) =>
      inRange(supplier.attributes.createdAt, startDate, endDate),
    );

    const payablesDue = payables.filter(
      (item) => ["aberta", "vencida"].includes(item.status) && inRange(item.dueDate, startDate, endDate),
    );
    const payablesPaid = payables.filter(
      (item) => item.status === "paga" && inRange(item.paymentDate || item.dueDate, startDate, endDate),
    );

    const quoteRows = quotesInRange.map((q) => {
      const a = quoteAttrs(q);
      return {
        Data: formatDate(a.createdAt),
        Numero: a.quote_number || "-",
        Status: QUOTE_STATUS_LABELS[a.status] ?? a.status,
        Total: money(Number(a.total) || 0),
      };
    });

    const payableRows = payablesDue.map((item) => ({
      Vencimento: formatDate(item.dueDate),
      Descricao: item.description,
      Origem: item.origin,
      Status: statusLabel(item.status),
      Valor: money(Number(item.amount) || 0),
    }));

    const paidRows = payablesPaid.map((item) => ({
      Pagamento: formatDate(item.paymentDate || item.dueDate),
      Descricao: item.description,
      Valor: money(Number(item.amount) || 0),
    }));

    const clientRows = clientsInRange.map((client) => {
      const a = clientAttrs(client);
      return {
        Cadastro: formatDate(a.createdAt),
        Nome: a.full_name,
        Documento: a.document,
        Email: a.email,
        Telefone: a.phone || "-",
      };
    });

    const supplierRows = suppliersInRange.map((supplier) => {
      const a = supplier.attributes;
      return {
        Cadastro: formatDate(a.createdAt),
        Fornecedor: a.company_name,
        Documento: a.document || "-",
        Email: a.email || "-",
        Telefone: a.phone || "-",
      };
    });

    const quoteTotal = quotesInRange.reduce((acc, q) => acc + (Number(quoteAttrs(q).total) || 0), 0);
    const payableTotal = payablesDue.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const paidTotal = payablesPaid.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    return {
      summary: {
        quoteTotal,
        quoteCount: quotesInRange.length,
        payableTotal,
        paidTotal,
      },
      rows: {
        quoteRows,
        payableRows,
        paidRows,
        clientRows,
        supplierRows,
      },
    };
  }, [clientsData, endDate, payablesData, quotesPage?.items, startDate, suppliersData]);

  const downloadComplete = () => {
    const sections: CsvRow[] = [];
    Object.entries(report.rows).forEach(([section, rows]) => {
      sections.push({ Relatorio: section });
      sections.push(...rows);
      sections.push({});
    });
    downloadCsv(`relatorios-${startDate}-a-${endDate}.csv`, sections);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando dados dos relatorios...</p>
      </div>
    );
  }

  const summaryCards = [
    { label: "Orçamentos", value: money(report.summary.quoteTotal), sub: `${report.summary.quoteCount} orçamento(s)` },
    { label: "Pago", value: money(report.summary.paidTotal) },
    { label: "A pagar", value: money(report.summary.payableTotal) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">
            Visao consolidada de orçamentos, financeiro, clientes e fornecedores.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="border-border/80 bg-card" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Visualizar/PDF
          </Button>
          <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={downloadComplete}>
            <Download className="mr-2 h-4 w-4" />
            Baixar completo
          </Button>
        </div>
      </div>

      <Card className="border border-border/80 border-t-4 border-t-sky-500 bg-sky-50/30 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-sky-100 p-2 ring-1 ring-sky-300/90">
            <CalendarRange className="h-5 w-5 text-sky-700" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Periodo do relatorio</h2>
            <p className="text-xs text-muted-foreground">Filtre orçamentos, financeiro e cadastros pelo intervalo selecionado.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="reportStart">Data inicial</Label>
            <DatePickerField id="reportStart" value={startDate} onChange={setStartDate} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reportEnd">Data final</Label>
            <DatePickerField id="reportEnd" value={endDate} onChange={setEndDate} />
          </div>
        </div>
      </Card>

      <div>
        <SectionHeader title="Resumo do periodo" description="Indicadores agregados conforme o filtro de datas acima." />
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map(({ label, value, sub }) => {
            const theme = KPI_THEMES[label] ?? KPI_THEMES.Orçamentos;
            const Icon = theme.icon;
            return (
              <Card
                key={label}
                className={`border border-border/80 border-t-4 ${theme.topBorder} p-4 shadow-sm ${theme.cardTint}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className={`rounded-lg p-2 ring-1 ${theme.iconBg}`}>
                    <Icon className={`h-4 w-4 ${theme.iconColor}`} aria-hidden />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                </div>
                <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
                {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <SectionHeader title="Comercial" description="Orçamentos no intervalo." />
          <ReportTable title="Orçamentos do periodo" rows={report.rows.quoteRows} />
        </div>

        <div className="space-y-4">
          <SectionHeader title="Financeiro" description="Contas a pagar e movimentacao no periodo." />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportTable title="Contas a pagar" rows={report.rows.payableRows} />
            <ReportTable title="Pago no periodo" rows={report.rows.paidRows} />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Cadastros" description="Novos clientes e fornecedores no periodo." />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportTable title="Clientes cadastrados" rows={report.rows.clientRows} />
            <ReportTable title="Fornecedores cadastrados" rows={report.rows.supplierRows} />
          </div>
        </div>
      </div>
    </div>
  );
}
