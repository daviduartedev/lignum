"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Check, ChevronRight, Loader2, AlertCircle, Plus, Save } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateSeller, useSellers } from "@/hooks/useSellers";
import { useCreateSale } from "@/hooks/useSales";
import type { PaymentMethod, PersonType } from "@/types";
import { clientAttrs, vehicleAttrs } from "@/types";
import { FINANCING_BANK_OPTIONS } from "@/lib/financingBanks";
import { maskCNPJ, maskCPF, numberToBRLMaskedFromReais, parseBRLMoney } from "@/lib/masks";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { ProfitVsFipeBlock } from "@/components/finance/ProfitVsFipeBlock";
import { toast } from "@/lib/toast";
import { cn } from "@/components/ui/utils";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  a_vista: "À vista / TED",
  pix: "PIX",
  financiamento: "Financiamento",
  cartao: "Cartão",
  troca: "Com troca",
  promissoria: "Promissória (parcelas na loja)",
};

export function Venda() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { data: rawVehicle, isLoading: loadingVehicle, isError: errorVehicle } = useVehicle(id);
  const { data: clientsData = [], isLoading: loadingClients } = useClients();
  const { data: sellersData = [], isLoading: loadingSellers } = useSellers();
  const createSaleMutation = useCreateSale();
  const createClientMutation = useCreateClient();
  const createSellerMutation = useCreateSeller();
  const isSubmitting = createSaleMutation.isPending;
  const isCreatingClient = createClientMutation.isPending;
  const isCreatingSeller = createSellerMutation.isPending;

  const [etapa, setEtapa] = useState(1);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [createdClientOption, setCreatedClientOption] = useState<{ id: string; nome: string; doc: string } | null>(null);
  const [createdSellerOption, setCreatedSellerOption] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [clientFullName, setClientFullName] = useState("");
  const [clientPersonType, setClientPersonType] = useState<PersonType>("PF");
  const [clientDocument, setClientDocument] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [manualSellerName, setManualSellerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPassword, setSellerPassword] = useState("");
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().split("T")[0] ?? "");
  const [notes, setNotes] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>("a_vista");
  const [valorEntrada, setValorEntrada] = useState<string>("");
  const [financingBank, setFinancingBank] = useState<string>("");
  const [customSellingPrice, setCustomSellingPrice] = useState<string>("");

  const veiculoData = useMemo(() => {
    if (!rawVehicle) return null;
    const a = vehicleAttrs(rawVehicle);
    return {
      brand: a.brand || "",
      model: a.model || "",
      plate: a.plate || "",
      valorVendaPadrão: Number(a.selling_price) || 0,
      valorCompra: Number(a.purchase_price) || 0,
      custos: Number(a.estimated_maintenance_cost) || 0,
      valorFipe: Number(a.fipe_price) || 0,
    };
  }, [rawVehicle]);

  const [promissoryOpen, setPromissoryOpen] = useState(false);
  const [promTotal, setPromTotal] = useState("12");
  const [promAmount, setPromAmount] = useState("");
  const [promFirstDue, setPromFirstDue] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [promInterval, setPromInterval] = useState("1");

  const clients = useMemo(() => {
    const options = clientsData.map((c) => {
      const a = clientAttrs(c);
      return {
        id: String(c.id),
        nome: a.full_name || "Sem nome",
        doc: a.document || "Sem doc",
      };
    });
    if (createdClientOption && !options.some((c) => c.id === createdClientOption.id)) {
      return [createdClientOption, ...options];
    }
    return options;
  }, [clientsData, createdClientOption]);

  const sellers = useMemo(() => {
    const options = sellersData.map((s) => ({
      id: String(s.id),
      nome: s.name || s.email,
      email: s.email,
    }));
    if (createdSellerOption && !options.some((s) => s.id === createdSellerOption.id)) {
      return [createdSellerOption, ...options];
    }
    return options;
  }, [sellersData, createdSellerOption]);

  const loadingData = loadingVehicle || loadingClients || loadingSellers;

  useEffect(() => {
    if (!veiculoData) return;
    setCustomSellingPrice(numberToBRLMaskedFromReais(veiculoData.valorVendaPadrão));
    setValorEntrada("");
  }, [id, veiculoData]);

  useEffect(() => {
    if (!clientDocument) return;
    const digits = clientDocument.replace(/\D/g, "");
    setClientDocument(clientPersonType === "PJ" ? maskCNPJ(digits) : maskCPF(digits));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remask only when PF/PJ changes
  }, [clientPersonType]);

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-green-500" />
        <p className="text-sm font-medium">Carregando veículo e clientes…</p>
      </div>
    );
  }

  if (errorVehicle || !veiculoData || !rawVehicle) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Veículo inacessível</AlertTitle>
          <AlertDescription className="text-red-700">
            Não foi possível carregar o veículo desta venda. Pode ter sido removido ou está indisponível.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  const vehicleStatus = vehicleAttrs(rawVehicle).status;
  if (vehicleStatus === "vendido") {
    return (
      <div className="space-y-6">
        <Alert variant="info">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Venda já registada</AlertTitle>
          <AlertDescription>
            Este veículo já foi vendido. Não é possível registar outra venda para a mesma unidade.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.replace("/estoque")}>
          Voltar ao estoque
        </Button>
      </div>
    );
  }

  const etapas = [
    { numero: 1, titulo: "Dados da Venda" },
    { numero: 2, titulo: "Pagamento" },
    { numero: 3, titulo: "Resumo e Contrato" },
  ];

  const valorTotal = parseBRLMoney(customSellingPrice) ?? veiculoData.valorVendaPadrão;
  const entradaValor = parseBRLMoney(valorEntrada) ?? 0;
  const saldo = valorTotal - entradaValor;
  const lucro = valorTotal - veiculoData.valorCompra - veiculoData.custos;
  const margemReal = valorTotal > 0 ? ((lucro / valorTotal) * 100).toFixed(1) : "0";
  const financingBankLabel =
    FINANCING_BANK_OPTIONS.find((b) => b.value === financingBank)?.label ?? financingBank;
  const selectedClientLabel = clients.find((c) => c.id === selectedClient);

  const handleFinalize = async () => {
    if (!id || !selectedClient || !rawVehicle) return;
    if (vehicleAttrs(rawVehicle).status === "vendido") {
      toast.info("Este veículo já foi vendido.");
      router.replace("/estoque");
      return;
    }
    const clientId = parseInt(selectedClient, 10);
    if (!Number.isFinite(clientId)) return;

    const promissoryPlan =
      formaPagamento === "promissoria"
        ? {
            totalInstallments: Math.max(1, parseInt(promTotal, 10) || 1),
            installmentAmount: parseBRLMoney(promAmount) ?? 0,
            firstDueDate: promFirstDue,
            intervalMonths: Math.max(1, parseInt(promInterval, 10) || 1),
          }
        : undefined;

    if (formaPagamento === "promissoria" && (!promissoryPlan || promissoryPlan.installmentAmount <= 0)) {
      toast.error("Configure a promissória: valor da parcela e vencimentos.");
      setPromissoryOpen(true);
      return;
    }

    const mergedNotes = [notes.trim(), (paymentNotes ?? "").trim() ? `Pagamento: ${(paymentNotes ?? "").trim()}` : ""]
      .filter(Boolean)
      .join("\n\n");

    await createSaleMutation.mutateAsync({
      body: {
        saleDate,
        finalPrice: valorTotal,
        paymentMethod: formaPagamento,
        notes: mergedNotes || undefined,
        vehicleId: rawVehicle.id,
        clientId,
        sellerUserId: selectedSeller && selectedSeller !== "__manual" ? parseInt(selectedSeller, 10) : undefined,
        sellerName:
          selectedSeller === "__manual"
            ? manualSellerName.trim() || undefined
            : sellers.find((s) => s.id === selectedSeller)?.nome,
        financingBank:
          formaPagamento === "financiamento" && financingBank.trim() ? financingBank.trim() : undefined,
        promissoryPlan,
      },
      vehicleRouteId: id,
    });
    router.replace("/estoque");
  };

  const resetClientDialogForm = () => {
    setClientFullName("");
    setClientPersonType("PF");
    setClientDocument("");
    setClientEmail("");
    setClientPhone("");
    setClientAddress("");
  };

  const resetSellerDialogForm = () => {
    setSellerName("");
    setSellerEmail("");
    setSellerPassword("");
  };

  const handleCreateClient = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const created = await createClientMutation.mutateAsync({
        fullName: clientFullName.trim(),
        document: clientDocument.trim(),
        personType: clientPersonType,
        email: clientEmail.trim().toLowerCase(),
        phone: clientPhone.trim() || undefined,
        address: clientAddress.trim() || undefined,
      });
      const a = clientAttrs(created);
      const option = {
        id: String(created.id),
        nome: a.full_name || clientFullName.trim() || "Sem nome",
        doc: a.document || clientDocument.trim() || "Sem doc",
      };
      setCreatedClientOption(option);
      setSelectedClient(option.id);
      setClientDialogOpen(false);
      resetClientDialogForm();
    } catch {
      /* toast no hook */
    }
  };

  const handleCreateSeller = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const created = await createSellerMutation.mutateAsync({
        name: sellerName.trim(),
        email: sellerEmail.trim().toLowerCase(),
        password: sellerPassword,
      });
      const option = {
        id: String(created.id),
        nome: created.name || created.email,
        email: created.email,
      };
      setCreatedSellerOption(option);
      setSelectedSeller(option.id);
      setManualSellerName("");
      setSellerDialogOpen(false);
      resetSellerDialogForm();
    } catch {
      /* toast no hook */
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Nova Venda</h1>
          <p className="text-sm font-medium text-green-600">
            {veiculoData.brand} {veiculoData.model}{" "}
            <span className="text-gray-500 font-normal">({veiculoData.plate})</span>
          </p>
        </div>
      </div>

      <Card className="p-6 border border-[#E5E7EB] shadow-sm">
        <div className="flex items-center justify-between mb-8 overflow-hidden">
          {etapas.map((e, index) => (
            <div key={e.numero} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    e.numero < etapa
                      ? "bg-[#22C55E] text-white shadow-md"
                      : e.numero === etapa
                        ? "bg-[#22C55E] text-white ring-4 ring-green-100"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                  }`}
                >
                  {e.numero < etapa ? <Check className="w-5 h-5" /> : e.numero}
                </div>
                <div className="hidden md:block">
                  <div
                    className={`text-sm font-medium ${e.numero <= etapa ? "text-[#111827]" : "text-[#9CA3AF]"}`}
                  >
                    {e.titulo}
                  </div>
                </div>
              </div>
              {index < etapas.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 md:mx-4 ${e.numero < etapa ? "bg-[#22C55E]" : "bg-[#F3F4F6]"}`} />
              )}
            </div>
          ))}
        </div>

        {etapa === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-xs font-medium">
                O estado deste veículo no stock passará a &quot;Vendido&quot; ao concluir esta operação.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="mb-2 block">Cliente comprador *</Label>
                <div className="flex gap-2">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="min-w-0 flex-1 border-gray-300">
                      <SelectValue placeholder="Selecione o cliente cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}, {c.doc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setClientDialogOpen(true)}
                    disabled={isSubmitting}
                    title="Cadastrar cliente"
                    aria-label="Cadastrar cliente"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <DatePickerField label="Data de fecho *" value={saleDate} onChange={setSaleDate} required />
              </div>

              <div>
                <Label className="mb-2 block">Vendedor</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSeller}
                    onValueChange={(value) => {
                      setSelectedSeller(value);
                      if (value !== "__manual") setManualSellerName("");
                    }}
                  >
                    <SelectTrigger className="min-w-0 flex-1 border-gray-300">
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}, {s.email}
                        </SelectItem>
                      ))}
                      <SelectItem value="__manual">Digitar vendedor avulso</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setSellerDialogOpen(true)}
                    disabled={isSubmitting}
                    title="Cadastrar vendedor"
                    aria-label="Cadastrar vendedor"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {selectedSeller === "__manual" && (
                  <Input
                    className="mt-2"
                    value={manualSellerName}
                    onChange={(e) => setManualSellerName(e.target.value)}
                    placeholder="Nome do vendedor"
                  />
                )}
              </div>

              <div>
                <Label className="mb-2 block">Preço final negociado (R$) *</Label>
                <MaskedInput
                  mask="currency"
                  value={customSellingPrice}
                  onChange={(e) => setCustomSellingPrice(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Preço sugerido:{" "}
                  {veiculoData.valorVendaPadrão.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Observações da venda</Label>
              <Textarea
                placeholder="Transferência de matrícula, ofertas, etc."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <Label className="mb-4 block">Forma de pagamento</Label>
              <RadioGroup
                value={formaPagamento}
                onValueChange={(v) => {
                  const pm = v as PaymentMethod;
                  setFormaPagamento(pm);
                  if (pm !== "financiamento") {
                    setFinancingBank("");
                    setValorEntrada("");
                  }
                  if (pm === "promissoria") {
                    setPromissoryOpen(true);
                    const n = Math.max(1, parseInt(promTotal, 10) || 12);
                    setPromAmount(numberToBRLMaskedFromReais(valorTotal / n));
                  }
                }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
              >
                {(
                  [
                    ["a_vista", "À vista / TED", ""],
                    ["pix", "PIX", ""],
                    ["financiamento", "Financiamento", ""],
                    ["cartao", "Cartão", ""],
                    ["troca", "Com troca", ""],
                    ["promissoria", "Promissória (parcelas na loja)", "md:col-span-2"],
                  ] as const
                ).map(([value, label, spanClass]) => (
                  <Label
                    key={value}
                    htmlFor={`pay-${value}`}
                    className={cn(
                      "flex items-center space-x-3 p-4 border rounded-lg bg-white cursor-pointer transition-colors hover:border-green-300",
                      formaPagamento === value
                        ? "border-green-400 bg-green-50/40 ring-1 ring-green-200"
                        : "border-[#E5E7EB]",
                      spanClass,
                    )}
                  >
                    <RadioGroupItem value={value} id={`pay-${value}`} />
                    <span className="flex-1 font-semibold text-gray-700">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {formaPagamento === "promissoria" && (
              <div className="rounded-xl border border-dashed border-green-300 bg-green-50/50 p-4">
                <p className="text-sm text-gray-700 mb-2">
                  Plano: <strong>{promTotal}</strong> parcelas de{" "}
                  <strong>{parseBRLMoney(promAmount) != null ? numberToBRLMaskedFromReais(parseBRLMoney(promAmount)!) : "-"}</strong>
                  , 1.º vencimento <strong>{promFirstDue}</strong>, intervalo{" "}
                  <strong>{promInterval}</strong> mês(es).
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setPromissoryOpen(true)}>
                  Editar plano de promissória
                </Button>
              </div>
            )}

            {formaPagamento === "financiamento" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <Label className="mb-2 block">Sinal / entrada (R$)</Label>
                  <MaskedInput
                    mask="currency"
                    value={valorEntrada}
                    onChange={(e) => setValorEntrada(e.target.value)}
                    placeholder="Ex: 15.000,00"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Banco / financeira *</Label>
                  <Select value={financingBank || undefined} onValueChange={setFinancingBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o financiador" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCING_BANK_OPTIONS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Observações do pagamento (opcional)</Label>
              <Textarea
                placeholder="Ex.: parcelas no banco X, condição especial do PIX, detalhes da troca…"
                rows={2}
                value={paymentNotes ?? ""}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <Card className="p-5 bg-gradient-to-r from-gray-50 to-white border border-[#E5E7EB]">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280] mb-3">Resumo do pagamento</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Forma</span>
                  <span className="text-[#111827] font-medium">{PAYMENT_METHOD_LABELS[formaPagamento]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Valor negociado</span>
                  <span className="text-[#111827] font-medium">
                    {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
                {formaPagamento === "financiamento" && (
                  <>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="text-blue-600">Entrada / sinal</span>
                      <span className="text-blue-800 font-medium">
                        {entradaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Banco / financeira</span>
                      <span className="text-[#111827] font-medium">{financingBankLabel || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="text-[#4B5563] font-bold">Saldo (financiado externamente)</span>
                      <span className="text-[#111827] font-black">
                        {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  </>
                )}
                {formaPagamento === "promissoria" && (
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                    <span className="text-[#6B7280]">Plano promissória</span>
                    <span className="text-[#111827] font-medium text-right">
                      {promTotal}× de{" "}
                      {parseBRLMoney(promAmount) != null
                        ? (parseBRLMoney(promAmount)!).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {etapa === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="p-5 border border-[#E5E7EB] bg-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280] mb-4">Resumo da venda</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#6B7280] mb-1">Cliente</p>
                  <p className="font-semibold text-[#111827]">
                    {selectedClientLabel?.nome ?? "—"}
                    {selectedClientLabel?.doc ? (
                      <span className="block text-xs font-normal text-[#6B7280]">{selectedClientLabel.doc}</span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-[#6B7280] mb-1">Data de fecho</p>
                  <p className="font-semibold text-[#111827]">
                    {saleDate ? new Date(`${saleDate}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#6B7280] mb-1">Forma de pagamento</p>
                  <p className="font-semibold text-[#111827]">{PAYMENT_METHOD_LABELS[formaPagamento]}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] mb-1">Valor final</p>
                  <p className="font-semibold text-[#111827]">
                    {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                {formaPagamento === "financiamento" && (
                  <>
                    <div>
                      <p className="text-[#6B7280] mb-1">Entrada / sinal</p>
                      <p className="font-semibold text-blue-800">
                        {entradaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6B7280] mb-1">Saldo financiado</p>
                      <p className="font-semibold text-[#111827]">
                        {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[#6B7280] mb-1">Banco / financeira</p>
                      <p className="font-semibold text-[#111827]">{financingBankLabel || "—"}</p>
                    </div>
                  </>
                )}
                {formaPagamento === "promissoria" && (
                  <div className="md:col-span-2">
                    <p className="text-[#6B7280] mb-1">Promissória</p>
                    <p className="font-semibold text-[#111827]">
                      {promTotal} parcelas de{" "}
                      {parseBRLMoney(promAmount) != null
                        ? (parseBRLMoney(promAmount)!).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                      , 1.º vencimento {promFirstDue}
                    </p>
                  </div>
                )}
                {(notes.trim() || (paymentNotes ?? "").trim()) && (
                  <div className="md:col-span-2">
                    <p className="text-[#6B7280] mb-1">Observações</p>
                    <p className="text-[#111827] whitespace-pre-wrap">
                      {[notes.trim(), (paymentNotes ?? "").trim() ? `Pagamento: ${(paymentNotes ?? "").trim()}` : ""]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Desempenho comercial</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-sm text-green-900">Custo total do veículo</span>
                    <span className="text-sm font-semibold text-green-900">
                      {(veiculoData.valorCompra + veiculoData.custos).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-sm text-green-900">Venda</span>
                    <span className="text-sm font-semibold text-green-900">
                      {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-2 bg-green-100 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-green-700">Lucro bruto</span>
                    <span className="text-xl font-black text-green-800">
                      {lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-600">Margem (%)</span>
                    <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">
                      {margemReal}%
                    </span>
                  </div>
                  <ProfitVsFipeBlock
                    className="mt-3 pt-3 border-t border-green-100"
                    lucro={lucro}
                    precoVenda={valorTotal}
                    valorFipe={veiculoData.valorFipe > 0 ? veiculoData.valorFipe : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 shadow-sm">
              <AlertCircle className="text-amber-600 w-6 h-6 shrink-0" />
              <p className="text-sm text-amber-900 font-medium">
                Contratos e documentos podem ser gerenciados a partir do histórico do cliente (aba Documentos), quando
                disponível.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
          <Button
            variant="outline"
            onClick={() => setEtapa(Math.max(1, etapa - 1))}
            disabled={etapa === 1 || isSubmitting}
            className="w-24"
          >
            Voltar
          </Button>

          {etapa < 3 ? (
            <Button
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-6 shadow-md shadow-green-500/20"
              onClick={() => setEtapa(etapa + 1)}
              disabled={
                (etapa === 1 && !selectedClient) ||
                (etapa === 2 && formaPagamento === "financiamento" && !financingBank.trim()) ||
                (etapa === 2 &&
                  formaPagamento === "promissoria" &&
                  ((parseBRLMoney(promAmount) ?? 0) <= 0 || !promFirstDue.trim()))
              }
            >
              Avançar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md shadow-blue-500/30"
              onClick={() => void handleFinalize()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> A gravar…
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" /> Confirmar venda
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={(e) => void handleCreateClient(e)}>
            <DialogHeader>
              <DialogTitle>Novo cliente comprador</DialogTitle>
              <DialogDescription>
                Cadastre o cliente sem sair da venda. Ao salvar, ele fica selecionado nesta venda e entra no cadastro de
                clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="saleClientFullName">Nome completo *</Label>
                  <Input
                    id="saleClientFullName"
                    value={clientFullName}
                    onChange={(e) => setClientFullName(e.target.value)}
                    required
                    placeholder={clientPersonType === "PJ" ? "Ex.: Auto Center Ltda" : "Ex.: Maria Silva"}
                    disabled={isCreatingClient}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleClientPersonType">Tipo *</Label>
                  <Select
                    value={clientPersonType}
                    onValueChange={(v) => setClientPersonType(v as PersonType)}
                    disabled={isCreatingClient}
                  >
                    <SelectTrigger id="saleClientPersonType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa física (CPF)</SelectItem>
                      <SelectItem value="PJ">Pessoa jurídica (CNPJ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="saleClientDocument">
                    {clientPersonType === "PJ" ? "CNPJ *" : "CPF *"}
                  </Label>
                  <MaskedInput
                    id="saleClientDocument"
                    mask={clientPersonType === "PJ" ? "cnpj" : "cpf"}
                    value={clientDocument}
                    onChange={(e) => setClientDocument(e.target.value)}
                    required
                    placeholder={clientPersonType === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"}
                    disabled={isCreatingClient}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saleClientPhone">Telefone / WhatsApp</Label>
                  <MaskedInput
                    id="saleClientPhone"
                    mask="phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    disabled={isCreatingClient}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="saleClientEmail">E-mail *</Label>
                <Input
                  id="saleClientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  placeholder="cliente@email.com"
                  disabled={isCreatingClient}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="saleClientAddress">Endereço (rua, nº, bairro, cidade)</Label>
                <Textarea
                  id="saleClientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Rua Exemplo, 100, Centro, São Paulo — SP"
                  rows={3}
                  disabled={isCreatingClient}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setClientDialogOpen(false)}
                disabled={isCreatingClient}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={isCreatingClient}>
                {isCreatingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Salvar cliente</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={(e) => void handleCreateSeller(e)}>
            <DialogHeader>
              <DialogTitle>Novo vendedor</DialogTitle>
              <DialogDescription>
                Cadastre um vendedor do sistema sem sair da venda. O perfil criado será do tipo vendedor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="saleSellerName">Nome *</Label>
                <Input
                  id="saleSellerName"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  required
                  placeholder="Ex.: Joao Vendedor"
                  disabled={isCreatingSeller}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="saleSellerEmail">E-mail *</Label>
                <Input
                  id="saleSellerEmail"
                  type="email"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  required
                  placeholder="vendedor@email.com"
                  disabled={isCreatingSeller}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="saleSellerPassword">Senha inicial *</Label>
                <Input
                  id="saleSellerPassword"
                  type="password"
                  value={sellerPassword}
                  onChange={(e) => setSellerPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimo 8 caracteres"
                  disabled={isCreatingSeller}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSellerDialogOpen(false)}
                disabled={isCreatingSeller}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={isCreatingSeller}>
                {isCreatingSeller ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Salvar vendedor</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={promissoryOpen} onOpenChange={setPromissoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promissória, venda a prazo</DialogTitle>
            <DialogDescription>
              Cada parcela terá uma <strong>data de vencimento</strong>. O pagamento efetivo é registrado depois em
              Promissórias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Número de parcelas</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={promTotal}
                onChange={(e) => {
                  setPromTotal(e.target.value);
                  const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                  setPromAmount(numberToBRLMaskedFromReais(valorTotal / n));
                }}
              />
            </div>
            <div>
              <Label>Valor de cada parcela (R$)</Label>
              <MaskedInput mask="currency" value={promAmount} onChange={(e) => setPromAmount(e.target.value)} />
            </div>
            <div>
              <DatePickerField label="1.º vencimento" value={promFirstDue} onChange={setPromFirstDue} />
            </div>
            <div>
              <Label>Intervalo entre vencimentos (meses)</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={promInterval}
                onChange={(e) => setPromInterval(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPromissoryOpen(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
              onClick={() => {
                if ((parseBRLMoney(promAmount) ?? 0) <= 0) {
                  toast.error("Informe o valor da parcela.");
                  return;
                }
                setPromissoryOpen(false);
              }}
            >
              Confirmar plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
