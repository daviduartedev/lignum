"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarRange,
  Car,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { useClients } from "@/hooks/useClients";
import { usePayables } from "@/hooks/usePayables";
import { usePromissoryNotes } from "@/hooks/usePromissoryNotes";
import { useSales } from "@/hooks/useSales";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useVehicles } from "@/hooks/useVehicles";
import type { Client, PromissoryNote, Sale, Supplier, Vehicle } from "@/types";
import { clientAttrs, vehicleAttrs, vehicleDaysInStock, vehicleDisplayName } from "@/types";
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
    disponivel: "Disponivel",
    reservado: "Reservado",
    vendido: "Vendido",
    repasse: "Repasse",
    removido: "Removido",
    standby_nao_compra: "Standby",
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
  Vendas: {
    icon: ShoppingBag,
    iconBg: "bg-blue-100 ring-blue-300/90",
    iconColor: "text-blue-600",
    topBorder: "border-t-blue-600",
    cardTint: "bg-blue-50/50",
  },
  "Lucro estimado": {
    icon: TrendingUp,
    iconBg: "bg-emerald-100 ring-emerald-300/90",
    iconColor: "text-emerald-600",
    topBorder: "border-t-emerald-600",
    cardTint: "bg-emerald-50/50",
  },
  Recebido: {
    icon: CheckCircle2,
    iconBg: "bg-teal-100 ring-teal-300/90",
    iconColor: "text-teal-600",
    topBorder: "border-t-teal-600",
    cardTint: "bg-teal-50/50",
  },
  Pago: {
    icon: Wallet,
    iconBg: "bg-slate-100 ring-slate-300/90",
    iconColor: "text-slate-600",
    topBorder: "border-t-slate-500",
    cardTint: "bg-slate-50/50",
  },
  "A receber": {
    icon: ArrowDownCircle,
    iconBg: "bg-amber-100 ring-amber-300/90",
    iconColor: "text-amber-600",
    topBorder: "border-t-amber-500",
    cardTint: "bg-amber-50/50",
  },
  "A pagar": {
    icon: ArrowUpCircle,
    iconBg: "bg-rose-100 ring-rose-300/90",
    iconColor: "text-rose-600",
    topBorder: "border-t-rose-600",
    cardTint: "bg-rose-50/50",
  },
  "Estoque investido": {
    icon: Car,
    iconBg: "bg-indigo-100 ring-indigo-300/90",
    iconColor: "text-indigo-600",
    topBorder: "border-t-indigo-600",
    cardTint: "bg-indigo-50/50",
  },
};

