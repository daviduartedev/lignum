"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { toast } from "@/lib/toast";
import { strapiEntityId } from "@/lib/strapiEntity";
import { vehicleDisplayName, vehicleAttrs, clientAttrs, type Vehicle, type Client } from "@/types";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { ListingStatCell, listingTdStat, listingTdText, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { usePurchaseEvaluationsPage, type PurchaseEvaluationOutcomeFilter } from "@/hooks/usePurchaseEvaluations";
import { useVehicles } from "@/hooks/useVehicles";

type PurchaseEvaluation = {
  id: number;
  outcome: "pendente" | "comprado" | "nao_comprado";
  reasonCode?: string | null;
  reasonDetail?: string | null;
  createdAt?: string;
  vehicle?: Vehicle | Record<string, unknown> | null;
  client?: Client | Record<string, unknown> | null;
};

function outcomeLabel(v: PurchaseEvaluation["outcome"]): string {
  switch (v) {
    case "pendente":
      return "Pendente";
    case "comprado":
      return "Comprado";
    case "nao_comprado":
      return "Não comprado";
  }
}

function outcomeBadgeClasses(v: PurchaseEvaluation["outcome"]): string {
  switch (v) {
    case "comprado":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "nao_comprado":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "pendente":
    default:
      return "bg-amber-100 text-amber-800 border border-amber-200";
  }
}

function asPurchaseEvaluationRow(raw: Record<string, unknown>): PurchaseEvaluation {
  return raw as unknown as PurchaseEvaluation;
}

export function AvaliacaoCompraLista() {
  const router = useRouter();
  const [tab, setTab] = useState<"todos" | PurchaseEvaluationOutcomeFilter>("todos");
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const outcome = tab === "todos" ? undefined : tab;

  const q = usePurchaseEvaluationsPage({ page, pageSize, outcome });
  const { data: vehicles = [] } = useVehicles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehiclePick, setVehiclePick] = useState<string>("");

  const rows = useMemo(() => {
    const raw = q.data?.data ?? [];
    return raw.map(asPurchaseEvaluationRow);
  }, [q.data]);

  const meta = q.data?.meta;

  const description =
    "Veículos candidatos a compra. Só entram no estoque ativo quando marcados como Comprado.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliação de compra"
        description={description}
        action={
          <div className="flex items-center gap-2">
            <Button
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              onClick={() => {
                setVehiclePick("");
                setDialogOpen(true);
              }}
            >
              Nova avaliação de compra
            </Button>
            <Link href="/avaliacao/standby">
              <Button variant="outline">Standby</Button>
            </Link>
          </div>
        }
      />

      <Card className="p-6 border border-border">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as typeof tab);
            setPage(1);
          }}
        >
          <TabsList className="bg-gray-100/50 p-1 flex-wrap h-auto min-h-9 mb-4">
            <TabsTrigger value="todos" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Todos
            </TabsTrigger>
            <TabsTrigger value="pendente" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="comprado" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Comprados
            </TabsTrigger>
            <TabsTrigger value="nao_comprado" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Não comprados
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            {q.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : q.isError ? (
              <div className="text-sm text-red-700">
                Falha ao carregar.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void q.refetch().catch((e: unknown) => toast.apiError(e));
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma avaliação de compra encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/80">
                      <th className={`${listingThText} min-w-[10rem]`}>Veículo</th>
                      <th className={listingThStat}>Placa</th>
                      <th className={listingThText}>Cliente</th>
                      <th className={listingThStat}>Status</th>
                      <th className={listingThText}>Motivo</th>
                      <th className={listingThText}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const v = (r.vehicle ?? null) as Vehicle | null;
                      const c = (r.client ?? null) as Client | null;
                      const rid = v ? (strapiEntityId(v as Vehicle) ?? (v as Vehicle).documentId ?? String((v as Vehicle).id)) : "";
                      const plate = v ? vehicleAttrs(v as Vehicle).plate : "";
                      const vehicleName = v ? vehicleDisplayName(v as Vehicle) : `Veículo #${String(r.vehicle)}`;
                      const clientName = c ? (clientAttrs(c as Client).full_name || `Cliente #${c.id}`) : "-";
                      const motivo = r.reasonCode ? String(r.reasonCode) : "-";
                      return (
                        <tr key={r.id} className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className={listingTdText}>
                            {v ? (
                              <VehicleListingCell vehicle={v as Vehicle} />
                            ) : (
                              <div className="font-medium text-foreground">{vehicleName}</div>
                            )}
                          </td>
                          <td className={listingTdStat}>
                            <ListingStatCell
                              hideLabel
                              label="Placa"
                              value={
                                plate ? (
                                  <MercosulPlate plate={plate} />
                                ) : (
                                  "-"
                                )
                              }
                              valueClassName="font-normal"
                            />
                          </td>
                          <td className={`${listingTdText} text-sm text-muted-foreground`}>{clientName}</td>
                          <td className={listingTdStat}>
                            <ListingStatCell
                              hideLabel
                              label="Status"
                              value={<Badge className={outcomeBadgeClasses(r.outcome)}>{outcomeLabel(r.outcome)}</Badge>}
                            />
                          </td>
                          <td className={`${listingTdText} text-sm text-muted-foreground`}>
                            <ListingStatCell hideLabel label="Motivo" value={motivo} />
                            {r.reasonDetail ? (
                              <div className="text-xs text-muted-foreground mt-1">{String(r.reasonDetail)}</div>
                            ) : null}
                          </td>
                          <td className={listingTdText}>
                            {rid ? (
                              <Link href={`/avaliacao/compra/${rid}`}>
                                <Button size="sm" variant="outline">
                                  Abrir
                                </Button>
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                className="mt-4"
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova avaliação de compra</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Select value={vehiclePick || undefined} onValueChange={setVehiclePick}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => {
                  const rid = strapiEntityId(v as Vehicle) ?? (v as Vehicle).documentId ?? String((v as Vehicle).id);
                  const a = vehicleAttrs(v as Vehicle);
                  const label = `${vehicleDisplayName(v as Vehicle)} · ${a.plate || "-"}`;
                  return (
                    <SelectItem key={rid} value={String(rid)}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={!vehiclePick}
              onClick={() => {
                if (!vehiclePick) return;
                router.push(`/avaliacao/compra/${encodeURIComponent(vehiclePick)}`);
                setDialogOpen(false);
              }}
            >
              Iniciar avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

