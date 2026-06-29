"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { usePromissoryNotesPage, usePromissorySummary } from "@/hooks/usePromissoryNotes";
import { Pagination } from "@/components/ui/pagination";
import { vehicleDisplayName } from "@/types";
import type { PromissoryNote, PromissoryNoteStatus, Vehicle } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function isPromissoryOverdue(due: string, status: PromissoryNoteStatus): boolean {
  if (status !== "aberta") return false;
  const d = new Date(due);
  return d < new Date(new Date().toDateString());
}

export function promissoryDisplayStatus(
  due: string,
  status: PromissoryNoteStatus,
): { label: string; className: string } {
  if (status === "paga") return { label: "Paga", className: "bg-[#DCFCE7] text-[#15803D] border-0" };
  if (status === "vencida" || isPromissoryOverdue(due, status))
    return { label: "Vencida", className: "bg-[#FEE2E2] text-[#B91C1C] border-0" };
  if (status === "cancelada") return { label: "Cancelada", className: "bg-[#F3F4F6] text-[#6B7280] border-0" };
  const d = new Date(due);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  if (d <= in7) return { label: "Vence em breve", className: "bg-[#FEF3C7] text-[#B45309] border-0" };
  return { label: "Em aberto", className: "bg-[#DBEAFE] text-[#1D4ED8] border-0" };
}

export function PromissoriasLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { data: pageData, isLoading, isError, refetch } = usePromissoryNotesPage(page, {
    q: deferredSearch,
    status: statusFilter,
  });
  const { data: summary } = usePromissorySummary();
  const rawList = pageData?.items ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const rows = useMemo(() => {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((p: PromissoryNote) => {
      const a = p.attributes;
      const vehicle = a.vehicle?.data;
      const client = a.client?.data;
      const cAttr = client ? client.attributes : null;
      const clienteNome = cAttr?.full_name || "-";
      const veiculoNome = vehicle ? vehicleDisplayName(vehicle) : "-";
      const id = String(p.documentId ?? p.id);
      const st = a.status || "aberta";
      const due = a.due_date || "";
      const disp = promissoryDisplayStatus(due, st);
      return {
        id,
        cliente: clienteNome,
        vehicle: vehicle as Vehicle | undefined,
        veiculo: veiculoNome,
        parcela: `${a.installment_number}/${a.total_installments}`,
        valor: Number(a.amount) || 0,
        vencimento: due ? new Date(due).toLocaleDateString("pt-BR") : "-",
        statusRaw: st,
        badge: disp,
        due,
      };
    });
  }, [rawList]);

  const resumo = {
    aberto: summary?.aberto ?? 0,
    vencido: summary?.vencido ?? 0,
    sete: summary?.sete ?? 0,
    recebidoMes: summary?.recebidoMes ?? 0,
  };

  const cards = [
    { label: "Total em aberto", valor: resumo.aberto, tipo: "pendente" as const },
    { label: "Vencidas (valor)", valor: resumo.vencido, tipo: "vencido" as const },
    { label: "Vencem em 7 dias", valor: resumo.sete, tipo: "atencao" as const },
    { label: "Recebido no mês", valor: resumo.recebidoMes, tipo: "ok" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">A Receber</h1>
          <p className="text-sm text-[#6B7280]">Parcelas e recebíveis (promissórias)</p>
        </div>
        <Link href="/financeiro?tab=receber">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo recebível
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((item, index) => {
          const Icon =
            item.tipo === "vencido"
              ? AlertCircle
              : item.tipo === "atencao"
                ? Clock
                : item.tipo === "ok"
                  ? CheckCircle
                  : DollarSign;
          return (
            <Card key={index} className="p-6 border border-[#E5E7EB]">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    item.tipo === "vencido"
                      ? "bg-red-50"
                      : item.tipo === "atencao"
                        ? "bg-amber-50"
                        : item.tipo === "ok"
                          ? "bg-green-50"
                          : "bg-blue-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      item.tipo === "vencido"
                        ? "text-red-600"
                        : item.tipo === "atencao"
                          ? "text-amber-600"
                          : item.tipo === "ok"
                            ? "text-green-600"
                            : "text-blue-600"
                    }`}
                  />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#111827] mb-1 tabular-nums">
                {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <div className="text-sm text-[#6B7280]">{item.label}</div>
            </Card>
          );
        })}
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro ao carregar promissórias</AlertTitle>
          <AlertDescription>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="border-red-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 border border-[#E5E7EB]">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              placeholder="Buscar cliente, veículo..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aberta">Em aberto</SelectItem>
              <SelectItem value="vencida">Vencidas</SelectItem>
              <SelectItem value="paga">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#6B7280] py-8 text-center">
            {meta?.total === 0 ? "Nenhuma promissória cadastrada." : "Nenhum resultado."}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[900px] border-collapse text-sm table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>Cliente</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Parcela</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Valor</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Vencimento</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Status</th>
                  <th className={`${listingThActions} text-[#6B7280]`} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                    <td className={listingTdText}>
                      <span className="line-clamp-2 break-words text-[#111827]">{row.cliente}</span>
                    </td>
                    <td className={listingTdText}>
                      {row.vehicle ? (
                        <VehicleListingCell vehicle={row.vehicle} />
                      ) : (
                        <span className="line-clamp-2 break-words text-[#6B7280]">{row.veiculo}</span>
                      )}
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Parcela" value={row.parcela} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Valor"
                        value={row.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Vencimento" value={row.vencimento} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Status"
                        value={<Badge className={row.badge.className}>{row.badge.label}</Badge>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdActions}>
                      <Link href={`/promissorias/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onPageChange={setPage}
            className="px-1"
          />
        ) : null}
      </Card>
    </div>
  );
}
