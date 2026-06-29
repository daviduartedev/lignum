"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Loader2, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ListingStatCell, listingTdActions, listingTdStat, listingTdText, listingThActions, listingThStat, listingThText } from "@/components/ui/ListingStatCell";
import { PromissoriasLista } from "@/components/backoffice/PromissoriasLista";
import { useConfirmPayablePayment, useCreatePayable, usePayablesPage } from "@/hooks/usePayables";
import { Pagination } from "@/components/ui/pagination";
import { parseBRLMoney } from "@/lib/masks";
import { MAX_DECIMAL_14_2 } from "@/lib/money";
import { toast } from "@/lib/toast";
import { z } from "zod";

export function FinanceiroHub() {
  const [tab, setTab] = useState<"receber" | "pagar">("receber");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">Financeiro</h1>
        <p className="text-sm text-[#6B7280]">A Pagar e A Receber, vencimentos, parcelas e despesas</p>
      </div>

      <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1 w-fit">
        <Button
          type="button"
          variant={tab === "receber" ? "default" : "ghost"}
          className={tab === "receber" ? "bg-[#22C55E] hover:bg-[#16A34A] text-white" : ""}
          onClick={() => setTab("receber")}
        >
          A Receber
        </Button>
        <Button
          type="button"
          variant={tab === "pagar" ? "default" : "ghost"}
          className={tab === "pagar" ? "bg-[#22C55E] hover:bg-[#16A34A] text-white" : ""}
          onClick={() => setTab("pagar")}
        >
          A Pagar
        </Button>
      </div>

      {tab === "receber" ? <PromissoriasLista /> : <PayablesLista />}
    </div>
  );
}

const PAYABLE_DESCRIPTION_MAX = 2000;
const PAYABLE_NOTES_MAX = 16_000;

const createPayableSchema = z.object({
  origin: z.enum(["manual", "compra_veiculo", "outro"]),
  description: z
    .string()
    .min(1, "Informe a descrição.")
    .max(PAYABLE_DESCRIPTION_MAX, `A descrição pode ter no máximo ${PAYABLE_DESCRIPTION_MAX.toLocaleString("pt-BR")} caracteres.`),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecione a data de vencimento."),
  amount: z.string().min(1, "Informe o valor."),
  notes: z
    .string()
    .max(PAYABLE_NOTES_MAX, `As notas podem ter no máximo ${PAYABLE_NOTES_MAX.toLocaleString("pt-BR")} caracteres.`)
    .optional(),
});

const PAYABLE_ORIGIN_LABELS: Record<string, string> = {
  manual: "Manual",
  compra_veiculo: "Compra veículo",
  outro: "Outro",
};

function payableStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "paga":
      return { label: "Paga", className: "bg-[#DCFCE7] text-[#15803D] border-0" };
    case "vencida":
      return { label: "Vencida", className: "bg-[#FEE2E2] text-[#B91C1C] border-0" };
    case "cancelada":
      return { label: "Cancelada", className: "bg-[#F3F4F6] text-[#6B7280] border-0" };
    default:
      return { label: "Aberta", className: "bg-[#DBEAFE] text-[#1D4ED8] border-0" };
  }
}

function PayablesLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [origin, setOrigin] = useState<string>("todos");
  const { data: pageData, isLoading, isError, refetch } = usePayablesPage(page, {
    q: deferredSearch,
    status: statusFilter,
    origin,
  });
  const createPayable = useCreatePayable();
  const confirmPayment = useConfirmPayablePayment();

  const rawList = pageData?.items ?? [];
  const meta = pageData?.meta;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, origin]);

  useEffect(() => {
    if (!meta) return;
    if (page > meta.totalPages) setPage(Math.max(1, meta.totalPages));
  }, [meta, page]);

  const rows = useMemo(() => {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((p) => {
      const due = p.dueDate ? new Date(p.dueDate) : null;
      const amount = Number(p.amount) || 0;
      return {
        id: Number(p.id),
        desc: p.description || "-",
        origem: PAYABLE_ORIGIN_LABELS[p.origin] ?? p.origin,
        vencimento: due ? due.toLocaleDateString("pt-BR") : "-",
        valor: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        status: p.status,
        badge: payableStatusBadge(p.status),
        canConfirm: p.status === "aberta" || p.status === "vencida",
      };
    });
  }, [rawList]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [form, setForm] = useState({
    origin: "manual" as "manual" | "compra_veiculo" | "outro",
    description: "",
    dueDate: "",
    amount: "",
    notes: "",
    parcelado: false,
    totalInstallments: "3",
    intervalMonths: "1",
  });

  const submit = async () => {
    const parsed = createPayableSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Preencha os campos obrigatórios.";
      toast.error(first);
      return;
    }
    const amount = parseBRLMoney(parsed.data.amount);
    if (amount == null || amount <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }
    if (amount > MAX_DECIMAL_14_2) {
      toast.error(
        `Valor máximo permitido: ${MAX_DECIMAL_14_2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
      );
      return;
    }
    try {
      const body: Record<string, unknown> = {
        origin: parsed.data.origin,
        description: parsed.data.description.trim(),
        dueDate: parsed.data.dueDate,
        amount,
        notes: parsed.data.notes?.trim() || undefined,
        status: "aberta",
      };
      if (form.parcelado) {
        const totalInstallments = Math.max(1, parseInt(form.totalInstallments, 10) || 1);
        const intervalMonths = Math.max(1, parseInt(form.intervalMonths, 10) || 1);
        if (!parsed.data.dueDate) {
          toast.error("Informe a data do 1.º vencimento.");
          return;
        }
        body.installmentPlan = {
          totalInstallments,
          installmentAmount: amount,
          firstDueDate: parsed.data.dueDate,
          intervalMonths,
        };
      }
      await createPayable.mutateAsync(body);
      setDialogOpen(false);
      setForm({
        origin: "manual",
        description: "",
        dueDate: "",
        amount: "",
        notes: "",
        parcelado: false,
        totalInstallments: "3",
        intervalMonths: "1",
      });
    } catch {
      /* toast via mutation */
    }
  };

  const handleConfirmPayment = async () => {
    if (confirmId == null) return;
    try {
      await confirmPayment.mutateAsync(confirmId);
      setConfirmId(null);
    } catch {
      /* toast via mutation */
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#111827] mb-1">A Pagar</h2>
          <p className="text-sm text-[#6B7280]">Despesas e contas a pagar com vencimento</p>
        </div>
        <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova despesa
        </Button>
      </div>

      <Card className="p-6 border border-[#E5E7EB]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            placeholder="Buscar descrição..."
            className="max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            placeholder="Status (todos|aberta|vencida|paga|cancelada)"
            className="w-72"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Input
            placeholder="Origem (todos|manual|compra_veiculo|outro)"
            className="w-72"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-sm text-red-700">Erro ao carregar A Pagar.</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-[#6B7280]">Sem itens para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b">
                  <th className={`${listingThText} py-2 pr-3`}>Descrição</th>
                  <th className={`${listingThStat} py-2 pr-3`}>Origem</th>
                  <th className={`${listingThStat} py-2 pr-3`}>Vencimento</th>
                  <th className={`${listingThStat} py-2 pr-3`}>Valor</th>
                  <th className={`${listingThStat} py-2 pr-3`}>Status</th>
                  <th className={`${listingThActions} py-2 pr-3`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className={`${listingTdText} py-2 pr-3`}>{r.desc}</td>
                    <td className={`${listingTdStat} py-2 pr-3`}>
                      <ListingStatCell hideLabel label="Origem" value={r.origem} valueClassName="font-normal" />
                    </td>
                    <td className={`${listingTdStat} py-2 pr-3`}>
                      <ListingStatCell hideLabel label="Vencimento" value={r.vencimento} />
                    </td>
                    <td className={`${listingTdStat} py-2 pr-3 tabular-nums`}>
                      <ListingStatCell hideLabel label="Valor" value={r.valor} />
                    </td>
                    <td className={`${listingTdStat} py-2 pr-3`}>
                      <ListingStatCell hideLabel
                        label="Status"
                        value={<Badge className={r.badge.className}>{r.badge.label}</Badge>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={`${listingTdActions} py-2 pr-3`}>
                      {r.canConfirm ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-[#15803D] border-[#86EFAC] hover:bg-[#DCFCE7]"
                          disabled={confirmPayment.isPending}
                          onClick={() => setConfirmId(r.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Confirmar pagamento
                        </Button>
                      ) : (
                        <span className="text-[#9CA3AF]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova despesa (A Pagar)</DialogTitle>
            <DialogDescription>Registre uma despesa manual com valor e vencimento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Origem</Label>
              <Select
                value={form.origin}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, origin: v as "manual" | "compra_veiculo" | "outro" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="compra_veiculo">Compra veículo</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payable-description">Descrição</Label>
              <Input
                id="payable-description"
                value={form.description}
                maxLength={PAYABLE_DESCRIPTION_MAX}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Ex.: IPVA, manutenção oficina"
              />
              <p className="text-xs text-[#6B7280] mt-1">
                Máximo {PAYABLE_DESCRIPTION_MAX.toLocaleString("pt-BR")} caracteres
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePickerField
                  id="payable-due-date"
                  label={form.parcelado ? "1.º vencimento" : "Vencimento"}
                  value={form.dueDate}
                  onChange={(dueDate) => setForm((s) => ({ ...s, dueDate }))}
                />
              </div>
              <div>
                <Label htmlFor="payable-amount">{form.parcelado ? "Valor da parcela (BRL)" : "Valor (BRL)"}</Label>
                <MaskedInput
                  id="payable-amount"
                  mask="currency"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-4 py-3">
              <div>
                <Label htmlFor="payable-parcelado" className="text-sm font-medium">
                  Parcelado
                </Label>
                <p className="text-xs text-[#6B7280]">Gera várias contas a pagar com vencimentos periódicos</p>
              </div>
              <Switch
                id="payable-parcelado"
                checked={form.parcelado}
                onCheckedChange={(parcelado) => setForm((s) => ({ ...s, parcelado }))}
              />
            </div>
            {form.parcelado ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="payable-installments">N.º de parcelas</Label>
                  <Input
                    id="payable-installments"
                    type="number"
                    min={1}
                    max={120}
                    value={form.totalInstallments}
                    onChange={(e) => setForm((s) => ({ ...s, totalInstallments: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="payable-interval">Intervalo (meses)</Label>
                  <Input
                    id="payable-interval"
                    type="number"
                    min={1}
                    max={12}
                    value={form.intervalMonths}
                    onChange={(e) => setForm((s) => ({ ...s, intervalMonths: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <Label htmlFor="payable-notes">Notas</Label>
              <Textarea
                id="payable-notes"
                value={form.notes}
                maxLength={PAYABLE_NOTES_MAX}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              />
              <p className="text-xs text-[#6B7280] mt-1">
                Máximo {PAYABLE_NOTES_MAX.toLocaleString("pt-BR")} caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={createPayable.isPending}
              onClick={() => void submit()}
            >
              {createPayable.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmId != null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta será marcada como paga com data de pagamento de hoje. Esta ação pode ser revertida apenas
              editando o registro manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmPayment.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#22C55E] hover:bg-[#16A34A]"
              disabled={confirmPayment.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmPayment();
              }}
            >
              {confirmPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
