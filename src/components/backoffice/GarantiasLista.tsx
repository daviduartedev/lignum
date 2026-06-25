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
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { Plus, Search, Shield, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useWarrantiesPage, useWarrantySummary } from "@/hooks/useWarranties";
import { Pagination } from "@/components/ui/pagination";
import { vehicleAttrs, vehicleDisplayName } from "@/types";
import type { Vehicle, Warranty, WarrantyStatus, WarrantyType } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TYPE_LABELS: Record<WarrantyType, string> = {
  motor_cambio: "Motor e câmbio",
  completa: "Completa",
  motor: "Motor",
  acessorios: "Acessórios",
  outros: "Outros",
};

function statusBadgeClass(s: WarrantyStatus): string {
  if (s === "ativa") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (s === "vencendo") return "bg-[#FEF3C7] text-[#B45309] border-0";
  if (s === "expirada") return "bg-[#FEE2E2] text-[#B91C1C] border-0";
  return "bg-[#F3F4F6] text-[#6B7280] border-0";
}

function statusLabel(s: WarrantyStatus): string {
  if (s === "ativa") return "Ativa";
  if (s === "vencendo") return "Vence em breve";
  if (s === "expirada") return "Expirada";
  return "Cancelada";
}

export function GarantiasLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const { data: pageData, isLoading, isError, refetch } = useWarrantiesPage(page, {
    q: deferredSearch,
    status: statusFilter,
  });
  const { data: summary } = useWarrantySummary();
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
    return list.map((w: Warranty) => {
      const a = w.attributes;
      const vehicle = a.vehicle?.data;
      const client = a.client?.data;
      const placa = vehicle ? vehicleAttrs(vehicle).plate || "-" : "-";
      const veiculoNome = vehicle ? vehicleDisplayName(vehicle) : "-";
      const clienteNome = client?.attributes?.full_name ?? "-";
      const id = String(w.documentId ?? w.id);
      const tipo = (a.warranty_type as WarrantyType) || "outros";
      return {
        id,
        vehicle: vehicle as Vehicle | undefined,
        veiculo: veiculoNome,
        placa,
        cliente: clienteNome,
        tipo: TYPE_LABELS[tipo] || tipo,
        inicio: a.start_date ? new Date(a.start_date).toLocaleDateString("pt-BR") : "-",
        fim: a.end_date ? new Date(a.end_date).toLocaleDateString("pt-BR") : "-",
        valor: Number(a.coverage_value) || 0,
        status: (a.status as WarrantyStatus) || "ativa",
      };
    });
  }, [rawList]);

  const stats = {
    ativas: summary?.ativas ?? 0,
    vencendo: summary?.vencendo ?? 0,
    expiradas: summary?.expiradas ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Garantias</h1>
          <p className="text-sm text-[#6B7280]">Garantias de veículos vinculadas a clientes</p>
        </div>
        <Link href="/garantias/nova">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nova garantia
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-[#6B7280]">Ativas</div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{stats.ativas}</div>
        </Card>
        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-sm text-[#6B7280]">Vence em breve</div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{stats.vencendo}</div>
        </Card>
        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm text-[#6B7280]">Expiradas</div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{stats.expiradas}</div>
        </Card>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Não foi possível carregar garantias</AlertTitle>
          <AlertDescription className="text-red-700">
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
              placeholder="Buscar veículo, placa, cliente..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="vencendo">Vence em breve</SelectItem>
              <SelectItem value="expirada">Expirada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#6B7280] py-8 text-center">
            {meta?.total === 0
              ? "Nenhuma garantia cadastrada."
              : "Nenhum resultado com os filtros atuais."}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[960px] border-collapse text-sm table-fixed">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Placa</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Cliente</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Tipo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Início</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Fim</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Valor</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Status</th>
                  <th className={`${listingThActions} text-[#6B7280]`} />
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                    <td className={listingTdText}>
                      {g.vehicle ? (
                        <VehicleListingCell vehicle={g.vehicle} />
                      ) : (
                        <span className="line-clamp-2 break-words text-[#111827]">{g.veiculo}</span>
                      )}
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Placa"
                        value={
                          g.placa && g.placa !== "-" ? (
                            <MercosulPlate plate={g.placa} />
                          ) : (
                            "-"
                          )
                        }
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={`${listingTdText} text-[#6B7280]`}>
                      <span className="line-clamp-2 break-words">{g.cliente}</span>
                    </td>
                    <td className={`${listingTdText} text-[#6B7280]`}>{g.tipo}</td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Início" value={g.inicio} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Fim" value={g.fim} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Valor"
                        value={g.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Status"
                        value={<Badge className={statusBadgeClass(g.status)}>{statusLabel(g.status)}</Badge>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdActions}>
                      <Link href={`/garantias/${g.id}`}>
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
