"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ShoppingCart,
  FileText,
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { useSalesForClient } from "@/hooks/useSales";
import { useMemo } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ClientDocumentsSection } from "@/components/comercial/ClientDocumentsSection";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { ListingStatCell, listingTdStat, listingTdText, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { clientAttrs, vehicleAttrs, type Vehicle } from "@/types";

export function HistoricoCliente() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { data: rawClient, isLoading: loadingClient, isError: errorClient } = useClient(id);
  const clientId = rawClient?.id;
  const { data: rawSales = [], isLoading: loadingSales } = useSalesForClient(clientId);

  const isLoading = loadingClient || (clientId != null && loadingSales);

  const cliente = useMemo(() => {
    if (!rawClient) return null;
    const a = clientAttrs(rawClient);
    return {
      nome: a.full_name || "Sem nome",
      cpf: a.document || "-",
      telefone: a.phone || "-",
      email: a.email || "-",
      endereco: a.address || "-",
      cadastro: a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "-",
    };
  }, [rawClient]);

  const vendas = useMemo(() => {
    return rawSales
      .map((s) => {
        const a = s.attributes;
        const v = a.vehicle?.data;
        const vAttrs = v ? vehicleAttrs(v) : null;
        const rawDate = a.sale_date || a.createdAt;
        return {
          id: s.id,
          vehicle: v as Vehicle | undefined,
          veiculo: vAttrs ? `${vAttrs.brand} ${vAttrs.model}`.trim() : "-",
          placa: vAttrs?.plate || "-",
          valor: Number(a.final_price) || 0,
          rawDate,
          data: a.sale_date
            ? new Date(`${a.sale_date}T12:00:00`).toLocaleDateString("pt-BR")
            : "-",
          pagamento: String(a.payment_method || "-").replace(/_/g, " ").toUpperCase(),
        };
      })
      .sort((x, y) => new Date(y.rawDate).getTime() - new Date(x.rawDate).getTime());
  }, [rawSales]);

  const kpiData = useMemo(() => {
    const totalGasto = vendas.reduce((acc, v) => acc + v.valor, 0);
    const veiculosComprados = vendas.length;
    const ticketMedio = veiculosComprados > 0 ? totalGasto / veiculosComprados : 0;

    let ultimaCompraStr = "-";
    if (vendas.length > 0 && vendas[0].rawDate) {
      const msDiff = new Date().getTime() - new Date(vendas[0].rawDate).getTime();
      const dias = Math.floor(msDiff / (1000 * 60 * 60 * 24));
      if (dias === 0) ultimaCompraStr = "Hoje";
      else if (dias === 1) ultimaCompraStr = "Há 1 dia";
      else ultimaCompraStr = `Há ${dias} dias`;
    }

    return [
      {
        label: "Total gasto",
        valor: totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        icon: DollarSign,
        cor: "blue",
      },
      {
        label: "Veículos comprados",
        valor: veiculosComprados.toString(),
        icon: ShoppingCart,
        cor: "green",
      },
      {
        label: "Ticket médio",
        valor: ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        icon: TrendingUp,
        cor: "purple",
      },
      {
        label: "Última compra",
        valor: ultimaCompraStr,
        icon: FileText,
        cor: "amber",
      },
    ];
  }, [vendas]);

  const timeline = useMemo(() => {
    const events: { data: string; evento: string; tipo: string; rawDateMs: number }[] = [];
    vendas.forEach((v) => {
      events.push({
        data: v.data,
        evento: `Compra, ${v.veiculo}`,
        tipo: "compra",
        rawDateMs: new Date(v.rawDate).getTime(),
      });
      if (v.valor > 0) {
        events.push({
          data: v.data,
          evento: `Pagamento (${v.pagamento.toLowerCase()}), ${v.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          tipo: "pagamento",
          rawDateMs: new Date(v.rawDate).getTime() - 1,
        });
      }
    });

    if (cliente?.cadastro && cliente.cadastro !== "-") {
      const partes = cliente.cadastro.split("/");
      const dateCad =
        partes.length === 3 ? new Date(`${partes[2]}-${partes[1]}-${partes[0]}T12:00:00`) : new Date(0);
      events.push({
        data: cliente.cadastro,
        evento: "Cliente cadastrado",
        tipo: "cadastro",
        rawDateMs: dateCad.getTime(),
      });
    }

    return events.sort((a, b) => b.rawDateMs - a.rawDateMs);
  }, [vendas, cliente]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando histórico…</p>
      </div>
    );
  }

  if (errorClient || !cliente || !id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-[#111827]">Erro</h1>
        </div>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Cliente não encontrado</AlertTitle>
          <AlertDescription className="text-red-700">
            Não foi possível carregar o histórico deste cliente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">{cliente.nome}</h1>
          <p className="text-sm text-[#6B7280]">{cliente.cpf}</p>
        </div>
        <Link href={`/clientes/${id}/editar`}>
          <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            Editar cadastro
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="p-6 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    kpi.cor === "blue"
                      ? "bg-blue-50"
                      : kpi.cor === "green"
                        ? "bg-green-50"
                        : kpi.cor === "purple"
                          ? "bg-purple-50"
                          : "bg-amber-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      kpi.cor === "blue"
                        ? "text-blue-600"
                        : kpi.cor === "green"
                          ? "text-green-600"
                          : kpi.cor === "purple"
                            ? "text-purple-600"
                            : "text-amber-600"
                    }`}
                  />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#111827] mb-1">{kpi.valor}</div>
              <div className="text-sm text-[#6B7280] font-medium">{kpi.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="text-sm font-semibold text-[#111827] mb-4 uppercase tracking-wide">Contato</h3>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Telefone</div>
              <div className="text-sm font-medium text-[#111827]">{cliente.telefone}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">E-mail</div>
              <div className="text-sm font-medium text-[#111827]">{cliente.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Endereço</div>
              <div className="text-sm font-medium text-[#111827] leading-tight">{cliente.endereco}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Cliente desde</div>
              <div className="text-sm font-medium text-[#111827]">{cliente.cadastro}</div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2 p-6 border border-[#E5E7EB] shadow-sm">
          <h3 className="text-sm font-semibold text-[#111827] mb-4 uppercase tracking-wide">Linha do tempo</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sem eventos registrados.</p>
            ) : (
              timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        item.tipo === "compra"
                          ? "bg-green-500"
                          : item.tipo === "pagamento"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                      }`}
                    />
                    {index < timeline.length - 1 && <div className="w-0.5 h-full bg-[#E5E7EB] my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="text-sm font-medium text-[#111827]">{item.evento}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mt-1">
                      {item.data}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 border border-[#E5E7EB] shadow-sm">
        <Tabs defaultValue="compras" className="w-full">
          <TabsList className="bg-gray-100 p-1 mb-4">
            <TabsTrigger value="compras" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Compras
            </TabsTrigger>
            <TabsTrigger value="promissorias" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Promissórias
            </TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compras" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className={`${listingThText} text-[#6B7280] font-semibold`}>Veículo</th>
                    <th className={`${listingThStat} text-[#6B7280] font-semibold`}>Placa</th>
                    <th className={`${listingThStat} text-[#6B7280] font-semibold`}>Valor</th>
                    <th className={`${listingThStat} text-[#6B7280] font-semibold`}>Data</th>
                    <th className={`${listingThStat} text-[#6B7280] font-semibold`}>Pagamento</th>
                    <th className={`${listingThStat} text-[#6B7280] font-semibold`}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                        Nenhuma compra registrada para este cliente.
                      </td>
                    </tr>
                  ) : (
                    vendas.map((compra) => (
                      <tr key={compra.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                        <td className={listingTdText}>
                          {compra.vehicle ? (
                            <VehicleListingCell vehicle={compra.vehicle} />
                          ) : (
                            <span className="text-sm font-semibold text-[#111827]">{compra.veiculo}</span>
                          )}
                        </td>
                        <td className={listingTdStat}>
                          <ListingStatCell hideLabel
                            label="Placa"
                            value={
                              compra.placa && compra.placa !== "-" ? (
                                <MercosulPlate plate={compra.placa} />
                              ) : (
                                "-"
                              )
                            }
                            valueClassName="font-normal"
                          />
                        </td>
                        <td className={listingTdStat}>
                          <ListingStatCell hideLabel
                            label="Valor"
                            value={compra.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            valueClassName="text-green-700 font-black"
                          />
                        </td>
                        <td className={listingTdStat}>
                          <ListingStatCell hideLabel label="Data" value={compra.data} valueClassName="font-medium" />
                        </td>
                        <td className={listingTdStat}>
                          <ListingStatCell hideLabel label="Pagamento" value={compra.pagamento} valueClassName="font-semibold" />
                        </td>
                        <td className={listingTdStat}>
                          <ListingStatCell hideLabel
                            label="Estado"
                            value={
                              <Badge className="bg-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7] border-0">
                                Concluído
                              </Badge>
                            }
                            valueClassName="font-normal"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="promissorias" className="mt-0">
            <div className="py-10 text-center space-y-4">
              <p className="text-sm text-[#6B7280]">
                Promissórias integradas com o módulo financeiro (próxima fase da migração).
              </p>
              <Link href="/financeiro?tab=receber">
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova promissória
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="mt-0">
            {clientId != null ? <ClientDocumentsSection clientId={clientId} /> : null}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
