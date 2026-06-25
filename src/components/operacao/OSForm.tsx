"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Save, Plus, Trash2, Upload, Loader2, AlertCircle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useCreateSupplier, useSuppliers } from "@/hooks/useSuppliers";
import { useCreateServiceOrder, useServiceOrder, useUpdateServiceOrder } from "@/hooks/useServiceOrders";
import { uploadFiles } from "@/services/internal/vehicleCrud";
import type {
  ServiceOrder,
  ServiceOrderLaborLine,
  ServiceOrderPartLine,
  ServiceOrderStatus,
  ServiceOrderType,
  Supplier,
  Vehicle,
} from "@/types";
import { strapiEntityId, vehicleSelectLabel } from "@/lib/strapiEntity";
import { toast } from "@/lib/toast";
import {
  maskDecimal2,
  numberToBRLMaskedFromReais,
  parseBRLMoney,
  parseDecimal2,
} from "@/lib/masks";

function newKey(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random()}`;
}

const SERVICE_TYPES: { value: ServiceOrderType; label: string }[] = [
  { value: "manutencao", label: "Manutenção" },
  { value: "revisao", label: "Revisão" },
  { value: "funilaria", label: "Funilaria" },
  { value: "eletrica", label: "Elétrica" },
  { value: "mecanica", label: "Mecânica" },
  { value: "estetica", label: "Estética" },
  { value: "outros", label: "Outros" },
];

const STATUS_VALUES: { value: ServiceOrderStatus; label: string }[] = [
  { value: "aguardando", label: "Aguardando" },
  { value: "andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

type ServiceRowKind = "parts" | "labor";

interface ServiceRow {
  key: string;
  kind: ServiceRowKind;
  descricao: string;
  quantidade: number;
  valorUnit: number;
}

function emptyServiceRow(): ServiceRow {
  return { key: newKey("s"), kind: "labor", descricao: "", quantidade: 1, valorUnit: 0 };
}

function buildServicePayload(rows: ServiceRow[]): {
  partsPayload: ServiceOrderPartLine[];
  laborPayload: ServiceOrderLaborLine[];
} {
  const filled = rows.filter((r) => r.descricao.trim().length > 0);
  const partsPayload: ServiceOrderPartLine[] = [];
  const laborPayload: ServiceOrderLaborLine[] = [];

  for (const r of filled) {
    const q = Math.max(0, r.quantidade);
    const vu = Math.max(0, r.valorUnit);
    const vt = q * vu;
    if (r.kind === "parts") {
      partsPayload.push({
        descricao: r.descricao.trim(),
        quantidade: q,
        valor_unit: vu,
        valor_total: vt,
      });
    } else {
      laborPayload.push({
        descricao: r.descricao.trim(),
        horas: q,
        valor_hora: vu,
        valor_total: vt,
      });
    }
  }

  return { partsPayload, laborPayload };
}

export type OSFormProps = {
  routeId?: string;
  veiculoInicial?: string;
  modoInicial?: string;
};

export function OSForm({ routeId, veiculoInicial, modoInicial }: OSFormProps) {
  const router = useRouter();
  const isEditing = Boolean(routeId);
  const somenteLeitura = modoInicial === "visualizar" || modoInicial === "ver";

  const { data: vehiclesPayload = [], isLoading: loadingVehicles } = useVehicles();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const { data: orderPayload, isLoading: loadingOrder, isError: errorOrder } = useServiceOrder(
    isEditing ? routeId : undefined,
  );

  const createMutation = useCreateServiceOrder();
  const updateMutation = useUpdateServiceOrder();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [supplierId, setSupplierId] = useState("");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [serviceType, setServiceType] = useState<ServiceOrderType>("manutencao");
  const [serviceTypeOtherText, setServiceTypeOtherText] = useState("");
  const [status, setStatus] = useState<ServiceOrderStatus>("aguardando");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [responsible, setResponsible] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([emptyServiceRow()]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);

  const vehicles = useMemo(() => {
    const list = (Array.isArray(vehiclesPayload) ? vehiclesPayload : []) as Vehicle[];
    return list.map((v) => ({
      id: strapiEntityId(v),
      label: vehicleSelectLabel(v),
    }));
  }, [vehiclesPayload]);

  const selectedSupplierName = useMemo(() => {
    if (!supplierId) return "";
    const match = (Array.isArray(suppliers) ? suppliers : []).find(
      (s) => String((s as Supplier).id) === supplierId,
    ) as Supplier | undefined;
    return match?.attributes?.company_name?.trim() ?? "";
  }, [supplierId, suppliers]);

  useEffect(() => {
    if (!orderPayload || !isEditing) return;
    const raw = orderPayload as ServiceOrder;
    const a = raw.attributes;
    const workshopName = String(a.workshop_name ?? "").trim();
    const match = (Array.isArray(suppliers) ? suppliers : []).find(
      (s) => ((s as Supplier).attributes?.company_name ?? "").trim() === workshopName,
    ) as Supplier | undefined;
    setSupplierId(match ? String(match.id) : "");
    setServiceType(a.service_type || "manutencao");
    setServiceTypeOtherText(String(a.service_type_other_text ?? ""));
    setStatus(a.status || "aguardando");
    const ed = a.entry_date;
    setEntryDate(ed ? ed.slice(0, 10) : new Date().toISOString().split("T")[0] ?? "");
    setResponsible(String(a.responsible ?? ""));
    setDescription(String(a.description ?? ""));
    const veh = a.vehicle?.data;
    setVehicleId(veh ? strapiEntityId(veh as Vehicle) : "");

    const pj = a.parts_json;
    const partLines: ServiceOrderPartLine[] = Array.isArray(pj) ? pj : [];
    const lj = a.labor_json;
    const laborLines: ServiceOrderLaborLine[] = Array.isArray(lj) ? lj : [];
    const fromParts: ServiceRow[] = partLines.map((p) => ({
      key: newKey("s"),
      kind: "parts",
      descricao: p.descricao,
      quantidade: Number(p.quantidade) || 0,
      valorUnit: Number(p.valor_unit) || 0,
    }));
    const fromLabor: ServiceRow[] = laborLines.map((l) => ({
      key: newKey("s"),
      kind: "labor",
      descricao: l.descricao,
      quantidade: Number(l.horas) || 0,
      valorUnit: Number(l.valor_hora) || 0,
    }));
    const merged = [...fromParts, ...fromLabor];
    setServices(merged.length ? merged : [emptyServiceRow()]);

    setExistingPhotoUrls(a.photo_urls ?? []);
  }, [orderPayload, isEditing, suppliers]);

  useEffect(() => {
    if (isEditing || !veiculoInicial || vehicleId) return;
    const match = vehicles.some((v) => v.id === veiculoInicial);
    if (match) setVehicleId(veiculoInicial);
  }, [isEditing, veiculoInicial, vehicles, vehicleId]);

  const totalServico = useMemo(
    () => services.reduce((acc, s) => acc + Math.max(0, s.quantidade) * Math.max(0, s.valorUnit), 0),
    [services],
  );
  const custoTotal = totalServico;

  const updateService = useCallback((key: string, patch: Partial<ServiceRow>) => {
    setServices((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }, []);

  const onPickPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setNewPhotoFiles((prev) => [...prev, ...Array.from(files).slice(0, 12 - prev.length)]);
    e.target.value = "";
  }, []);

  const removeNewPhoto = useCallback((index: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (somenteLeitura) return;
    const workshopName = selectedSupplierName;
    if (!vehicleId || !workshopName) return;

    if (serviceType === "outros") {
      const t = serviceTypeOtherText.trim();
      if (t.length < 5) {
        toast.error("Descreva o serviço (mínimo 5 caracteres).");
        return;
      }
    }

    const veh = (vehiclesPayload as Vehicle[]).find((v) => strapiEntityId(v) === vehicleId);
    if (!veh) {
      toast.error("Veículo inválido.");
      return;
    }

    const { partsPayload, laborPayload } = buildServicePayload(services);

    let newUrls: string[] = [];
    if (newPhotoFiles.length > 0) {
      try {
        newUrls = await uploadFiles(newPhotoFiles);
      } catch {
        toast.error("Falha ao enviar as fotos. Tente arquivos menores.");
        return;
      }
    }

    const base: Record<string, unknown> = {
      workshopName,
      serviceType,
      serviceTypeOtherText: serviceType === "outros" ? serviceTypeOtherText.trim() : null,
      status,
      entryDate,
      responsible: responsible.trim() || undefined,
      description: description.trim() || undefined,
      partsJson: partsPayload.length ? partsPayload : null,
      laborJson: laborPayload.length ? laborPayload : null,
      totalAmount: custoTotal,
      vehicleId: veh.id,
    };

    if (isEditing && routeId) {
      const merged = [...existingPhotoUrls, ...newUrls];
      await updateMutation.mutateAsync({
        routeId,
        data: { ...base, photoUrls: merged },
      });
      router.push(`/os/${routeId}`);
    } else {
      await createMutation.mutateAsync({
        ...base,
        ...(newUrls.length ? { photoUrls: newUrls } : {}),
      });
      router.push("/os");
    }
  };

  const loadingData = loadingVehicles || (isEditing && loadingOrder);

  if (isEditing && errorOrder) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">OS não encontrada</AlertTitle>
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
            {somenteLeitura ? "Ver ordem de serviço" : isEditing ? "Ordem de serviço" : "Nova ordem de serviço"}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {somenteLeitura ? "Visualização, use Editar na lista para alterar." : "Dados salvos no banco"}
          </p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-green-500" />
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <fieldset disabled={somenteLeitura} className="border-0 p-0 m-0 min-w-0 disabled:opacity-90">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6 border border-[#E5E7EB]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <Label>Veículo *</Label>
                      <Select value={vehicleId || undefined} onValueChange={setVehicleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[min(70vh,28rem)]">
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id} className="whitespace-normal break-words py-2.5">
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
                      <div>
                        <Label htmlFor="os-supplier">Oficina / fornecedor *</Label>
                        <Select
                          value={supplierId || "__empty__"}
                          onValueChange={(v) => setSupplierId(v === "__empty__" ? "" : v)}
                        >
                          <SelectTrigger id="os-supplier">
                            <SelectValue placeholder="Selecione o fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty__">-</SelectItem>
                            {Array.isArray(suppliers)
                              ? suppliers.map((s) => {
                                  const a2 = (s as Supplier).attributes;
                                  const name = a2?.company_name || "Fornecedor";
                                  const key = String(s.documentId ?? s.id);
                                  return (
                                    <SelectItem key={key} value={String(s.id)}>
                                      {name}
                                    </SelectItem>
                                  );
                                })
                              : null}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:pt-[22px]">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 whitespace-nowrap"
                          onClick={() => setSupplierDialogOpen(true)}
                          disabled={createSupplierMutation.isPending}
                        >
                          Novo fornecedor
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Tipo de serviço</Label>
                      <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceOrderType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {serviceType === "outros" ? (
                      <div className="sm:col-span-2">
                        <Label>Descreva o serviço (Outros) *</Label>
                        <Input
                          required
                          minLength={5}
                          value={serviceTypeOtherText}
                          onChange={(e) => setServiceTypeOtherText(e.target.value)}
                          placeholder="Ex.: Troca de embreagem"
                        />
                      </div>
                    ) : null}

                    <div>
                      <DatePickerField
                        label="Data de entrada *"
                        required
                        value={entryDate}
                        onChange={setEntryDate}
                      />
                    </div>

                    <div>
                      <Label>Responsável interno</Label>
                      <Input
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descrição do serviço</Label>
                    <Textarea
                      placeholder="Descreva o serviço…"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Serviço</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setServices((s) => [...s, emptyServiceRow()])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar linha
                      </Button>
                    </div>
                    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <th className="text-left text-xs font-medium text-[#6B7280] p-3">Descrição</th>
                            <th className="text-center text-xs font-medium text-[#6B7280] p-3 w-28">Qtd/Horas</th>
                            <th className="text-right text-xs font-medium text-[#6B7280] p-3 w-32">Valor unit.</th>
                            <th className="text-right text-xs font-medium text-[#6B7280] p-3 w-28">Total</th>
                            <th className="w-12 p-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {services.map((servico) => {
                            const lineTotal = Math.max(0, servico.quantidade) * Math.max(0, servico.valorUnit);
                            return (
                              <tr key={servico.key} className="border-b border-[#E5E7EB] last:border-0">
                                <td className="p-2">
                                  <Input
                                    className="h-9"
                                    value={servico.descricao}
                                    onChange={(e) => updateService(servico.key, { descricao: e.target.value })}
                                    placeholder="Serviço"
                                  />
                                </td>
                                <td className="p-2">
                                  <MaskedInput
                                    className="h-9 text-center"
                                    mask="decimal2"
                                    value={
                                      servico.quantidade > 0
                                        ? maskDecimal2(String(servico.quantidade).replace(".", ","))
                                        : ""
                                    }
                                    onChange={(e) =>
                                      updateService(servico.key, {
                                        quantidade: parseDecimal2(e.target.value) ?? 0,
                                      })
                                    }
                                  />
                                </td>
                                <td className="p-2">
                                  <MaskedInput
                                    className="h-9 text-right"
                                    mask="currency"
                                    value={
                                      servico.valorUnit > 0 ? numberToBRLMaskedFromReais(servico.valorUnit) : ""
                                    }
                                    onChange={(e) =>
                                      updateService(servico.key, {
                                        valorUnit: parseBRLMoney(e.target.value) ?? 0,
                                      })
                                    }
                                  />
                                </td>
                                <td className="p-2 text-sm text-right font-medium text-[#111827]">
                                  {lineTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </td>
                                <td className="p-2 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setServices((prev) =>
                                        prev.length <= 1 ? prev : prev.filter((x) => x.key !== servico.key),
                                      )
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <Label>Fotos (opcional)</Label>
                    <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center mt-2">
                      <Upload className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
                      <label className="cursor-pointer text-sm text-[#22C55E] font-medium">
                        Selecionar imagens
                        <input type="file" accept="image/*" multiple className="hidden" onChange={onPickPhotos} />
                      </label>
                      <p className="text-xs text-[#6B7280] mt-1">Evidências do serviço</p>
                    </div>
                    {existingPhotoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {existingPhotoUrls.map((url, i) => (
                          <a
                            key={`${url}-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-20 h-20 rounded border overflow-hidden bg-gray-100"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    {newPhotoFiles.length > 0 && (
                      <ul className="mt-2 text-sm text-[#6B7280] space-y-1">
                        {newPhotoFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex justify-between items-center gap-2">
                            <span className="truncate">{f.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeNewPhoto(i)}>
                              Remover
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-[#E5E7EB]">
                <h3 className="text-sm font-medium text-[#111827] mb-6">Resumo</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B7280]">Serviço</span>
                    <span className="text-sm font-medium text-[#111827]">
                      {totalServico.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-[#111827]">Total da OS</span>
                      <span className="text-xl font-semibold text-[#111827]">
                        {custoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <Label className="text-xs">Estado</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ServiceOrderStatus)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_VALUES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              {somenteLeitura ? "Voltar" : "Cancelar"}
            </Button>
            {somenteLeitura && isEditing && routeId ? (
              <Button
                type="button"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                onClick={() => router.replace(`/os/${routeId}`)}
              >
                Editar esta OS
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                disabled={isSubmitting || !vehicleId || !selectedSupplierName || somenteLeitura}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar OS
              </Button>
            )}
          </div>
        </form>
      )}

      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="os-new-supplier-name">Nome *</Label>
              <Input
                id="os-new-supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Ex.: Oficina Central"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSupplierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              disabled={!newSupplierName.trim() || createSupplierMutation.isPending}
              onClick={async () => {
                const name = newSupplierName.trim();
                if (!name) return;
                const created = await createSupplierMutation.mutateAsync({ companyName: name });
                setSupplierId(String(created.id));
                setNewSupplierName("");
                setSupplierDialogOpen(false);
              }}
            >
              Criar e vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
