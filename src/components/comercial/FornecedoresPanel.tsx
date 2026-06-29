"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { maskCPFCNPJ, maskPhoneBR } from "@/lib/masks";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, RefreshCw, Search } from "lucide-react";
import {
  useSuppliersPage,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useSuppliers";
import { useDocumentLookupSupplier } from "@/hooks/useDocumentLookup";
import { Pagination } from "@/components/ui/pagination";
import { EntityAvatar, StitchTableShell } from "@/components/ui/stitch";
import { listingTdActions, listingTdText, listingThActions, listingThText } from "@/components/ui/ListingStatCell";
import type { Supplier } from "@/types";

function attr(s: Supplier) {
  return (s as { attributes?: Supplier["attributes"] }).attributes || (s as unknown as Supplier["attributes"]);
}

export function FornecedoresPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data: pageData, isLoading, isError, refetch } = useSuppliersPage(page, { q: deferredSearch });
  const rawList = pageData?.suppliers ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");

  const supplierLookupFields = () => ({
    companyName,
    document,
    phone,
    email,
    notes,
    zipCode: "",
    street: "",
    streetNumber: "",
    addressComplement: "",
    neighborhood: "",
    city: "",
    registrationStatus,
  });

  const lookupMutation = useDocumentLookupSupplier((patch) => {
    if (patch.companyName) setCompanyName(patch.companyName);
    if (patch.phone) setPhone(patch.phone);
    if (patch.email) setEmail(patch.email);
    if (patch.registrationStatus) setRegistrationStatus(patch.registrationStatus);
  });

  const rows = useMemo(() => {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((s) => {
      const a = attr(s as Supplier);
      return {
        raw: s as Supplier,
        id: (s as Supplier).documentId || String((s as Supplier).id),
        nome: a.company_name || "-",
        documento: a.document || "-",
        telefone: a.phone || "-",
        email: a.email || "-",
      };
    });
  }, [rawList]);

  const openCreate = () => {
    setEditing(null);
    setCompanyName("");
    setDocument("");
    setPhone("");
    setEmail("");
    setNotes("");
    setRegistrationStatus("");
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    const a = attr(s);
    setEditing(s);
    setCompanyName(a.company_name || "");
    setDocument(a.document ? maskCPFCNPJ(String(a.document)) : "");
    setPhone(a.phone ? maskPhoneBR(String(a.phone)) : "");
    setEmail(a.email || "");
    setNotes(a.notes || "");
    setRegistrationStatus(a.registration_status || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = companyName.trim();
    if (!name) return;
    const payload: Record<string, unknown> = {
      companyName: name,
      document: document.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      registrationStatus: registrationStatus.trim() || undefined,
    };
    if (editing) {
      const routeId = String(editing.documentId ?? editing.id);
      await updateMutation.mutateAsync({ routeId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const routeId = String(deleteTarget.documentId ?? deleteTarget.id);
    await deleteMutation.mutateAsync(routeId);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-8 h-8 mb-3 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Carregando fornecedores…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Fornecedores indisponíveis</AlertTitle>
        <AlertDescription className="text-red-700 space-y-2">
          <p>Não foi possível obter a lista de fornecedores.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <StitchTableShell
        toolbar={
          <>
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor…"
                className="pl-9 bg-muted/50 border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="button" className="shrink-0" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Novo fornecedor
            </Button>
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
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Fornecedor</th>
              <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>CNPJ / documento</th>
              <th className={`${listingThText} text-xs uppercase tracking-wider text-muted-foreground`}>Contato</th>
              <th className={`${listingThActions} text-xs uppercase tracking-wider text-muted-foreground`}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum fornecedor cadastrado.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className={`${listingTdText} py-4`}>
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={r.nome} variant="supplier" />
                      <span className="text-sm font-medium text-foreground">{r.nome}</span>
                    </div>
                  </td>
                  <td className={`${listingTdText} py-4 text-sm tabular-nums text-muted-foreground`}>{r.documento}</td>
                  <td className={`${listingTdText} py-4 text-sm text-muted-foreground`}>
                    <div>{r.telefone}</div>
                    <div className="text-xs">{r.email}</div>
                  </td>
                  <td className={`${listingTdActions} py-4`}>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(r.raw)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(r.raw)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="sup-name">Razão social / nome *</Label>
              <Input
                id="sup-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sup-doc">CNPJ / documento</Label>
              <div className="flex gap-2 mt-1">
                <MaskedInput
                  id="sup-doc"
                  mask="cpf_cnpj"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={lookupMutation.isPending || !document.trim()}
                  onClick={() => lookupMutation.mutate(supplierLookupFields())}
                >
                  {lookupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            {registrationStatus ? (
              <div>
                <Label htmlFor="sup-reg">Situação cadastral</Label>
                <Input id="sup-reg" value={registrationStatus} readOnly className="mt-1 bg-muted/40" />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sup-phone">Telefone</Label>
                <MaskedInput
                  id="sup-phone"
                  mask="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sup-email">E-mail</Label>
                <Input
                  id="sup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sup-notes">Observações</Label>
              <Textarea id="sup-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!companyName.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remover"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
