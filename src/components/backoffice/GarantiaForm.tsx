"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
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
import { useCreateWarranty, useUpdateWarranty, useWarranty } from "@/hooks/useWarranties";
import type { Client, Vehicle, WarrantyStatus, WarrantyType } from "@/types";
import { clientAttrs, vehicleAttrs, vehicleDisplayName } from "@/types";
import { numberToBRLMaskedFromReais, parseBRLMoney } from "@/lib/masks";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { strapiEntityId } from "@/lib/strapiEntity";

function clientEntityId(c: Client): string {
  return String(c.documentId ?? c.id);
}

const TYPE_OPTIONS: { value: WarrantyType; label: string }[] = [
  { value: "completa", label: "Completa" },
  { value: "motor_cambio", label: "Motor e câmbio" },
  { value: "motor", label: "Motor" },
  { value: "acessorios", label: "Acessórios" },
  { value: "outros", label: "Outros" },
];

const STATUS_OPTIONS: { value: WarrantyStatus; label: string }[] = [
  { value: "ativa", label: "Ativa" },
  { value: "vencendo", label: "Vence em breve" },
  { value: "expirada", label: "Expirada" },
  { value: "cancelada", label: "Cancelada" },
];

type Props = { routeId?: string };

export function GarantiaForm({ routeId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const veiculoParam = searchParams.get("veiculo") || "";
  const clienteParam = searchParams.get("cliente") || "";

  const isEditing = Boolean(routeId);

  const { data: vehiclesPayload = [], isLoading: loadingVehicles } = useVehicles();
  const { data: clientsPayload = [], isLoading: loadingClients } = useClients();
  const { data: warrantyPayload, isLoading: loadingWarranty, isError: errorWarranty } = useWarranty(
    isEditing ? routeId : undefined,
  );

  const createMutation = useCreateWarranty();
  const updateMutation = useUpdateWarranty();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [warrantyType, setWarrantyType] = useState<WarrantyType>("completa");
  const [status, setStatus] = useState<WarrantyStatus>("ativa");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [coverageValue, setCoverageValue] = useState("");
  const [notes, setNotes] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [clientId, setClientId] = useState("");

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
    if (!warrantyPayload || !isEditing) return;
    const a = warrantyPayload.attributes;
    setWarrantyType((a.warranty_type as WarrantyType) || "completa");
    setStatus((a.status as WarrantyStatus) || "ativa");
    const sd = a.start_date;
    setStartDate(sd ? sd.slice(0, 10) : new Date().toISOString().split("T")[0]);
    const ed = a.end_date;
    setEndDate(ed ? ed.slice(0, 10) : "");
    setCoverageValue(
      a.coverage_value != null && Number(a.coverage_value) > 0
        ? numberToBRLMaskedFromReais(Number(a.coverage_value))
        : "",
    );
    setNotes(String(a.notes ?? ""));
    const v = a.vehicle?.data;
    const cl = a.client?.data;
    setVehicleId(v ? strapiEntityId(v as Vehicle) : "");
    setClientId(cl ? clientEntityId(cl as Client) : "");
  }, [warrantyPayload, isEditing]);

  useEffect(() => {
    if (isEditing || !veiculoParam || vehicleId) return;
    if (vehicles.some((v) => v.id === veiculoParam)) setVehicleId(veiculoParam);
  }, [isEditing, veiculoParam, vehicles, vehicleId]);

  useEffect(() => {
    if (isEditing || !clienteParam || clientId) return;
    if (clients.some((c) => c.id === clienteParam)) setClientId(clienteParam);
  }, [isEditing, clienteParam, clients, clientId]);

  const loadingData = loadingVehicles || loadingClients || (isEditing && loadingWarranty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !clientId || !endDate) return;

    const listV = (vehiclesPayload as Vehicle[]) ?? [];
    const listC = (clientsPayload as Client[]) ?? [];
    const veh = listV.find((v) => strapiEntityId(v) === vehicleId);
    const cli = listC.find((c) => clientEntityId(c) === clientId);
    if (!veh || !cli) return;

    const payload: Record<string, unknown> = {
      warrantyType,
      status,
      startDate,
      endDate,
      coverageValue: parseBRLMoney(coverageValue) ?? 0,
      notes: notes.trim() || undefined,
      vehicleId: veh.id,
      clientId: cli.id,
    };

    if (isEditing && routeId) {
      await updateMutation.mutateAsync({ routeId, data: payload });
      router.push(`/garantias/${routeId}`);
    } else {
      await createMutation.mutateAsync(payload);
      router.push("/garantias");
    }
  };

  if (isEditing && errorWarranty) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Garantia não encontrada</AlertTitle>
          <AlertDescription className="text-red-700">Verifique o link ou volte à lista.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            {isEditing ? "Editar garantia" : "Nova garantia"}
          </h1>
          <p className="text-sm text-[#6B7280]">Dados salvos no banco do ERP</p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 border border-[#E5E7EB]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Veículo *</Label>
                    <Select value={vehicleId || undefined} onValueChange={setVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                    <Label>Cliente *</Label>
                    <Select value={clientId || undefined} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                  <div>
                    <Label>Tipo de cobertura *</Label>
                    <Select value={warrantyType} onValueChange={(v) => setWarrantyType(v as WarrantyType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as WarrantyStatus)}>
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
                    <DatePickerField label="Data de início *" required value={startDate} onChange={setStartDate} />
                  </div>
                  <div>
                    <DatePickerField label="Data de término *" required value={endDate} onChange={setEndDate} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Valor da cobertura (referência) *</Label>
                    <MaskedInput
                      mask="currency"
                      required
                      value={coverageValue}
                      onChange={(e) => setCoverageValue(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalhes da garantia..."
                  />
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-[#E5E7EB] h-fit">
              <p className="text-sm text-[#6B7280]">
                Vincule o veículo e o cliente beneficiário. O status pode ser ajustado quando a garantia estiver próxima
                do vencimento.
              </p>
            </Card>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={isSubmitting || !vehicleId || !clientId || !endDate}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
