"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { useServiceOrdersPage } from "@/hooks/useServiceOrders";
import { Pagination } from "@/components/ui/pagination";
import { vehicleAttrs, vehicleDisplayName } from "@/types";
import type { Vehicle } from "@/types";
import type { ServiceOrder, ServiceOrderStatus, ServiceOrderType } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TYPE_LABELS: Record<ServiceOrderType, string> = {
  manutencao: "Manutenção",
  revisao: "Revisão",
  funilaria: "Funilaria",
  eletrica: "Elétrica",
  mecanica: "Mecânica",
  estetica: "Estética",
  outros: "Outros",
};

function typeLabel(a: ServiceOrder["attributes"]): string {
  const tipo = (a.service_type as ServiceOrderType) || "outros";
  if (tipo !== "outros") return TYPE_LABELS[tipo] || tipo;
  const t = String(a.service_type_other_text ?? "").trim();
  return t ? `Outros, ${t}` : "Outros (não informado)";
}

function statusBadgeClass(s: ServiceOrderStatus): string {
  if (s === "concluida") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (s === "andamento") return "bg-[#DBEAFE] text-[#1D4ED8] border-0";
  if (s === "cancelada") return "bg-[#FEE2E2] text-[#B91C1C] border-0";
  return "bg-[#FEF3C7] text-[#B45309] border-0";
}

function statusLabel(s: ServiceOrderStatus): string {
  if (s === "concluida") return "Concluída";
  if (s === "andamento") return "Em andamento";
  if (s === "cancelada") return "Cancelada";
  return "Aguardando";
}

export function OSLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { data: pageData, isLoading, isError, refetch } = useServiceOrdersPage(page, {
    q: deferredSearch,
    status: statusFilter,
  });
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
    return list.map((item: ServiceOrder | Record<string, unknown>) => {
      const o = item as ServiceOrder;
      const a =
        (o as { attributes?: ServiceOrder["attributes"] }).attributes ||
        (o as unknown as ServiceOrder["attributes"]);
      const vehicle = a.vehicle?.data;
      const veiculoNome = vehicle ? vehicleDisplayName(vehicle as Vehicle) : "-";
      const placa = vehicle ? vehicleAttrs(vehicle as Vehicle).plate || "-" : "-";
      const rowId = (o as { documentId?: string; id: number }).documentId || String((o as { id: number }).id);
      return {
        id: rowId,
        vehicle: vehicle as Vehicle | undefined,
        veiculo: veiculoNome,
        placa,
        oficina: a.workshop_name || "-",
        tipo: typeLabel(a),
        valor: Number(a.total_amount) || 0,
        data: a.entry_date ? new Date(`${a.entry_date}T12:00:00`).toLocaleDateString("pt-BR") : "-",
        status: (a.status as ServiceOrderStatus) || "aguardando",
      };
    });
  }, [rawList]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Ordens de serviço</h1>
          <p className="text-sm text-[#6B7280]">Controlo de serviços e manutenções</p>
        </div>
        <Link href="/os/nova">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </Link>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Não foi possível carregar as OS</AlertTitle>
          <AlertDescription className="text-red-700 flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} className="border-red-300">
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
              placeholder="Pesquisar por veículo, placa, oficina ou ID…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#6B7280] py-8 text-center">
            {meta?.total === 0
              ? "Nenhuma ordem de serviço cadastrada. Clique em Nova OS para começar."
              : "Nenhum resultado com os filtros atuais."}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>OS</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Placa</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Oficina</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Tipo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Valor</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Entrada</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Estado</th>
                  <th className={`${listingThActions} text-[#6B7280] w-24`} />
                </tr>
              </thead>
              <tbody>
                {rows.map((os) => (
                  <tr key={os.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                    <td className={`${listingTdText} font-mono text-xs text-[#111827] break-all`} title={os.id}>
                      {os.id.length > 14 ? `${os.id.slice(0, 12)}…` : os.id}
                    </td>
                    <td className={listingTdText}>
                      {os.vehicle ? (
                        <VehicleListingCell vehicle={os.vehicle} />
                      ) : (
                        <span className="line-clamp-2 break-words text-[#111827]">{os.veiculo}</span>
                      )}
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell
                        hideLabel
                        label="Placa"
                        value={
                          os.placa && os.placa !== "-" ? (
                            <MercosulPlate plate={os.placa} />
                          ) : (
                            "-"
                          )
                        }
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={`${listingTdStat} text-[#6B7280]`}>
                      <span className="line-clamp-2 break-words text-sm">{os.oficina}</span>
                    </td>
                    <td className={`${listingTdStat} text-[#6B7280] text-sm`}>{os.tipo}</td>
                    <td className={listingTdStat}>
                      <ListingStatCell
                        hideLabel
                        label="Valor"
                        value={os.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Entrada" value={os.data} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell
                        hideLabel
                        label="Estado"
                        value={<Badge className={statusBadgeClass(os.status)}>{statusLabel(os.status)}</Badge>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdActions}>
                      <Link href={`/os/${os.id}?modo=visualizar`}>
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
