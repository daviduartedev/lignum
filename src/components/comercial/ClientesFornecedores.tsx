"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { EntityAvatar, StitchKpiCard, StitchPageHeader, StitchTableShell } from "@/components/ui/stitch";
import { cn } from "@/components/ui/utils";
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
import { useDocumentLookupClient } from "@/hooks/useDocumentLookup";
import { Pagination } from "@/components/ui/pagination";
import { listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
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
  const lookupMutation = useDocumentLookupClient((patch) =>
    setFormValues((prev) => ({ ...prev, ...patch })),
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
        cidade: a.city || "—",
        personType: a.person_type,
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
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-primary" />
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
      <StitchPageHeader
        title="Base de Clientes & Fornecedores"
        description="Gerencie relacionamentos comerciais, consulte créditos e dados cadastrais."
        actions={
          activeTab === "clientes" ? (
            <>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4" />
                Novo cliente
              </Button>
            </>
          ) : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StitchKpiCard label="Total de clientes" value={kpis.total} sublabel="cadastros" icon={Users} />
        <StitchKpiCard
          label="Clientes ativos"
          value={kpis.ativos}
          sublabel="compra nos últimos 6 meses"
          icon={Users}
        />
        <button
          type="button"
          onClick={() => setActiveTab("fornecedores")}
          className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StitchKpiCard
            label="Fornecedores"
            value={kpis.fornecedoresCount}
            sublabel="clique para ver a lista"
            icon={Building2}
          />
        </button>
        <StitchKpiCard label="Novos este mês" value={kpis.novosEsteMes} sublabel="cadastros no mês corrente" icon={Users} />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clientes" | "fornecedores")} className="w-full">
        <TabsContent value="clientes" className="mt-0 space-y-4">
          <StitchTableShell
            toolbar={
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-colors",
                      activeTab === "clientes"
                        ? "bg-muted border-border text-foreground"
                        : "text-muted-foreground border-transparent hover:bg-muted/50",
                    )}
                    onClick={() => setActiveTab("clientes")}
                  >
                    Clientes
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide text-muted-foreground border border-transparent hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveTab("fornecedores")}
                  >
                    Fornecedores
                  </button>
                </div>
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou documento…"
                    className="pl-9 bg-muted/50 border-border"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </>
            }
            footer={
              meta ? (
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              ) : null
            }
          >
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Nome / Razão social</th>
                  <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>CPF / CNPJ</th>
                  <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Telefone</th>
                  <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Cidade</th>
                  <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Tipo</th>
                  <th className={`${listingThStat} text-xs uppercase tracking-wider text-muted-foreground`}>Última compra</th>
                  <th className={`${listingThActions} text-xs uppercase tracking-wider text-muted-foreground`}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {normalizedClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  normalizedClients.map((c) => (
                    <tr key={c.routeId} className="hover:bg-muted/30 transition-colors">
                      <td className={`${listingTdText} py-4`}>
                        <div className="flex items-center gap-3">
                          <EntityAvatar name={c.nome} variant="client" />
                          <Link href={`/clientes/${c.routeId}`} className="font-medium text-foreground hover:text-primary">
                            {c.nome}
                          </Link>
                        </div>
                      </td>
                      <td className={`${listingTdText} py-4 text-sm tabular-nums text-muted-foreground`}>{c.documento}</td>
                      <td className={`${listingTdText} py-4 text-sm text-muted-foreground`}>{c.telefone}</td>
                      <td className={`${listingTdText} py-4 text-sm text-muted-foreground`}>{c.cidade}</td>
                      <td className={`${listingTdText} py-4`}>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                          {c.personType === "PJ" ? "PJ" : c.personType === "PF" ? "PF" : "Cliente"}
                        </Badge>
                      </td>
                      <td className={`${listingTdStat} py-4 text-sm tabular-nums text-muted-foreground`}>{c.ultimaCompra}</td>
                      <td className={`${listingTdActions} py-4`}>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(c.routeId)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
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
          </StitchTableShell>
        </TabsContent>

        <TabsContent value="fornecedores" className="mt-0">
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
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ClientFormFields
              values={formValues}
              onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
              idPrefix="crm-client"
              onLookupCnpj={() => lookupMutation.mutate(formValues)}
              lookupPending={lookupMutation.isPending}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSavingClient}>
              Cancelar
            </Button>
            <Button
              type="button"
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