const REPORT_THEMES: Record<string, VisualTheme> = {
  "Vendas do periodo": KPI_THEMES.Vendas,
  "Contas a receber": KPI_THEMES["A receber"],
  "Recebido no periodo": KPI_THEMES.Recebido,
  "Contas a pagar": KPI_THEMES["A pagar"],
  "Pago no periodo": KPI_THEMES.Pago,
  "Estoque atual": KPI_THEMES["Estoque investido"],
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

const MONEY_COLUMNS = new Set([
  "Valor",
  "Valor venda",
  "Lucro estimado",
  "Custo total",
  "Preco venda",
  "Margem potencial",
]);

const STATUS_BADGE: Record<string, string> = {
  Aberta: "bg-sky-100 text-sky-800 border-sky-200",
  Vencida: "bg-rose-100 text-rose-800 border-rose-200",
  Paga: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelada: "bg-slate-100 text-slate-600 border-slate-200",
  Disponivel: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Reservado: "bg-amber-100 text-amber-800 border-amber-200",
  Vendido: "bg-sky-100 text-sky-800 border-sky-200",
  Repasse: "bg-slate-100 text-slate-700 border-slate-200",
  Removido: "bg-red-100 text-red-800 border-red-200",
  Standby: "bg-orange-100 text-orange-800 border-orange-200",
};

function diasEstoqueBadgeClass(dias: number) {
  if (dias > 60) return "bg-rose-100 text-rose-800 border-rose-200";
  if (dias > 45) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function isNegativeMoney(value: string) {
  return value.includes("-") || value.includes("−");
}

function dateChipClass(column: string) {
  if (column === "Cadastro") return "bg-blue-50 text-blue-800 border-blue-200";
  return "bg-sky-50 text-sky-800 border-sky-200";
}

const DATE_COLUMNS = new Set(["Cadastro", "Data", "Vencimento", "Entrada"]);

function looksLikePtDate(value: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
}

function ReportCell({ column, value, compact }: { column: string; value: CsvValue; compact?: boolean }) {
  const text = String(value ?? "-");
  if (text === "-") return <span className="text-muted-foreground">—</span>;

  if (column === "Placa") {
    const plate = text.trim();
    if (!plate || plate === "-") {
      return <span className="text-muted-foreground">—</span>;
    }
    return <MercosulPlate plate={plate} />;
  }

  if (column === "Status" && STATUS_BADGE[text]) {
    return (
      <Badge variant="outline" className={`text-[10px] font-semibold ${STATUS_BADGE[text]}`}>
        {text}
      </Badge>
    );
  }

  if (DATE_COLUMNS.has(column)) {
    return (
      <Badge variant="outline" className={`text-[10px] font-semibold tabular-nums ${dateChipClass(column)}`}>
        {text}
      </Badge>
    );
  }

  if (column === "Dias estoque") {
    const dias = Number(text);
    if (Number.isFinite(dias)) {
      return (
        <Badge variant="outline" className={`tabular-nums text-[10px] font-semibold ${diasEstoqueBadgeClass(dias)}`}>
          {dias}d
        </Badge>
      );
    }
  }

  if (MONEY_COLUMNS.has(column)) {
    const negative = isNegativeMoney(text);
    return (
      <span className={`font-semibold tabular-nums ${negative ? "text-rose-700" : "text-emerald-700"}`}>{text}</span>
    );
  }

  if (column === "Nome" || column === "Fornecedor") {
    const maxW = compact ? "max-w-[88px]" : "max-w-[140px]";
    const isSupplier = column === "Fornecedor";
    const initial = text.charAt(0).toUpperCase();
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            isSupplier ? "bg-slate-200 text-slate-800 ring-1 ring-slate-300/80" : "bg-blue-200 text-blue-900 ring-1 ring-blue-300/80"
          }`}
        >
          {initial}
        </span>
        <span className={`truncate font-semibold text-foreground ${maxW}`} title={text}>
          {text}
        </span>
      </span>
    );
  }

  if (column === "Documento") {
    const digits = text.replace(/\D/g, "");
    const isCnpj = digits.length > 11;
    return (
      <Badge
        variant="outline"
        className={`font-mono text-[10px] font-semibold ${
          isCnpj ? "border-violet-200 bg-violet-50 text-violet-800" : "border-blue-200 bg-blue-50 text-blue-800"
        }`}
      >
        {text}
      </Badge>
    );
  }

  if (column === "Email") {
    return (
      <span className="block max-w-[140px] truncate text-xs font-medium text-indigo-700" title={text}>
        {text}
      </span>
    );
  }

  if (column === "Telefone") {
    return (
      <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] font-semibold text-teal-800">
        {text}
      </Badge>
    );
  }

  if (column === "Cliente" || column === "Veiculo" || column === "Descricao") {
    const maxW = compact ? "max-w-[88px]" : "max-w-[160px]";
    return (
      <span className={`block truncate font-medium text-foreground ${maxW}`} title={text}>
        {text}
      </span>
    );
  }

  if (column === "Parcela") {
    return <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-800">{text}</span>;
  }

  if (column === "Pagamento") {
    if (looksLikePtDate(text)) {
      return (
        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[10px] font-semibold tabular-nums text-sky-800">
          {text}
        </Badge>
      );
    }
    const payColors: Record<string, string> = {
      pix: "bg-emerald-50 text-emerald-800 border-emerald-200",
      a_vista: "bg-sky-50 text-sky-800 border-sky-200",
      financiamento: "bg-indigo-50 text-indigo-800 border-indigo-200",
      cartao: "bg-violet-50 text-violet-800 border-violet-200",
      troca: "bg-amber-50 text-amber-800 border-amber-200",
      promissoria: "bg-orange-50 text-orange-800 border-orange-200",
    };
    const key = text.toLowerCase().replace(/\s+/g, "_");
    const cls = payColors[key] ?? "bg-slate-50 text-slate-700 border-slate-200";
    return (
      <Badge variant="outline" className={`text-[10px] font-semibold capitalize ${cls}`}>
        {text.replace(/_/g, " ")}
      </Badge>
    );
  }

  return <span className="truncate text-foreground">{text}</span>;
}

function ReportTable({
  title,
  rows,
  layout = "default",
}: {
  title: string;
  rows: CsvRow[];
  layout?: "default" | "wide" | "compact";
}) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const theme = REPORT_THEMES[title] ?? KPI_THEMES.Vendas;
  const Icon = theme.icon;
  const compact = layout === "compact";
  const textSize = compact ? "text-xs" : "text-sm";
  const accentBorder = theme.topBorder.replace("border-t-", "border-l-");

  return (
    <Card
      className={`overflow-hidden border border-border/80 border-t-4 ${theme.topBorder} shadow-sm ${theme.cardTint}`}
    >
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
            <table className={`w-full table-fixed ${textSize}`}>
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
                  <tr
                    key={rowIndex}
                    className={`border-b border-border/30 transition-colors hover:bg-white/70 ${
                      rowIndex % 2 === 1 ? "bg-white/45" : "bg-card"
                    }`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column}
                        className={`px-2 py-2 sm:px-2.5 sm:py-2.5 ${
                          colIndex === 0 ? `border-l-2 ${accentBorder}` : ""
                        }`}
                      >
                        <ReportCell column={column} value={row[column]} compact={compact} />
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

  const { data: salesData = [], isLoading: loadingSales } = useSales();
  const { data: vehiclesData = [], isLoading: loadingVehicles } = useVehicles();
  const { data: clientsData = [], isLoading: loadingClients } = useClients();
  const { data: suppliersData = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: promissoryData = [], isLoading: loadingPromissory } = usePromissoryNotes();
  const { data: payablesData = [], isLoading: loadingPayables } = usePayables();

  const loading =
    loadingSales || loadingVehicles || loadingClients || loadingSuppliers || loadingPromissory || loadingPayables;

  const report = useMemo(() => {
    const sales = salesData as Sale[];
    const vehicles = vehiclesData as Vehicle[];
    const clients = clientsData as Client[];
    const suppliers = suppliersData as Supplier[];
    const notes = promissoryData as PromissoryNote[];
    const payables = payablesData as PayableRow[];

    const salesInRange = sales.filter((sale) => inRange(sale.attributes.sale_date, startDate, endDate));
    const clientsInRange = clients.filter((client) => inRange(clientAttrs(client).createdAt, startDate, endDate));
    const suppliersInRange = suppliers.filter((supplier) =>
      inRange(supplier.attributes.createdAt, startDate, endDate),
    );

    const payablesDue = payables.filter((item) =>
      ["aberta", "vencida"].includes(item.status) && inRange(item.dueDate, startDate, endDate),
    );
    const payablesPaid = payables.filter((item) => item.status === "paga" && inRange(item.paymentDate || item.dueDate, startDate, endDate));
    const receivablesDue = notes.filter((item) =>
      ["aberta", "vencida"].includes(item.attributes.status) && inRange(item.attributes.due_date, startDate, endDate),
    );
    const receivablesPaid = notes.filter((item) =>
      item.attributes.status === "paga" && inRange(item.attributes.payment_date || item.attributes.due_date, startDate, endDate),
    );

    const salesRows = salesInRange.map((sale) => {
      const a = sale.attributes;
      const vehicle = a.vehicle?.data;
      const client = a.client?.data;
      const va = vehicle ? vehicleAttrs(vehicle) : null;
      const finalPrice = Number(a.final_price) || 0;
      const cost = va ? (Number(va.purchase_price) || 0) + (Number(va.estimated_maintenance_cost) || 0) : 0;
      return {
        Data: formatDate(a.sale_date),
        Cliente: client ? clientAttrs(client).full_name : "-",
        Veiculo: vehicle ? vehicleDisplayName(vehicle) : "-",
        Placa: va?.plate || "-",
        Vendedor: a.seller_name || "-",
        Pagamento: a.payment_method || "-",
        "Valor venda": money(finalPrice),
        "Lucro estimado": money(finalPrice - cost),
      };
    });

    const vehicleRows = vehicles.map((vehicle) => {
      const a = vehicleAttrs(vehicle);
      const purchase = Number(a.purchase_price) || 0;
      const selling = Number(a.selling_price) || 0;
      const maintenance = Number(a.estimated_maintenance_cost) || 0;
      return {
        Status: statusLabel(a.status),
        Veiculo: vehicleDisplayName(vehicle),
        Placa: a.plate || "-",
        Entrada: formatDate(a.purchase_entry_at || a.createdAt),
        "Dias estoque": vehicleDaysInStock(vehicle),
        "Custo total": money(purchase + maintenance),
        "Preco venda": selling ? money(selling) : "-",
        "Margem potencial": selling ? money(selling - purchase - maintenance) : "-",
      };
    });

    const payableRows = payablesDue.map((item) => ({
      Vencimento: formatDate(item.dueDate),
      Descricao: item.description,
      Origem: item.origin,
      Status: statusLabel(item.status),
      Valor: money(Number(item.amount) || 0),
      Observacoes: item.notes || "-",
    }));

    const paidRows = payablesPaid.map((item) => ({
      Pagamento: formatDate(item.paymentDate || item.dueDate),
      Vencimento: formatDate(item.dueDate),
      Descricao: item.description,
      Origem: item.origin,
      Valor: money(Number(item.amount) || 0),
    }));

    const receivableRows = receivablesDue.map((item) => {
      const a = item.attributes;
      const client = a.client?.data;
      const vehicle = a.vehicle?.data;
      return {
        Vencimento: formatDate(a.due_date),
        Cliente: client ? clientAttrs(client).full_name : "-",
        Veiculo: vehicle ? vehicleDisplayName(vehicle) : "-",
        Parcela: `${a.installment_number}/${a.total_installments}`,
        Status: statusLabel(a.status),
        Valor: money(Number(a.amount) || 0),
      };
    });

    const receivedRows = receivablesPaid.map((item) => {
      const a = item.attributes;
      const client = a.client?.data;
      const vehicle = a.vehicle?.data;
      return {
        Pagamento: formatDate(a.payment_date || a.due_date),
        Cliente: client ? clientAttrs(client).full_name : "-",
        Veiculo: vehicle ? vehicleDisplayName(vehicle) : "-",
        Parcela: `${a.installment_number}/${a.total_installments}`,
        Valor: money(Number(a.amount) || 0),
      };
    });

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

    const revenue = salesInRange.reduce((acc, sale) => acc + (Number(sale.attributes.final_price) || 0), 0);
    const salesCost = salesInRange.reduce((acc, sale) => {
      const vehicle = sale.attributes.vehicle?.data;
      const a = vehicle ? vehicleAttrs(vehicle) : null;
      return acc + (a ? (Number(a.purchase_price) || 0) + (Number(a.estimated_maintenance_cost) || 0) : 0);
    }, 0);
    const payableTotal = payablesDue.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const paidTotal = payablesPaid.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const receivableTotal = receivablesDue.reduce((acc, item) => acc + (Number(item.attributes.amount) || 0), 0);
    const receivedTotal = receivablesPaid.reduce((acc, item) => acc + (Number(item.attributes.amount) || 0), 0);
    const inventoryCost = vehicles.reduce((acc, vehicle) => {
      const a = vehicleAttrs(vehicle);
      if (["vendido", "removido"].includes(String(a.status))) return acc;
      return acc + (Number(a.purchase_price) || 0) + (Number(a.estimated_maintenance_cost) || 0);
    }, 0);

    return {
      summary: {
        revenue,
        profit: revenue - salesCost,
        payableTotal,
        paidTotal,
        receivableTotal,
        receivedTotal,
        inventoryCost,
        salesCount: salesInRange.length,
      },
      rows: {
        salesRows,
        vehicleRows,
        payableRows,
        paidRows,
        receivableRows,
        receivedRows,
        clientRows,
        supplierRows,
      },
    };
  }, [clientsData, endDate, payablesData, promissoryData, salesData, startDate, suppliersData, vehiclesData]);

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
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Carregando dados dos relatorios...</p>
      </div>
    );
  }

  const summaryCards: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Vendas", value: money(report.summary.revenue), sub: `${report.summary.salesCount} venda(s)` },
    { label: "Lucro estimado", value: money(report.summary.profit) },
    { label: "Recebido", value: money(report.summary.receivedTotal) },
    { label: "Pago", value: money(report.summary.paidTotal) },
    { label: "A receber", value: money(report.summary.receivableTotal) },
    { label: "A pagar", value: money(report.summary.payableTotal) },
    { label: "Estoque investido", value: money(report.summary.inventoryCost) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">
            Visao consolidada da operacao, financeiro, estoque, clientes e fornecedores.
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
            <p className="text-xs text-muted-foreground">Filtre vendas, financeiro e cadastros pelo intervalo selecionado.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="reportStart" className="text-sm font-semibold text-foreground">
              Data inicial
            </Label>
            <DatePickerField
              id="reportStart"
              value={startDate}
              onChange={setStartDate}
              placeholder="Selecione a data inicial"
              className="[&_button]:h-11 [&_button]:border-sky-200 [&_button]:bg-white [&_button]:text-base [&_button]:font-semibold [&_button]:text-foreground [&_button]:shadow-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reportEnd" className="text-sm font-semibold text-foreground">
              Data final
            </Label>
            <DatePickerField
              id="reportEnd"
              value={endDate}
              onChange={setEndDate}
              placeholder="Selecione a data final"
              className="[&_button]:h-11 [&_button]:border-sky-200 [&_button]:bg-white [&_button]:text-base [&_button]:font-semibold [&_button]:text-foreground [&_button]:shadow-sm"
            />
          </div>
        </div>
      </Card>

      <div>
        <SectionHeader title="Resumo do periodo" description="Indicadores agregados conforme o filtro de datas acima." />
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map(({ label, value, sub }) => {
            const theme = KPI_THEMES[label] ?? KPI_THEMES.Vendas;
            const Icon = theme.icon;
            return (
              <Card
                key={label}
                className={`border border-border/80 border-t-4 ${theme.topBorder} p-4 shadow-sm transition-shadow hover:shadow-md ${theme.cardTint}`}
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
          <SectionHeader title="Comercial" description="Vendas e margem estimada no intervalo." />
          <ReportTable title="Vendas do periodo" rows={report.rows.salesRows} />
        </div>

        <div className="space-y-4">
          <SectionHeader title="Financeiro" description="Contas a receber/pagar e movimentacao no periodo." />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <ReportTable title="Contas a receber" rows={report.rows.receivableRows} layout="wide" />
            </div>
            <div className="xl:col-span-5">
              <ReportTable title="Recebido no periodo" rows={report.rows.receivedRows} layout="compact" />
            </div>
            <div className="xl:col-span-7">
              <ReportTable title="Contas a pagar" rows={report.rows.payableRows} layout="wide" />
            </div>
            <div className="xl:col-span-5">
              <ReportTable title="Pago no periodo" rows={report.rows.paidRows} layout="compact" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Estoque" description="Posicao atual de veiculos e custos investidos." />
          <ReportTable title="Estoque atual" rows={report.rows.vehicleRows} layout="wide" />
        </div>

        <div className="space-y-4">
          <SectionHeader title="Cadastros" description="Novos clientes e fornecedores no periodo." />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportTable title="Clientes cadastrados" rows={report.rows.clientRows} layout="wide" />
            <ReportTable title="Fornecedores cadastrados" rows={report.rows.supplierRows} layout="wide" />
          </div>
        </div>
      </div>
    </div>
  );
}
