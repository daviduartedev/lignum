"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StitchPageHeader, StitchSectionCard, StitchTableShell } from "@/components/ui/stitch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listingTdStat,
  listingTdText,
  listingThStat,
  listingThText,
} from "@/components/ui/ListingStatCell";
import {
  useCancelProductionOrder,
  useCompleteProductionOrder,
  useProductionOrder,
  useStartProductionOrder,
  useUpdateProductionOrder,
} from "@/hooks/useProductionOrders";
import { useEmployees } from "@/hooks/useEmployees";
import {
  productionOrderDisplayNumber,
  productionOrderStatusBadgeClass,
  productionOrderStatusLabel,
} from "@/lib/productionOrderLabels";
import type { BomLine } from "@/lib/quotes/bomBuilder";
import { cn } from "@/components/ui/utils";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Play,
  Users,
} from "lucide-react";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export function ProducaoDetalhe({ routeId }: { routeId: string }) {
  const { data: order, isLoading, isError } = useProductionOrder(routeId);
  const startMutation = useStartProductionOrder();
  const completeMutation = useCompleteProductionOrder();
  const cancelMutation = useCancelProductionOrder();
  const updateMutation = useUpdateProductionOrder();
  const { data: activeEmployees } = useEmployees({ activeOnly: true });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [employeesDirty, setEmployeesDirty] = useState(false);

  const bom = useMemo(() => order?.technicalSheet?.bom ?? [], [order?.technicalSheet?.bom]);

  useEffect(() => {
    if (order && !employeesDirty) {
      setSelectedEmployeeIds(order.employeeIds);
    }
  }, [order?.employeeIds, order, employeesDirty]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando ordem de produção…
      </div>
    );
  }

  if (isError || !order) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ordem não encontrada</AlertTitle>
        <AlertDescription>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/producao">Voltar ao kanban</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const canStart = order.status === "aguardando";
  const canComplete = order.status === "andamento";
  const canCancel = order.status === "aguardando" || order.status === "andamento";
  const canEditEmployees = order.status !== "concluida" && order.status !== "cancelada";

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title={productionOrderDisplayNumber(order)}
        description={
          order.quote
            ? `${order.quote.clientName} · ${order.quote.bodyModelName ?? "Carroceria"}`
            : "Detalhe da ordem de produção"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border", productionOrderStatusBadgeClass(order.status))}>
              {productionOrderStatusLabel(order.status)}
            </Badge>
            {canStart && (
              <Button
                size="sm"
                onClick={() => startMutation.mutate(routeId)}
                disabled={startMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar produção
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                variant="default"
                className="bg-primary hover:bg-accent"
                onClick={() => completeMutation.mutate(routeId)}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelMutation.mutate(routeId)}
                disabled={cancelMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/producao">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kanban
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="bom" className="w-full">
        <TabsList>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="bom" className="mt-4">
          <StitchSectionCard title="Lista de materiais (BOM)">
            <StitchTableShell>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={listingThText}>SKU</th>
                    <th className={listingThText}>Descrição</th>
                    <th className={listingThStat}>Qtd.</th>
                    <th className={listingThText}>Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        BOM vazio
                      </td>
                    </tr>
                  ) : (
                    bom.map((line: BomLine, i: number) => (
                      <tr key={`${line.sku}-${i}`} className="border-t border-outline-variant/50">
                        <td className={listingTdText}>{line.sku}</td>
                        <td className={listingTdText}>{line.description}</td>
                        <td className={listingTdStat}>{line.quantity}</td>
                        <td className={listingTdText}>{line.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </StitchTableShell>
          </StitchSectionCard>
        </TabsContent>

        <TabsContent value="funcionarios" className="mt-4">
          <StitchSectionCard title="Equipe alocada">
            {order.employees && order.employees.length > 0 && !canEditEmployees && (
              <ul className="mb-4 space-y-2">
                {order.employees.map((emp) => (
                  <li key={emp.id} className="rounded-lg border px-3 py-2 text-sm">
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-muted-foreground"> · {emp.roleTitle}</span>
                  </li>
                ))}
              </ul>
            )}
            {canEditEmployees ? (
              <div className="space-y-4">
                {(activeEmployees ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum funcionário ativo cadastrado.{" "}
                    <Link href="/funcionarios" className="text-secondary underline">
                      Cadastrar equipe
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(activeEmployees ?? []).map((emp) => {
                      const checked = selectedEmployeeIds.includes(emp.id);
                      return (
                        <li key={emp.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setEmployeesDirty(true);
                              setSelectedEmployeeIds((prev) =>
                                checked ? prev.filter((id) => id !== emp.id) : [...prev, emp.id],
                              );
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.roleTitle}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Button
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    updateMutation.mutate(
                      { routeId, data: { employeeIds: selectedEmployeeIds } },
                      { onSuccess: () => setEmployeesDirty(false) },
                    );
                  }}
                >
                  Salvar equipe
                </Button>
              </div>
            ) : order.employees?.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">Nenhum funcionário vinculado.</p>
              </div>
            ) : null}
          </StitchSectionCard>
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          <StitchSectionCard title="Fotos da produção">
            {order.photoUrls.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma foto anexada.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {order.photoUrls.map((url, i) => (
                  <div key={url} className="relative aspect-video overflow-hidden rounded-lg border">
                    <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </StitchSectionCard>
        </TabsContent>

        <TabsContent value="materiais" className="mt-4">
          <StitchSectionCard title="Materiais consumidos">
            <StitchTableShell>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={listingThText}>Material</th>
                    <th className={listingThStat}>Qtd.</th>
                    <th className={listingThText}>Tipo</th>
                    <th className={listingThText}>Data</th>
                  </tr>
                </thead>
                <tbody>
        {order.stockMovements?.length ? (
                    order.stockMovements.map((m) => (
                      <tr key={m.id} className="border-t border-outline-variant/50">
                        <td className={listingTdText}>
                          {m.material ? `${m.material.sku} — ${m.material.name}` : "—"}
                        </td>
                        <td className={listingTdStat}>
                          {m.quantity} {m.material?.unit ?? ""}
                        </td>
                        <td className={listingTdText}>
                          <Badge variant="outline" className="text-xs">
                            {m.type === "saida" ? "Saída" : m.type === "estorno" ? "Estorno" : m.type}
                          </Badge>
                        </td>
                        <td className={listingTdText}>{formatDateTime(m.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum consumo registrado. Inicie a produção para baixar o BOM.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StitchTableShell>
          </StitchSectionCard>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <StitchSectionCard title="Histórico de status">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b pb-2">
                <span>Criada</span>
                <span className="text-muted-foreground">{formatDateTime(order.createdAt)}</span>
              </li>
              {order.startedAt && (
                <li className="flex justify-between border-b pb-2">
                  <span>Início da produção</span>
                  <span className="text-muted-foreground">{formatDateTime(order.startedAt)}</span>
                </li>
              )}
              {order.completedAt && (
                <li className="flex justify-between border-b pb-2">
                  <span>Concluída</span>
                  <span className="text-muted-foreground">{formatDateTime(order.completedAt)}</span>
                </li>
              )}
              {order.cancelledAt && (
                <li className="flex justify-between border-b pb-2">
                  <span>Cancelada</span>
                  <span className="text-muted-foreground">{formatDateTime(order.cancelledAt)}</span>
                </li>
              )}
            </ul>
          </StitchSectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
