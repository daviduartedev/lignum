"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StitchKpiCard, StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import {
  listingTdActions,
  listingTdStat,
  listingTdText,
  listingThActions,
  listingThStat,
  listingThText,
} from "@/components/ui/ListingStatCell";
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployeeProductivity,
  useEmployeesPage,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import type { EmployeeDto } from "@/lib/mappers/employee";
import {
  employeeInitials,
  employeeStatusBadgeClass,
  employeeStatusLabel,
} from "@/lib/employeeLabels";
import { cn } from "@/components/ui/utils";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

type FormState = {
  name: string;
  roleTitle: string;
  commissionPct: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  roleTitle: "",
  commissionPct: "",
  isActive: true,
};

function EmployeeProductivityDrawer({
  employee,
  open,
  onClose,
}: {
  employee: EmployeeDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useEmployeeProductivity(open && employee ? String(employee.id) : undefined);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="fixed top-0 right-0 left-auto h-full max-h-screen w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l sm:rounded-none">
        <DialogHeader>
          <DialogTitle>{employee?.name ?? "Funcionário"}</DialogTitle>
          <p className="text-sm text-muted-foreground">{employee?.roleTitle}</p>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-surface-container-low p-3 text-center">
                <p className="text-xs text-muted-foreground">Total OPs</p>
                <p className="text-xl font-bold">{data.totalAssigned}</p>
              </div>
              <div className="rounded-lg border bg-surface-container-low p-3 text-center">
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-xl font-bold text-emerald-700">{data.completedCount}</p>
              </div>
              <div className="rounded-lg border bg-surface-container-low p-3 text-center">
                <p className="text-xs text-muted-foreground">Em andamento</p>
                <p className="text-xl font-bold text-secondary">{data.inProgressCount}</p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">OPs concluídas recentes</h4>
              {data.recentCompleted.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma OP concluída ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recentCompleted.map((op) => (
                    <li key={op.productionOrderId} className="rounded-lg border px-3 py-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-secondary">{op.orderNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(op.completedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{op.clientName}</p>
                      {op.bodyModelName && (
                        <p className="text-xs text-muted-foreground">{op.bodyModelName}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function FuncionariosLista() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const deferredSearch = useDeferredValue(search.trim());

  const [drawerEmployee, setDrawerEmployee] = useState<EmployeeDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const { data, isLoading, isError, refetch } = useEmployeesPage(page, {
    q: deferredSearch,
    activeOnly: statusFilter === "active",
    inactiveOnly: statusFilter === "inactive",
    pageSize: 15,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  const kpis = useMemo(() => {
    const active = items.filter((e) => e.isActive).length;
    const withOrders = items.filter((e) => (e.assignedOrdersCount ?? 0) > 0).length;
    return {
      total: meta?.total ?? items.length,
      active,
      withOrders,
      completedSum: items.reduce((s, e) => s + (e.completedOrdersCount ?? 0), 0),
    };
  }, [items, meta?.total]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(emp: EmployeeDto) {
    setEditing(emp);
    setForm({
      name: emp.name,
      roleTitle: emp.roleTitle,
      commissionPct: emp.commissionPct != null ? String(emp.commissionPct) : "",
      isActive: emp.isActive,
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      roleTitle: form.roleTitle.trim(),
      isActive: form.isActive,
    };
    const pct = form.commissionPct.trim();
    if (pct) payload.commissionPct = Number(pct.replace(",", "."));

    if (editing) {
      await updateMutation.mutateAsync({ routeId: String(editing.id), data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <StitchPageHeader
        title="Funcionários"
        description="Gerencie colaboradores da produção e acompanhe produtividade."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo funcionário
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StitchKpiCard label="Total cadastrados" value={String(kpis.total)} tone="primary" solid />
        <StitchKpiCard label="Ativos" value={String(kpis.active)} tone="success" solid />
        <StitchKpiCard label="Em OPs" value={String(kpis.withOrders)} tone="warning" solid />
        <StitchKpiCard label="OPs concluídas (soma)" value={String(kpis.completedSum)} tone="accent" solid />
      </div>

      <StitchSectionCard
        title="Equipe"
        noPadding
        headerEnd={
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou cargo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando…
          </div>
        ) : isError ? (
          <div className="py-12 text-center">
            <p className="text-destructive">Erro ao carregar funcionários.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className={listingThText}>Funcionário</th>
                    <th className={listingThText}>Cargo</th>
                    <th className={listingThStat}>OPs</th>
                    <th className={listingThStat}>Concluídas</th>
                    <th className={listingThStat}>Comissão %</th>
                    <th className={listingThText}>Status</th>
                    <th className={listingThActions} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Nenhum funcionário encontrado.
                      </td>
                    </tr>
                  ) : (
                    items.map((emp) => (
                      <tr
                        key={emp.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setDrawerEmployee(emp)}
                      >
                        <td className={listingTdText}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary shrink-0">
                              {employeeInitials(emp.name)}
                            </div>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className={listingTdText}>{emp.roleTitle}</td>
                        <td className={listingTdStat}>{emp.assignedOrdersCount ?? 0}</td>
                        <td className={listingTdStat}>{emp.completedOrdersCount ?? 0}</td>
                        <td className={listingTdStat}>
                          {emp.commissionPct != null ? `${emp.commissionPct}%` : "—"}
                        </td>
                        <td className={listingTdText}>
                          <Badge className={cn("border", employeeStatusBadgeClass(emp.isActive))}>
                            {employeeStatusLabel(emp.isActive)}
                          </Badge>
                        </td>
                        <td className={listingTdActions}>
                          {isAdmin && (
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(String(emp.id))}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex justify-center">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </StitchSectionCard>

      <EmployeeProductivityDrawer
        employee={drawerEmployee}
        open={!!drawerEmployee}
        onClose={() => setDrawerEmployee(null)}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emp-name">Nome</Label>
              <Input
                id="emp-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="emp-role">Cargo</Label>
              <Input
                id="emp-role"
                value={form.roleTitle}
                onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))}
                placeholder="Ex.: Marceneiro, Pintor"
              />
            </div>
            <div>
              <Label htmlFor="emp-pct">Comissão % (opcional)</Label>
              <Input
                id="emp-pct"
                value={form.commissionPct}
                onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Ativo
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
