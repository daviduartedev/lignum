"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { apiFetch } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import {
  PROMISSORY_NOTES_QUERY_KEY,
  useCreatePromissoryNote,
  usePromissoryNote,
  useUpdatePromissoryNote,
} from "@/hooks/usePromissoryNotes";
import { VEHICLES_QUERY_KEY } from "@/hooks/useVehicles";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";
import type { Client, PromissoryNote, PromissoryNoteStatus, Vehicle } from "@/types";
import { clientAttrs, vehicleAttrs, vehicleDisplayName } from "@/types";
import { numberToBRLMaskedFromReais, parseBRLMoney } from "@/lib/masks";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { strapiEntityId } from "@/lib/strapiEntity";

function clientEntityId(c: Client): string {
  return String(c.documentId ?? c.id);
}

const STATUS_OPTIONS: { value: PromissoryNoteStatus; label: string }[] = [
  { value: "aberta", label: "Em aberto" },
  { value: "paga", label: "Paga" },
  { value: "vencida", label: "Vencida" },
  { value: "cancelada", label: "Cancelada" },
];

type Props = { routeId?: string };

export function PromissoriaForm({ routeId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteParam = searchParams.get("cliente") || "";
  const veiculoParam = searchParams.get("veiculo") || "";

  const isEditing = Boolean(routeId);
  const queryClient = useQueryClient();

  const { data: vehiclesPayload = [], isLoading: loadingVehicles } = useVehicles();
  const { data: clientsPayload = [], isLoading: loadingClients } = useClients();
  const { data: notePayload, isLoading: loadingNote, isError: errorNote } = usePromissoryNote(
    isEditing ? routeId : undefined,
  );

  const createMutation = useCreatePromissoryNote();
  const updateMutation = useUpdatePromissoryNote();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [installmentNumber, setInstallmentNumber] = useState("1");
  const [totalInstallments, setTotalInstallments] = useState("12");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PromissoryNoteStatus>("aberta");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState("12");
  const [intervalMonths, setIntervalMonths] = useState("1");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const vehicles = useMemo(() => {
    const list = (Array.isArray(vehiclesPayload) ? vehiclesPayload : []) as Vehicle[];
    return list.map((v) => {
      const idStr = strapiEntityId(v);
      const plate = vehicleAttrs(v).plate ?? "";
      return { id: idStr, label: `${vehicleDisplayName(v)}, ${plate}` };
    });
  }, [vehiclesPayload]);

  const clients = useMemo(() => {
    const list = (Array.isArray(clientsPayload) ? clientsPayload : []) as Client[];
    return list.map((c) => {
      const idStr = clientEntityId(c);
      const a = clientAttrs(c);
      return { id: idStr, label: `${a.full_name ?? "-"}, ${a.document ?? ""}` };
    });
  }, [clientsPayload]);

  useEffect(() => {
    if (!notePayload || !isEditing) return;
    const a = notePayload.attributes;
    setInstallmentNumber(String(a.installment_number ?? 1));
    setTotalInstallments(String(a.total_installments ?? 1));
    const dd = a.due_date;
    setDueDate(dd ? dd.slice(0, 10) : "");
    setAmount(
      a.amount != null && Number(a.amount) > 0 ? numberToBRLMaskedFromReais(Number(a.amount)) : "",
    );
    setStatus((a.status as PromissoryNoteStatus) || "aberta");
    const pd = a.payment_date;
    setPaymentDate(pd ? pd.slice(0, 10) : "");
    setNotes(String(a.notes ?? ""));
    const cl = a.client?.data;
    const v = a.vehicle?.data;
    setClientId(cl ? clientEntityId(cl as Client) : "");
    setVehicleId(v ? strapiEntityId(v as Vehicle) : "");
  }, [notePayload, isEditing]);

  useEffect(() => {
    if (isEditing || !clienteParam || clientId) return;
    if (clients.some((c) => c.id === clienteParam)) setClientId(clienteParam);
  }, [isEditing, clienteParam, clients, clientId]);

  useEffect(() => {
    if (isEditing || !veiculoParam || vehicleId) return;
    if (vehicles.some((v) => v.id === veiculoParam)) setVehicleId(veiculoParam);
  }, [isEditing, veiculoParam, vehicles, vehicleId]);

  const loadingData = loadingVehicles || loadingClients || (isEditing && loadingNote);
  const busy = isSubmitting || batchSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !dueDate || !vehicleId) {
      toast.error("Selecione cliente, veículo e vencimento.");
      return;
    }

    const listV = (vehiclesPayload as Vehicle[]) ?? [];
    const listC = (clientsPayload as Client[]) ?? [];
    const veh = listV.find((v) => strapiEntityId(v) === vehicleId);
    const cli = listC.find((c) => clientEntityId(c) === clientId);
    if (!veh || !cli) {
      toast.error("Selecione cliente e veículo válidos.");
      return;
    }

    if (!isEditing && batchMode) {
      const n = Math.max(1, parseInt(batchCount, 10) || 1);
      const interval = Math.max(1, parseInt(intervalMonths, 10) || 1);
      const amt = parseBRLMoney(amount) ?? 0;
      if (!amt) {
        toast.error("Informe o valor de cada parcela.");
        return;
      }
      setBatchSubmitting(true);
      try {
        const base = new Date(`${dueDate}T12:00:00`);
        for (let i = 0; i < n; i++) {
          const d = new Date(base);
          d.setMonth(d.getMonth() + i * interval);
          const body: Record<string, unknown> = {
            installmentNumber: i + 1,
            totalInstallments: n,
            dueDate: d.toISOString().split("T")[0],
            amount: amt,
            status,
            notes: notes.trim() || undefined,
            clientId: cli.id,
            vehicleId: veh.id,
          };
          if (paymentDate.trim()) body.paymentDate = paymentDate;
          else if (status === "paga") body.paymentDate = new Date().toISOString().split("T")[0];
          await apiFetch<unknown>("/api/promissory-notes", {
            method: "POST",
            body: JSON.stringify(body),
          });
        }
        void queryClient.invalidateQueries({ queryKey: PROMISSORY_NOTES_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
        toast.success(`${n} parcelas criadas.`);
        router.push("/financeiro?tab=receber");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar parcelas.");
      } finally {
        setBatchSubmitting(false);
      }
      return;
    }

    const payload: Record<string, unknown> = {
      installmentNumber: parseInt(installmentNumber, 10) || 1,
      totalInstallments: parseInt(totalInstallments, 10) || 1,
      dueDate,
      amount: parseBRLMoney(amount) ?? 0,
      status,
      notes: notes.trim() || undefined,
      clientId: cli.id,
      vehicleId: veh.id,
    };
    if (paymentDate.trim()) payload.paymentDate = paymentDate;
    else if (status === "paga") payload.paymentDate = new Date().toISOString().split("T")[0];

    if (isEditing && routeId) {
      await updateMutation.mutateAsync({ routeId, data: payload });
      router.push(`/promissorias/${routeId}`);
    } else {
      await createMutation.mutateAsync(payload);
      router.push("/financeiro?tab=receber");
    }
  };

  if (isEditing && errorNote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Promissória não encontrada</AlertTitle>
          <AlertDescription className="text-red-700">Verifique o link ou volte à lista.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={busy}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            {isEditing ? "Editar promissória" : "Nova promissória"}
          </h1>
          <p className="text-sm text-[#6B7280]">Cada registro é uma parcela com vencimento; ao pagar, preencha a data de pagamento.</p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          {!isEditing && (
            <Card className="mb-6 p-4 border border-dashed border-[#86EFAC] bg-[#F0FDF4]/40">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="batch-mode"
                  checked={batchMode}
                  onCheckedChange={(c) => setBatchMode(c === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-3">
                  <Label htmlFor="batch-mode" className="text-sm font-medium cursor-pointer leading-snug">
                    Gerar várias parcelas (mesmo valor por parcela, vencimentos a partir da primeira data)
                  </Label>
                  {batchMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min={1}
                          value={batchCount}
                          onChange={(e) => setBatchCount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Intervalo (meses)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={intervalMonths}
                          onChange={(e) => setIntervalMonths(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 border border-[#E5E7EB]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Cliente *</Label>
                    <Select value={clientId || undefined} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Veículo *</Label>
                    <Select value={vehicleId || undefined} onValueChange={setVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Parcela atual *</Label>
                    <Input
                      type="number"
                      min={1}
                      required={!batchMode}
                      disabled={batchMode && !isEditing}
                      value={installmentNumber}
                      onChange={(e) => setInstallmentNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total de parcelas *</Label>
                    <Input
                      type="number"
                      min={1}
                      required={!batchMode}
                      disabled={batchMode && !isEditing}
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Valor *</Label>
                    <MaskedInput
                      mask="currency"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <DatePickerField label="Vencimento *" required value={dueDate} onChange={setDueDate} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as PromissoryNoteStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <DatePickerField label="Data de pagamento" value={paymentDate} onChange={setPaymentDate} />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-[#E5E7EB] h-fit">
              <p className="text-sm text-[#6B7280]">
                <strong>Vencimento</strong> é o prazo para pagar a parcela. <strong>Data de pagamento</strong> quando
                estiver quitada. Use o modo em lote para criar o cronograma completo de uma vez.
              </p>
            </Card>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={busy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={busy || !clientId || !dueDate || !vehicleId || (batchMode && !isEditing ? !amount : false)}
            >
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {batchMode && !isEditing ? "Gerar parcelas" : "Salvar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
