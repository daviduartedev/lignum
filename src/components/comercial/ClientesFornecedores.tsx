"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Users, Building2, Loader2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClient, useClientsPage, useCreateClient, useDeleteClient, useUpdateClient } from "@/hooks/useClients";
import { useCrmSummary } from "@/hooks/useCrmSummary";
import { useSales } from "@/hooks/useSales";
import { FornecedoresPanel } from "@/components/comercial/FornecedoresPanel";
import {
  ClientFormFields,
  clientAttrsToFormValues,
  clientFormValuesToPayload,
  EMPTY_CLIENT_FORM,
  type ClientFormValues,
} from "@/components/comercial/ClientFormFields";
import { Pagination } from "@/components/ui/pagination";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { maskCPFCNPJ, maskPhoneBR } from "@/lib/masks";
import { clientAttrs } from "@/types";
import type { Client } from "@/types";

export function ClientesFornecedores() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data: pageData, isLoading, isError, refetch } = useClientsPage(page, { q: deferredSearch });
  const { data: crm, isLoading: loadingCrm } = useCrmSummary();
  const { data: rawSales = [] } = useSales();
  const deleteMutation = useDeleteClient();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"clientes" | "fornecedores">("clientes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ClientFormValues>(EMPTY_CLIENT_FORM);
  const { data: editingClient, isLoading: loadingEditingClient } = useClient(
    dialogOpen && editingRouteId ? editingRouteId : undefined,
  );

  const rawClients = pageData?.clients ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const normalizedClients = useMemo(() => {
    return rawClients.map((c: Client) => {
      const a = clientAttrs(c);
      const sales = rawSales.filter((s) => s.attributes.client?.data?.id === c.id);
      const totalGasto = sales.reduce((acc, s) => acc + (Number(s.attributes.final_price) || 0), 0);
      const compras = sales.length;
      const sortedSales = [...sales].sort(
        (x, y) =>
          new Date(y.attributes.sale_date).getTime() - new Date(x.attributes.sale_date).getTime(),
      );
      let ultimaCompra = "-";
      if (sortedSales.length > 0 && sortedSales[0].attributes.sale_date) {
        ultimaCompra = new Date(`${sortedSales[0].attributes.sale_date}T12:00:00`).toLocaleDateString("pt-BR");
      }
      return {
        id: c.documentId || String(c.id),
        routeId: String(c.documentId ?? c.id),
        nome: a.full_name || "Sem nome",
        documento: a.document || "-",
        telefone: a.phone || "-",
        email: a.email || "-",
        createdAt: a.createdAt,
        compras,
        totalGasto,
        ultimaCompra,
      };
    });
  }, [rawClients, rawSales]);

  const kpis = useMemo(
    () => ({
      total: crm?.totalClients ?? 0,
      ativos: crm?.clientsActiveLast6Months ?? 0,
      novosEsteMes: crm?.clientsNewThisMonth ?? 0,
      fornecedoresCount: crm?.totalSuppliers ?? 0,
    }),
    [crm],
  );

  const handleDeleteClient = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openCreateDialog = () => {
    setEditingRouteId(null);
    setFormValues(EMPTY_CLIENT_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (routeId: string) => {
    setEditingRouteId(routeId);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen || !editingRouteId || !editingClient) return;
    const a = clientAttrs(editingClient);
    const next = clientAttrsToFormValues(a);
    setFormValues({
      ...next,
      document: a.document ? maskCPFCNPJ(String(a.document)) : "",
      phone: a.phone ? maskPhoneBR(String(a.phone)) : "",
    });
  }, [dialogOpen, editingRouteId, editingClient]);

  const handleSaveClient = async () => {
    if (!formValues.fullName.trim() || !formValues.document.trim() || !formValues.email.trim()) return;
    const payload = clientFormValuesToPayload(formValues);
    if (editingRouteId) {
      await updateMutation.mutateAsync({ routeId: editingRouteId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
    setEditingRouteId(null);
    setFormValues(EMPTY_CLIENT_FORM);
  };

  const isSavingClient = createMutation.isPending || updateMutation.isPending;

  const loadingBlock = isLoading || loadingCrm;

  if (loadingBlock) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-green-500" />
        <p className="text-sm font-medium">Sincronizando dados…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Clientes e fornecedores</h1>
          <p className="text-sm text-[#6B7280]">Gestão de relacionamento</p>
        </div>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Falha ao carregar</AlertTitle>
          <AlertDescription className="text-red-700 flex flex-col items-start gap-4">
            <p>Não foi possível obter a lista de clientes.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">Clientes e fornecedores</h1>
        <p className="text-sm text-[#6B7280]">Gestão de relacionamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-[#6B7280]">Total clientes</div>
          </div>
          <div className="text-3xl font-black text-[#111827]">{kpis.total}</div>
          <div className="text-xs text-[#6B7280] font-medium mt-1">cadastros</div>
        </Card>

        <Card className="p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-[#6B7280]">Clientes ativos</div>
          </div>
          <div className="text-3xl font-black text-[#111827]">{kpis.ativos}</div>
          <div className="text-xs text-[#6B7280] font-medium mt-1 uppercase tracking-wide">compra ≤ 6 meses</div>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab("fornecedores")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab("fornecedores");
            }
          }}
          className="p-6 border border-[#E5E7EB] shadow-sm cursor-pointer transition-shadow hover:shadow-md hover:border-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60"
          aria-label={`Abrir separador Fornecedores, ${kpis.fornecedoresCount} cadastrados`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-[#6B7280]">Fornecedores</div>
          </div>
          <div className="text-3xl font-black text-[#111827]">{kpis.fornecedoresCount}</div>
          <div className="text-xs text-[#6B7280] font-medium mt-1 uppercase tracking-wide">clique para ver</div>
        </Card>

        <Card className="p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-sm font-medium text-[#6B7280]">Novos este mês</div>
          </div>
          <div className="text-3xl font-black text-[#111827]">{kpis.novosEsteMes}</div>
          <div className="text-xs text-[#6B7280] font-medium mt-1">cadastros no mês corrente</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clientes" | "fornecedores")} className="w-full">
        <TabsList className="bg-gray-100 p-1 w-full sm:w-auto flex flex-wrap gap-1 h-auto min-h-10">
          <TabsTrigger value="clientes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome ou documento…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white shrink-0" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo cliente
            </Button>
          </div>

          <Card className="overflow-hidden border border-border/80 shadow-sm min-w-0">
            <div className="px-4 pb-4 pt-3 md:px-6 md:pb-5 md:pt-4">
              <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border/80">
                      <th className={listingThText}>Cliente</th>
                      <th className={listingThText}>Documento</th>
                      <th className={listingThText}>Contato</th>
                      <th className={listingThStat}>Compras</th>
                      <th className={listingThStat}>Total</th>
                      <th className={listingThStat}>Última compra</th>
                      <th className={listingThActions}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    ) : (
                      normalizedClients.map((c) => (
                        <tr
                          key={c.routeId}
                          className="border-b border-border/80 last:border-0 transition-colors hover:bg-muted/40"
                        >
                          <td className={`${listingTdText} py-3.5`}>
                            <Link
                              href={`/clientes/${c.routeId}`}
                              className="font-semibold text-foreground hover:text-emerald-700"
                            >
                              {c.nome}
                            </Link>
                          </td>
                          <td className={`${listingTdText} py-3.5 text-sm text-muted-foreground`}>{c.documento}</td>
                          <td className={`${listingTdText} py-3.5 text-sm text-muted-foreground`}>
                            <div>{c.telefone}</div>
                            <div className="text-xs">{c.email}</div>
                          </td>
                          <td className={`${listingTdStat} py-3.5`}>
                            <ListingStatCell hideLabel label="Compras" value={c.compras} />
                          </td>
                          <td className={`${listingTdStat} py-3.5`}>
                            <ListingStatCell hideLabel
                              label="Total"
                              value={c.totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              valueClassName="text-green-700"
                            />
                          </td>
                          <td className={`${listingTdStat} py-3.5`}>
                            <ListingStatCell hideLabel label="Última compra" value={c.ultimaCompra} valueClassName="font-medium" />
                          </td>
                          <td className={`${listingTdActions} py-3.5`}>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(c.routeId)}>
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setDeleteTarget({ id: c.routeId, nome: c.nome })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {meta ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPageChange={setPage}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="fornecedores" className="mt-6">
          <FornecedoresPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingRouteId(null);
          setFormValues(EMPTY_CLIENT_FORM);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRouteId ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          {editingRouteId && loadingEditingClient ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
            <ClientFormFields
              values={formValues}
              onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
              idPrefix="crm-client"
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSavingClient}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={isSavingClient || (editingRouteId != null && loadingEditingClient)}
              onClick={() => void handleSaveClient()}
            >
              {isSavingClient ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `Será removido: ${deleteTarget.nome}. Esta ação não pode ser desfeita.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDeleteClient()}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
