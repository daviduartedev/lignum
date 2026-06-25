"use client";

import Link from "next/link";
import { Car, ShoppingCart } from "lucide-react";
import type { Vehicle } from "@/types";
import { vehicleDisplayName, vehicleDaysInStock, vehicleAttrs } from "@/types";
import { VehicleThumbnail } from "./VehicleThumbnail";
import { Badge } from "./badge";
import { Button } from "./button";
import { MercosulPlate } from "./MercosulPlate";
import { vehicleStatusBadgeClass, vehicleStatusLabel } from "@/lib/vehicleStatusBadge";
import type { VehicleStatus } from "@prisma/client";

interface DataTableProps {
  data: Vehicle[];
}

function formatBRL(value?: number): string {
  if (!value && value !== 0) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function calcMargin(purchase: number, selling?: number): string {
  if (!selling || !purchase) return "-";
  const margin = ((selling - purchase) / selling) * 100;
  return `${margin.toFixed(1)}%`;
}

const thBase = "pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground";
const thUntilLg = `${thBase} hidden text-center lg:table-cell`;
const thUntilXl = `${thBase} hidden text-center xl:table-cell`;
const tdUntilLg = "hidden py-4 text-center text-sm text-muted-foreground lg:table-cell";
const tdUntilXl = "hidden py-4 text-center text-sm text-muted-foreground xl:table-cell";

export function VehicleDataTable({ data }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Car className="w-10 h-10 mb-3 opacity-40" aria-hidden />
        <p className="text-sm font-medium text-foreground">Nenhum veículo neste filtro</p>
        <p className="text-xs mt-1 text-muted-foreground max-w-xs text-center">
          Ajuste a busca ou a aba para ver outros resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[620px]">
        <thead>
          <tr className="border-b border-border/80">
            <th className={`${thBase} min-w-[10rem] pl-2 text-left`}>Veículo</th>
            <th className={`${thBase} px-2 text-center`}>Placa</th>
            <th className={thUntilXl}>Ano</th>
            <th className={thUntilXl}>KM</th>
            <th className={thUntilLg}>Compra</th>
            <th className={`${thBase} px-2 text-center`}>Venda</th>
            <th className={`${thBase} px-2 text-center`}>Margem</th>
            <th className={`${thBase} px-2 text-center`}>Dias</th>
            <th className={`${thBase} px-2 text-center`}>Status</th>
            <th className={`${thBase} min-w-[8.5rem] pr-2 text-right`}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const a = vehicleAttrs(item);
            const displayName = vehicleDisplayName(item);
            const days = vehicleDaysInStock(item);
            const status = a.status as VehicleStatus;

            return (
              <tr key={item.id} className="border-b border-border/80 last:border-0 hover:bg-muted/50 transition-colors group">
                <td className="py-3 pr-3 pl-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                      <VehicleThumbnail
                        vehicle={item}
                        alt={displayName}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-medium">
                        {a.year_manufacture} • {Number(a.mileage).toLocaleString("pt-BR")} KM
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-2 text-center">
                  <div className="inline-flex justify-center">
                    <MercosulPlate plate={a.plate} />
                  </div>
                </td>

                <td className={tdUntilXl}>
                  {a.year_manufacture}/{a.year_model}
                </td>

                <td className={tdUntilXl}>{Number(a.mileage).toLocaleString("pt-BR")}</td>

                <td className={tdUntilLg}>{formatBRL(a.purchase_price)}</td>

                <td className="py-3 px-2 text-center text-sm font-bold text-foreground">{formatBRL(a.selling_price)}</td>

                <td className="py-3 px-2 text-center text-sm font-bold text-green-600">
                  {calcMargin(a.purchase_price, a.selling_price)}
                </td>

                <td className="py-3 px-2 text-center">
                  <span
                    className={`text-sm ${
                      days > 45 ? "text-red-700 font-bold" : days > 30 ? "text-amber-700 font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {days}d
                  </span>
                </td>

                <td className="py-3 px-2 text-center">
                  <Badge className={vehicleStatusBadgeClass(status)}>{vehicleStatusLabel(status)}</Badge>
                </td>

                <td className="py-3 pl-2 pr-2">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <Link href={`/veiculo/${item.documentId ?? item.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-all"
                      >
                        Ver detalhes
                      </Button>
                    </Link>
                    {status === "disponivel" || status === "reservado" ? (
                      <Link href={`/venda/${item.documentId ?? item.id}`}>
                        <Button size="sm" className="h-8 bg-[#22C55E] text-white hover:bg-[#16A34A]">
                          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                          Vender
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
