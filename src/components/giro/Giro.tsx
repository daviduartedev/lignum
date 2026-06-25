"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingDown, Loader2 } from "lucide-react";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { useVehicles } from "@/hooks/useVehicles";
import { vehicleDaysInStock, vehicleDisplayName, vehicleAttrs, type Vehicle } from "@/types";

type Nivel = "critico" | "atencao" | "ok";

export function Giro() {
  const { data: vehiclesData = [], isLoading } = useVehicles();

  const rows = useMemo(() => {
    const list = Array.isArray(vehiclesData) ? vehiclesData : [];
    const stock = list.filter((v: unknown) => {
      const st = String(vehicleAttrs(v as Vehicle).status ?? "");
      return st === "disponivel" || st === "reservado";
    }) as Vehicle[];

    return stock
      .map((v) => {
        const a = vehicleAttrs(v);
        const dias = vehicleDaysInStock(v);
        const venda = Number(a.selling_price) || 0;
        const compra = Number(a.purchase_price) || 0;
        const custos = Number(a.estimated_maintenance_cost) || 0;
        const fipe = Number(a.fipe_price) || 0;
        const sugestao = venda > 0 ? Math.round(venda * 0.97) : 0;
        const reducaoPct = venda > 0 ? (((venda - sugestao) / venda) * 100).toFixed(1) : "0";
        const nivel: Nivel = dias > 45 ? "critico" : dias >= 30 ? "atencao" : "ok";
        const id = String(v.documentId ?? v.id ?? "");
        return {
          id,
          vehicle: v,
          veiculo: vehicleDisplayName(v),
          placa: String(a.plate ?? "-"),
          dias,
          compra,
          venda,
          sugestao,
          reducaoPct,
          nivel,
          lucro: venda - compra - custos,
          fipe,
        };
      })
      .sort((x, y) => y.dias - x.dias);
  }, [vehiclesData]);

  const kpis = useMemo(() => {
    const crit = rows.filter((r) => r.nivel === "critico").length;
    const att = rows.filter((r) => r.nivel === "atencao").length;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.dias, 0) / rows.length) : 0;
    return { crit, att, avg };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Carregando estoque…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">Giro/Marketing</h1>
        <p className="text-sm text-[#6B7280]">Carros parados por muitos dias (sugestões de ação e acompanhamento)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-[#6B7280]">Crítico</div>
              <div className="text-xs text-[#6B7280]">&gt; 45 dias</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{kpis.crit}</div>
          <div className="text-sm text-[#6B7280] mt-1">veículos</div>
        </Card>

        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-[#6B7280]">Atenção</div>
              <div className="text-xs text-[#6B7280]">30–45 dias</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{kpis.att}</div>
          <div className="text-sm text-[#6B7280] mt-1">veículos</div>
        </Card>

        <Card className="p-6 border border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-[#6B7280]">Giro médio</div>
              <div className="text-xs text-[#6B7280]">stock atual</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-[#111827]">{kpis.avg}</div>
          <div className="text-sm text-[#6B7280] mt-1">dias</div>
        </Card>
      </div>

      <Card className="p-6 border border-[#E5E7EB]">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Veículos por tempo em stock</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-[#6B7280]">Nenhum veículo em stock para análise.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Placa</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Dias</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Valor atual</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Sugestão (−3%)</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Ajuste</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Lucro × FIPE</th>
                  <th className={`${listingThStat} text-[#6B7280]`}>Nível</th>
                  <th className={`${listingThActions} text-[#6B7280]`}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                    <td className={listingTdText}>
                      <Link href={`/veiculo/${item.id}`} className="block hover:opacity-90">
                        <VehicleListingCell vehicle={item.vehicle} />
                      </Link>
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Placa"
                        value={
                          item.placa && item.placa !== "-" ? (
                            <MercosulPlate plate={item.placa} />
                          ) : (
                            "-"
                          )
                        }
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Dias"
                        value={item.dias}
                        valueClassName={
                          item.nivel === "critico"
                            ? "text-red-600"
                            : item.nivel === "atencao"
                              ? "text-amber-600"
                              : "text-green-600"
                        }
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Valor atual"
                        value={item.venda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Sugestão (−3%)"
                        value={item.sugestao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        valueClassName="text-[#22C55E]"
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Ajuste" value={`−${item.reducaoPct}%`} valueClassName="text-red-600" />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Lucro × FIPE"
                        value={
                          item.fipe > 0 ? (
                            <span title="Lucro estimado em % do valor FIPE">
                              {((item.lucro / item.fipe) * 100).toFixed(1)}% FIPE
                            </span>
                          ) : (
                            "-"
                          )
                        }
                        valueClassName="text-xs font-normal text-[#6B7280]"
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel
                        label="Nível"
                        value={
                          <Badge
                            className={
                              item.nivel === "critico"
                                ? "bg-[#FEE2E2] text-[#B91C1C] border-0"
                                : item.nivel === "atencao"
                                  ? "bg-[#FEF3C7] text-[#B45309] border-0"
                                  : "bg-[#DCFCE7] text-[#15803D] border-0"
                            }
                          >
                            {item.nivel === "critico" ? "Crítico" : item.nivel === "atencao" ? "Atenção" : "OK"}
                          </Badge>
                        }
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdActions}>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/veiculo/${item.id}/editar`}>Ajustar preço</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
