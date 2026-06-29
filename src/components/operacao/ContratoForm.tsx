"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Save, PenTool, Loader2, AlertCircle, Printer, Download } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useContract, useCreateContract, useUpdateContract } from "@/hooks/useContracts";
import type { Client, Contract, ContractStatus, ContractType, Vehicle } from "@/types";
import { clientAttrs, vehicleDisplayName } from "@/types";
import { maskCPFCNPJ, numberToBRLMaskedFromReais, parseBRLMoney } from "@/lib/masks";
import { strapiEntityId } from "@/lib/strapiEntity";
import { toast } from "@/lib/toast";

const TYPE_VALUES: { value: ContractType; label: string }[] = [
  { value: "compra_venda", label: "Compra e Venda" },
  { value: "financiamento", label: "Financiamento" },
  { value: "consorcio", label: "Consórcio" },
  { value: "locacao", label: "Locação" },
];

const STATUS_VALUES: { value: ContractStatus; label: string }[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "pendente_assinatura", label: "Pendente assinatura" },
  { value: "assinado", label: "Assinado" },
  { value: "cancelado", label: "Cancelado" },
];

type Props = { routeId?: string };

export function ContratoForm({ routeId }: Props) {
  const router = useRouter();
  const isEditing = Boolean(routeId);

  const { data: vehiclesPayload = [], isLoading: loadingVehicles } = useVehicles();
  const { data: clientsPayload = [], isLoading: loadingClients } = useClients();
  const { data: contractPayload, isLoading: loadingContract, isError: errorContract } = useContract(
    isEditing ? routeId : undefined,
  );

  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [isDownloading, setIsDownloading] = useState(false);

  const [contractType, setContractType] = useState<ContractType>("compra_venda");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [contractValue, setContractValue] = useState("");
  const [contractDate, setContractDate] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [status, setStatus] = useState<ContractStatus>("rascunho");
  const [specialClauses, setSpecialClauses] = useState("");
  const [w1Name, setW1Name] = useState("");
  const [w1Doc, setW1Doc] = useState("");
  const [w2Name, setW2Name] = useState("");
  const [w2Doc, setW2Doc] = useState("");

  const vehicles = useMemo(() => {
    const list = (Array.isArray(vehiclesPayload) ? vehiclesPayload : []) as Vehicle[];
    return list.map((v) => {
      const idStr = strapiEntityId(v);
      return { id: idStr, label: vehicleDisplayName(v) };
    });
  }, [vehiclesPayload]);

  const clients = useMemo(() => {
    const list = (Array.isArray(clientsPayload) ? clientsPayload : []) as Client[];
    return list.map((c) => {
      const idStr = String(c.documentId ?? c.id);
      const a = clientAttrs(c);
      return { id: idStr, label: `${a.full_name || "Sem nome"}, ${a.document || ""}` };
    });
  }, [clientsPayload]);

  useEffect(() => {
    if (!contractPayload || !isEditing) return;
    const raw = contractPayload as unknown as Contract;
    const a = raw.attributes;
    setContractType(a.contract_type || "compra_venda");
    const v = a.vehicle?.data;
    const cl = a.client?.data;
    setVehicleId(v ? strapiEntityId(v as Vehicle) : "");
    setClientId(cl ? String((cl as Client).documentId ?? (cl as Client).id) : "");
    setContractValue(
      a.contract_value != null && Number(a.contract_value) > 0
        ? numberToBRLMaskedFromReais(Number(a.contract_value))
        : "",
    );
    const d = a.contract_date;
    setContractDate(d ? d.slice(0, 10) : new Date().toISOString().split("T")[0] ?? "");
    setStatus(a.status || "rascunho");
    setSpecialClauses(String(a.special_clauses ?? ""));
    setW1Name(String(a.witness_1_name ?? ""));
    setW1Doc(a.witness_1_document ? maskCPFCNPJ(String(a.witness_1_document)) : "");
    setW2Name(String(a.witness_2_name ?? ""));
    setW2Doc(a.witness_2_document ? maskCPFCNPJ(String(a.witness_2_document)) : "");
  }, [contractPayload, isEditing]);

  const loadingData = loadingVehicles || loadingClients || (isEditing && loadingContract);

  const vehicleLabel = useMemo(
    () => vehicles.find((v) => v.id === vehicleId)?.label ?? "-",
    [vehicles, vehicleId],
  );
  const clientLabel = useMemo(
    () => clients.find((c) => c.id === clientId)?.label ?? "-",
    [clients, clientId],
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!routeId) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/contracts/${encodeURIComponent(routeId)}/pdf`, {
        headers: { Accept: "application/pdf" },
      });
      if (!res.ok) {
        toast.error("Não foi possível gerar o PDF. Tente novamente.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato-${routeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Não foi possível gerar o PDF. Verifique sua conexão.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !clientId) return;

    const veh = (vehiclesPayload as Vehicle[]).find((v) => strapiEntityId(v) === vehicleId);
    const cli = (clientsPayload as Client[]).find((c) => String(c.documentId ?? c.id) === clientId);
    if (!veh || !cli) return;

    const val = parseBRLMoney(contractValue) ?? 0;
    const payload: Record<string, unknown> = {
      contractType,
      contractValue: val,
      contractDate,
      status,
      specialClauses: specialClauses.trim() || undefined,
      witness1Name: w1Name.trim() || undefined,
      witness1Document: w1Doc.trim() || undefined,
      witness2Name: w2Name.trim() || undefined,
      witness2Document: w2Doc.trim() || undefined,
      vehicleId: veh.id,
      clientId: cli.id,
    };

    if (isEditing && routeId) {
      await updateMutation.mutateAsync({ routeId, data: payload });
      router.push(`/contratos/${routeId}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      const newId = created.documentId ? String(created.documentId) : String(created.id);
      router.push(`/contratos/${newId}`);
    }
  };

  if (isEditing && errorContract) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Contrato não encontrado</AlertTitle>
          <AlertDescription className="text-red-700">Verifique o link ou volte à lista.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            {isEditing ? "Editar contrato" : "Novo contrato"}
          </h1>
          <p className="text-sm text-[#6B7280]">Dados salvos no banco</p>
        </div>
      </div>

      <div className="hidden print:block text-black">
        <h1 className="text-xl font-semibold mb-6">Contrato, resumo para impressão</h1>
        <table className="w-full text-sm border-collapse border border-gray-300 mb-4">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium w-40">Tipo</td>
              <td className="p-2">{TYPE_VALUES.find((t) => t.value === contractType)?.label}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium">Estado</td>
              <td className="p-2">{STATUS_VALUES.find((s) => s.value === status)?.label}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium">Veículo</td>
              <td className="p-2">{vehicleLabel}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium">Cliente</td>
              <td className="p-2">{clientLabel}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium">Valor</td>
              <td className="p-2">
                {(parseBRLMoney(contractValue) ?? 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="p-2 font-medium">Data</td>
              <td className="p-2">
                {contractDate ? new Date(`${contractDate}T12:00:00`).toLocaleDateString("pt-BR") : "-"}
              </td>
            </tr>
          </tbody>
        </table>
        {specialClauses.trim() ? (
          <div className="mb-4">
            <p className="font-medium text-sm mb-1">Cláusulas especiais</p>
            <p className="text-sm whitespace-pre-wrap border border-gray-200 p-3 rounded">{specialClauses}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4 text-sm mt-8">
          <div>
            <p className="font-medium">Testemunha 1</p>
            <p>{w1Name || "-"}</p>
            <p className="text-gray-600">{w1Doc || ""}</p>
          </div>
          <div>
            <p className="font-medium">Testemunha 2</p>
            <p>{w2Name || "-"}</p>
            <p className="text-gray-600">{w2Doc || ""}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-10">Confira os dados no cadastro antes de assinar.</p>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 border border-[#E5E7EB]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Tipo de contrato</Label>
                    <Select value={contractType} onValueChange={(v) => setContractType(v as ContractType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_VALUES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
                      <SelectTrigger>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Valor do contrato *</Label>
                    <MaskedInput
                      mask="currency"
                      required
                      value={contractValue}
                      onChange={(e) => setContractValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <DatePickerField
                      label="Data do contrato *"
                      required
                      value={contractDate}
                      onChange={setContractDate}
                    />
                  </div>
                </div>

                <div>
                  <Label>Cláusulas especiais</Label>
                  <Textarea
                    placeholder="Cláusulas específicas…"
                    rows={6}
                    value={specialClauses}
                    onChange={(e) => setSpecialClauses(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>Testemunha 1</Label>
                    <Input value={w1Name} onChange={(e) => setW1Name(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>CPF testemunha 1</Label>
                    <MaskedInput
                      mask="cpf_cnpj"
                      value={w1Doc}
                      onChange={(e) => setW1Doc(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Testemunha 2</Label>
                    <Input value={w2Name} onChange={(e) => setW2Name(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>CPF testemunha 2</Label>
                    <MaskedInput
                      mask="cpf_cnpj"
                      value={w2Doc}
                      onChange={(e) => setW2Doc(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 border border-[#E5E7EB]">
                <h3 className="text-sm font-medium text-[#111827] mb-4">Assinatura digital</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Estado da assinatura</Label>
                    <div className="mt-2">
                      <Badge
                        className={
                          status === "assinado"
                            ? "bg-[#DCFCE7] text-[#15803D] border-0"
                            : "bg-[#FEF9C3] text-[#A16207] border-0"
                        }
                      >
                        {status === "assinado" ? "Concluído" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB]">
                    <p className="text-xs text-[#6B7280] mb-3">Integração com provedor de assinatura pode ser conectada neste bloco.</p>
                    <Button type="button" variant="outline" size="sm" className="w-full" disabled>
                      <PenTool className="w-4 h-4 mr-2" />
                      Assinar digitalmente
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-[#E5E7EB]">
                <h3 className="text-sm font-medium text-[#111827] mb-4">Pré-visualização</h3>
                <div className="border-2 border-[#E5E7EB] rounded-lg p-4 bg-[#F9FAFB] min-h-[200px] text-[10px] text-[#6B7280] space-y-1">
                  <p className="font-semibold text-[#111827]">Resumo</p>
                  <p>Tipo: {TYPE_VALUES.find((t) => t.value === contractType)?.label}</p>
                  <p>
                    Valor:{" "}
                    {(parseBRLMoney(contractValue) ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p>Data: {contractDate}</p>
                </div>
                {isEditing ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full mt-3 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                    onClick={() => void handleDownloadPdf()}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Baixar PDF
                  </Button>
                ) : (
                  <p className="text-[10px] text-[#6B7280] mt-3">
                    Salve o contrato para habilitar o download do PDF preenchido.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <p className="text-[10px] text-[#6B7280] mt-2">
                  &ldquo;Imprimir&rdquo; usa o navegador (Ctrl+P). &ldquo;Baixar PDF&rdquo; gera o documento preenchido no servidor.
                </p>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar contrato
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
