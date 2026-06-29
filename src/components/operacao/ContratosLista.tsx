"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, FileText, Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { useContractsPage } from "@/hooks/useContracts";
import { Pagination } from "@/components/ui/pagination";
import { clientAttrs, vehicleDisplayName } from "@/types";
import type { Client, Contract, ContractStatus, ContractType, Vehicle } from "@/types";

const TYPE_LABELS: Record<ContractType, string> = {
  compra_venda: "Compra e Venda",
  financiamento: "Financiamento",
  consorcio: "Consórcio",
  locacao: "Locação",
};

const STATUS_LABELS: Record<ContractStatus, string> = {
  rascunho: "Rascunho",
  pendente_assinatura: "Pendente",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

function statusBadgeClass(s: ContractStatus): string {
  if (s === "assinado") return "bg-[#DCFCE7] text-[#15803D] border-0";
  if (s === "pendente_assinatura" || s === "rascunho") return "bg-[#FEF9C3] text-[#A16207] border-0";
  return "bg-[#FEE2E2] text-[#B91C1C] border-0";
}

export function ContratosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data: pageData, isLoading, isError, refetch } = useContractsPage(page, { q: deferredSearch });
  const rawList = pageData?.items ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const rows = useMemo(() => {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((item: Contract | Record<string, unknown>) => {
      const c = item as Contract;
      const a =
        (c as { attributes?: Contract["attributes"] }).attributes || (c as unknown as Contract["attributes"]);
      const vehicle = a.vehicle?.data;
      const client = a.client?.data;
      const veiculoNome = vehicle ? vehicleDisplayName(vehicle as Vehicle) : "-";
      const clienteNome = client ? clientAttrs(client as Client).full_name : "-";
      const id = (c as { documentId?: string; id: number }).documentId || String((c as { id: number }).id);
      return {
        id,
        tipo: TYPE_LABELS[(a.contract_type as ContractType) || "compra_venda"] || String(a.contract_type),
        vehicle: vehicle as Vehicle | undefined,
        veiculo: veiculoNome,
        cliente: clienteNome,
        valor: Number(a.contract_value) || 0,
        data: a.contract_date
          ? new Date(`${a.contract_date}T12:00:00`).toLocaleDateString("pt-BR")
          : "-",
        status: (a.status as ContractStatus) || "rascunho",
      };
    });
  }, [rawList]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Contratos</h1>
          <p className="text-sm text-[#6B7280]">Gestão de contratos</p>
        </div>
        <Link href="/contratos/novo">
          <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo contrato
          </Button>
        </Link>
      </div>

      {isError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro ao carregar contratos</AlertTitle>
          <AlertDescription className="text-red-700 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void refetch()} className="border-red-300">
              <RefreshCw className="w-4 h-4 mr-1" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 border border-[#E5E7EB]">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              placeholder="Pesquisar por veículo, cliente ou tipo…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>Ref.</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Tipo</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Cliente</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Valor</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Data</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Estado</th>
                  <th className={`${listingThActions} text-[#6B7280]`} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-[#6B7280]">
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                ) : (
                  rows.map((contrato) => (
                    <tr key={contrato.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                      <td className={`${listingTdText} text-[#111827] font-mono text-xs break-all`} title={contrato.id}>
                        {contrato.id.length > 18 ? `${contrato.id.slice(0, 16)}…` : contrato.id}
                      </td>
                      <td className={`${listingTdText} text-[#6B7280]`}>{contrato.tipo}</td>
                      <td className={listingTdText}>
                        {contrato.vehicle ? (
                          <VehicleListingCell vehicle={contrato.vehicle} />
                        ) : (
                          <span className="line-clamp-2 break-words text-[#111827]">{contrato.veiculo}</span>
                        )}
                      </td>
                      <td className={`${listingTdText} text-[#6B7280]`}>
                        <span className="line-clamp-2 break-words">{contrato.cliente}</span>
                      </td>
                      <td className={listingTdStat}>
                        <ListingStatCell hideLabel
                          label="Valor"
                          value={contrato.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        />
                      </td>
                      <td className={listingTdStat}>
                        <ListingStatCell hideLabel label="Data" value={contrato.data} />
                      </td>
                      <td className={listingTdStat}>
                        <ListingStatCell hideLabel
                          label="Estado"
                          value={
                            <Badge className={statusBadgeClass(contrato.status)}>
                              {STATUS_LABELS[contrato.status] || contrato.status}
                            </Badge>
                          }
                          valueClassName="font-normal"
                        />
                      </td>
                      <td className={listingTdActions}>
                        <Link href={`/contratos/${contrato.id}`}>
                          <Button variant="ghost" size="sm" className="text-green-600">
                            <FileText className="w-4 h-4 mr-1" />
                            Abrir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
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
