"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useVehicles } from "@/hooks/useVehicles";
import type { Vehicle } from "@/types";
import { vehicleAttrs } from "@/types";
import { Badge } from "@/components/ui/badge";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { Button } from "@/components/ui/button";

export function StandbyNaoCompra() {
  const { data: veiculos = [], isLoading } = useVehicles();
  const list = veiculos.filter((v: Vehicle) => vehicleAttrs(v).status === "standby_nao_compra");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standby, não compra"
        description="Veículos avaliados para compra e marcados como não comprados pela loja (fora do estoque ativo)."
      />

      <Card className="p-6 border border-border">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Car className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhum veículo nesta lista.</p>
            <p className="text-xs mt-1 text-center max-w-md">
              Registe uma avaliação de compra com resultado &quot;Não comprado&quot; a partir da ficha do veículo.
            </p>
            <Link href="/estoque" className="mt-4">
              <Button variant="outline" size="sm">
                Ir ao estoque
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((v: Vehicle) => {
              const a = vehicleAttrs(v);
              const rid = v.documentId ?? String(v.id);
              return (
                <li key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <VehicleListingCell vehicle={v} subtitle={a.year_model ? String(a.year_model) : undefined} />
                    {a.plate?.trim() ? (
                      <div className="hidden sm:block shrink-0">
                        <MercosulPlate plate={a.plate} />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Standby</Badge>
                    <Link href={`/veiculo/${rid}`}>
                      <Button size="sm" variant="outline">
                        Ficha
                      </Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
