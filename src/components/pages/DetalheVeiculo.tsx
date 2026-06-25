"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  ShoppingCart,
  Star,
  Fuel,
  Gauge,
  Calendar,
  FileText,
  Wrench,
  Download,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArchiveVehicle, useRestoreVehicle, useVehicle } from "@/hooks/useVehicles";
import { strapiEntityId } from "@/lib/strapiEntity";
import { vehicleDisplayName, vehicleDaysInStock, vehicleAttrs } from "@/types";
import type { StrapiMedia, Vehicle, VehicleStatus } from "@/types";
import { ProfitVsFipeBlock } from "@/components/finance/ProfitVsFipeBlock";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "@/lib/toast";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useEvaluationsByVehiclePage } from "@/hooks/useEvaluations";
import { DetalheVeiculoGallery } from "@/components/pages/DetalheVeiculoGallery";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function mediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : url;
}

const STATUS_STYLES: Record<string, string> = {
  disponivel: "bg-green-100 text-green-700",
  reservado: "bg-amber-100 text-amber-700",
  repasse: "bg-purple-100 text-purple-700",
  vendido: "bg-blue-100 text-blue-700",
  removido: "bg-gray-100 text-gray-700",
  standby_nao_compra: "bg-orange-100 text-orange-800",
};

export function DetalheVeiculo() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { data: vehicle, isLoading, isError, refetch } = useVehicle(id);
  const archiveMutation = useArchiveVehicle();
  const restoreMutation = useRestoreVehicle();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<VehicleStatus>("disponivel");
  const { data: suppliers = [] } = useSuppliers();
  const { data: evalPageData } = useEvaluationsByVehiclePage(vehicle?.id, 1, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Veículo não encontrado</AlertTitle>
          <AlertDescription className="text-red-700 flex flex-col items-start gap-4">
            <p>Não foi possível carregar os dados deste veículo.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 text-red-700">
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const a = vehicleAttrs(vehicle as Vehicle);
  const displayName = vehicleDisplayName(vehicle as Vehicle);
  const days = vehicleDaysInStock(vehicle as Vehicle);
  const routeEntityId = strapiEntityId(vehicle as Vehicle) || id || "";

  const valorPago = Number(a.purchase_price) || 0;
  const valorVenda = Number(a.selling_price) || 0;
  const valorFipe = Number(a.fipe_price) || 0;
  const custoManut = Number(a.estimated_maintenance_cost) || 0;
  const lucroEstimado = valorVenda - valorPago - custoManut;
  const margemPct = valorVenda > 0 ? ((lucroEstimado / valorVenda) * 100).toFixed(1) : "0";

  const attachments = Array.isArray(a.attachments?.data) ? (a.attachments!.data as StrapiMedia[]) : [];
  const supplierName =
    a.purchase_supplier_id != null
      ? (suppliers.find((s) => s.id === a.purchase_supplier_id)?.attributes?.company_name ?? `#${a.purchase_supplier_id}`)
      : "-";
  const evalItems = evalPageData?.items ?? [];
  const latestFinal = evalItems.find((it) => {
    const a2 = (it as unknown as { attributes?: { checklist_json?: unknown } }).attributes ?? {};
    const cj = a2.checklist_json;
    return cj && typeof cj === "object" && (cj as { status?: string }).status === "final";
  });
  const latestFinalAttrs =
    (latestFinal as unknown as { attributes?: { score?: unknown; createdAt?: unknown } } | undefined)?.attributes ?? undefined;
  const latestFinalScore = latestFinalAttrs?.score != null ? Number(latestFinalAttrs.score) : null;
  const latestFinalAt = latestFinalAttrs?.createdAt ? String(latestFinalAttrs.createdAt) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#111827]">{displayName}</h1>
              <Badge className={STATUS_STYLES[a.status] ?? STATUS_STYLES.removido}>{a.status.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MercosulPlate plate={a.plate} />
              <span className="text-sm text-gray-400 font-medium ml-2 uppercase">
                {a.year_manufacture}/{a.year_model} • {a.color} • {a.fuel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/veiculo/${routeEntityId}/editar`}>
            <Button variant="outline" className="border-gray-200">
              <Edit className="w-4 h-4 mr-2" />
              Editar Cadastro
            </Button>
          </Link>
          <Link href={`/avaliacao/${routeEntityId}`}>
            <Button variant="outline" className="border-gray-200">
              <Star className="w-4 h-4 mr-2" />
              Avaliação técnica
            </Button>
          </Link>
          <Link href={`/os/nova?veiculo=${encodeURIComponent(routeEntityId)}`}>
            <Button variant="outline" className="border-gray-200">
              <Wrench className="w-4 h-4 mr-2" />
              Nova OS
            </Button>
          </Link>
          {a.status === "disponivel" && (
            <Link href={`/venda/${routeEntityId}`}>
              <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-green-500/20">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Vender Veículo
              </Button>
            </Link>
          )}
          {a.status !== "removido" && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={archiveMutation.isPending}
            >
              Remover do estoque
            </Button>
          )}
          {a.status === "removido" && isAdmin && (
            <Button variant="secondary" onClick={() => setRestoreOpen(true)} disabled={restoreMutation.isPending}>
              Restaurar veículo
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do estoque?</AlertDialogTitle>
            <AlertDialogDescription>
              O veículo passará para a lista de <strong>removidos</strong> e deixa de contar como estoque ativo. Pode ser
              restaurado depois por um administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={archiveMutation.isPending}
              onClick={async () => {
                try {
                  await archiveMutation.mutateAsync(strapiEntityId(vehicle as Vehicle));
                  router.push("/estoque");
                } finally {
                  setConfirmDeleteOpen(false);
                }
              }}
            >
              {archiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar veículo</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha o novo estado do veículo. A opção &quot;Vendido&quot; não está disponível aqui, registe a venda no
              fluxo comercial após repor como disponível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-sm">Novo status</Label>
            <Select value={restoreStatus} onValueChange={(v) => setRestoreStatus(v as VehicleStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="repasse">Repasse</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="standby_nao_compra">Standby (não compra)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              disabled={restoreMutation.isPending}
              onClick={async () => {
                try {
                  await restoreMutation.mutateAsync({
                    routeId: strapiEntityId(vehicle as Vehicle),
                    status: restoreStatus,
                  });
                  setRestoreOpen(false);
                  void refetch();
                } catch {
                  /* toast no hook */
                }
              }}
            >
              {restoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Restaurar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="overflow-hidden border-0 shadow-sm bg-white">
            <DetalheVeiculoGallery vehicle={vehicle as Vehicle} />

            <div className="px-6 py-6 border-t border-gray-50 bg-gray-50/30 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ano Fab.</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900">{a.year_manufacture}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quilometragem</p>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900">{Number(a.mileage).toLocaleString("pt-BR")} km</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Câmbio</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900 capitalize">{a.transmission ?? "-"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Combustível</p>
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900 capitalize">{a.fuel ?? "-"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Tabs defaultValue="observacoes" className="w-full">
              <TabsList className="mb-6 bg-gray-100 max-w-fit p-1">
                <TabsTrigger value="observacoes">Observações</TabsTrigger>
                <TabsTrigger value="arquivos">Arquivos e Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="observacoes">
                {a.observations ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a.observations}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Nenhuma observação registrada.</p>
                )}
              </TabsContent>

              <TabsContent value="arquivos">
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((file, i) => (
                      <a
                        key={i}
                        href={mediaUrl(file.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{file.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 uppercase">{file.mime}</div>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Nenhum arquivo anexado.</p>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-[#0d120d] border-0 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-green-500/20 transition-all" />
            <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
              <DollarSign className="w-3 h-3 text-green-500" />
              Painel Financeiro
            </h3>

            <div className="space-y-5 relative z-10">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Investimento Pago</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {valorPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </p>
                </div>
                {valorFipe > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Tabela FIPE</p>
                    <p className="text-xs font-bold text-gray-300 mt-1 italic">
                      {valorFipe.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Preço de Venda</p>
                  <p className="text-3xl font-black text-green-400 mt-1">
                    {valorVenda > 0 ? (
                      valorVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                    ) : (
                      <span className="text-lg text-gray-500 italic">Não definido</span>
                    )}
                  </p>
                </div>
              </div>

              {valorVenda > 0 && (
                <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-green-500 uppercase">Lucro Estimado</p>
                    <TrendingUp className="w-4 h-4 text-green-500 animate-pulse" />
                  </div>
                  <p className="text-2xl font-black text-green-400 mt-1">
                    {lucroEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${Math.min(parseFloat(margemPct), 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-green-500">{margemPct}%</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <ProfitVsFipeBlock
                      variant="dark"
                      lucro={lucroEstimado}
                      precoVenda={valorVenda}
                      valorFipe={valorFipe > 0 ? valorFipe : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {a.status === "standby_nao_compra" && (
            <Card className="p-6 border border-[#E5E7EB]">
              <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-green-500" />
                Compra (opcional)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Portas</span>
                  <span className="font-semibold">{a.doors_count != null ? `${a.doors_count}P` : "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Último licenciamento</span>
                  <span className="font-semibold">{a.last_licensing_date || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="font-semibold">{a.purchase_entry_at || "-"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">KM entrada</span>
                  <span className="font-semibold">
                    {a.purchase_entry_mileage != null
                      ? `${Number(a.purchase_entry_mileage).toLocaleString("pt-BR")} km`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Fornecedor</span>
                  <span className="font-semibold truncate max-w-[60%] text-right">{supplierName}</span>
                </div>

                <Button
                  type="button"
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white mt-2"
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/vehicles/${encodeURIComponent(routeEntityId)}/confirm-purchase`, {
                        method: "POST",
                      });
                      toast.success("Compra confirmada e lançada no Financeiro.");
                    } catch (e: unknown) {
                      toast.apiError(e);
                    }
                  }}
                >
                  Confirmar compra
                </Button>
                <p className="text-xs text-muted-foreground">
                  Esta ação é o gatilho do lançamento automático no Financeiro (conforme contrato existente).
                </p>
              </div>
            </Card>
          )}

          <Card className="p-6 border border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Star className="w-3 h-3 text-green-500" />
              Avaliação técnica (resultado)
            </h3>
            {latestFinalScore != null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-lg font-bold">{latestFinalScore.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge
                    className={
                      latestFinalScore >= 8
                        ? "bg-[#DCFCE7] text-[#15803D] border-0"
                        : latestFinalScore >= 6
                          ? "bg-[#FEF3C7] text-[#B45309] border-0"
                          : "bg-[#FEE2E2] text-[#B91C1C] border-0"
                    }
                  >
                    {latestFinalScore >= 8 ? "Verde" : latestFinalScore >= 6 ? "Amarelo" : "Vermelho"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="text-sm font-medium">
                    {latestFinalAt ? new Date(latestFinalAt).toLocaleString("pt-BR") : "-"}
                  </span>
                </div>
                <Link href={`/avaliacao/${routeEntityId}`}>
                  <Button variant="outline" className="w-full mt-1">
                    Ver detalhes
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Nenhuma avaliação finalizada ainda.</p>
                <Link href={`/avaliacao/${routeEntityId}`}>
                  <Button className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white">
                    Iniciar avaliação técnica
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {days > 30 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Atenção em Estoque</p>
                <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                  Este veículo está há <strong>{days} dias</strong> parado. Considere revisão de preço ou ação de marketing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
