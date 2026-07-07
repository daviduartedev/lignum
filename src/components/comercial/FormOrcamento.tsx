"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, ListChecks, Loader2, Ruler, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuoteFormFooter } from "@/components/comercial/QuoteFormFooter";
import { QuoteFormSummary } from "@/components/comercial/QuoteFormSummary";
import { useBodyModels } from "@/hooks/useBodyModels";
import { useClients } from "@/hooks/useClients";
import { useCalculateQuote, useCreateQuote } from "@/hooks/useQuotes";
import { formatBRL } from "@/lib/pdf/format";
import { quotePdfUrl } from "@/services/internal/quotes";
import { clientAttrs } from "@/types";
import type { Client } from "@/types";
import {
  bodyModelAttrs,
  COVER_STYLE_LABELS,
  FLOOR_TYPE_LABELS,
  type BodyCoverStyle,
  type BodyFinishType,
  type BodyFloorType,
} from "@/types/quotes";
import { DEFAULT_QUOTE_PRICING } from "@/lib/quotes/quotePricingDefaults";
import { cn } from "@/components/ui/utils";

const OPTION_KEYS = Object.keys(DEFAULT_QUOTE_PRICING.options);

const FINISH_RADIO: { value: BodyFinishType; title: string; subtitle: string }[] = [
  {
    value: "pintura",
    title: "Padrão Fábrica (Azul Royal)",
    subtitle: "Resina epóxi alta durabilidade",
  },
  {
    value: "lamina_natural",
    title: "Personalizada (Pantone)",
    subtitle: "Conforme manual de marca",
  },
];

function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return doc;
}

function QuoteFormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserPlus;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="h-5 w-5 text-secondary" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FormOrcamento() {
  const router = useRouter();
  const { data: clientsPayload = [], isLoading: loadingClients } = useClients();
  const { data: bodyModels = [], isLoading: loadingModels } = useBodyModels();
  const calcMutation = useCalculateQuote();
  const createMutation = useCreateQuote();

  const [clientRouteId, setClientRouteId] = useState("");
  const [bodyModelId, setBodyModelId] = useState<string>("");
  const [lengthM, setLengthM] = useState("4.20");
  const [widthM, setWidthM] = useState("2.10");
  const [heightM, setHeightM] = useState("1.80");
  const [coverStyle, setCoverStyle] = useState<BodyCoverStyle>("tampa_plana");
  const [floorType, setFloorType] = useState<BodyFloorType>("assoalho_madeira");
  const [finishType, setFinishType] = useState<BodyFinishType>("pintura");
  const [options, setOptions] = useState<string[]>([]);
  const [discount, setDiscount] = useState("0");
  const [paymentTerms, setPaymentTerms] = useState("30% entrada + saldo na entrega");
  const [deliveryDays, setDeliveryDays] = useState("45");
  const [notes, setNotes] = useState("");
  const [showCommercial, setShowCommercial] = useState(false);
  const [pendingAction, setPendingAction] = useState<"draft" | "pdf" | "send" | null>(null);

  const previewQuoteId = useMemo(() => {
    const year = new Date().getFullYear();
    return `ORC-${year}-novo`;
  }, []);

  const clients = useMemo(
    () =>
      (clientsPayload as Client[]).map((c) => ({
        id: String(c.documentId ?? c.id),
        numericId: c.id,
        label: clientAttrs(c).full_name,
        attrs: clientAttrs(c),
      })),
    [clientsPayload],
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientRouteId),
    [clients, clientRouteId],
  );

  const selectedModel = useMemo(
    () => bodyModels.find((m) => String(m.id) === bodyModelId),
    [bodyModels, bodyModelId],
  );

  const summaryModelName = selectedModel
    ? bodyModelAttrs(selectedModel).name
    : "Carroceria paramétrica";

  const calcPayload = useMemo(
    () => ({
      bodyModelId: bodyModelId ? Number(bodyModelId) : undefined,
      lengthM: Number(lengthM),
      widthM: Number(widthM),
      heightM: Number(heightM),
      coverStyle,
      floorType,
      finishType,
      options,
      discount: Number(discount) || 0,
    }),
    [bodyModelId, lengthM, widthM, heightM, coverStyle, floorType, finishType, options, discount],
  );

  const calcKey = JSON.stringify(calcPayload);
  const calcMutate = calcMutation.mutate;

  useEffect(() => {
    if (!Number.isFinite(calcPayload.lengthM) || calcPayload.lengthM <= 0) return;
    const t = setTimeout(() => calcMutate(calcPayload), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcKey, calcMutate]);

  const pricing = calcMutation.data;

  const toggleOption = (key: string) => {
    setOptions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const buildCreatePayload = (status: "rascunho" | "enviado") => {
    const cli = (clientsPayload as Client[]).find((c) => String(c.documentId ?? c.id) === clientRouteId);
    if (!cli) return null;
    return {
      clientId: cli.id,
      bodyModelId: bodyModelId ? Number(bodyModelId) : undefined,
      lengthM: Number(lengthM),
      widthM: Number(widthM),
      heightM: Number(heightM),
      coverStyle,
      floorType,
      finishType,
      options,
      discount: Number(discount) || 0,
      paymentTerms,
      deliveryDays: Number(deliveryDays) || undefined,
      notes: notes || undefined,
      status,
    };
  };

  const handleCreate = (status: "rascunho" | "enviado", afterSave?: (routeId: string) => void) => {
    const payload = buildCreatePayload(status);
    if (!payload) return;
    setPendingAction(status === "rascunho" ? (afterSave ? "pdf" : "draft") : "send");
    createMutation.mutate(payload, {
      onSuccess: (q) => {
        const routeId = q.documentId ?? String(q.id);
        setPendingAction(null);
        if (afterSave) {
          afterSave(routeId);
          return;
        }
        router.push(`/orcamentos/${routeId}`);
      },
      onError: () => setPendingAction(null),
    });
  };

  const handleDiscard = () => {
    const dirty = clientRouteId || options.length > 0 || notes.trim();
    if (dirty && !window.confirm("Descartar alterações deste orçamento?")) return;
    router.push("/orcamentos");
  };

  const handleSaveDraft = () => handleCreate("rascunho");

  const handleGeneratePdf = () => {
    handleCreate("rascunho", (routeId) => {
      window.open(quotePdfUrl(routeId), "_blank", "noopener,noreferrer");
      router.push(`/orcamentos/${routeId}`);
    });
  };

  const handleSend = () => handleCreate("enviado");

  const canSubmit = !!clientRouteId && !!pricing && !createMutation.isPending;
  const isPending = createMutation.isPending;
  const parsedDeliveryDays = Number(deliveryDays) || 45;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8 pb-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/orcamentos" className="hover:text-primary transition-colors">
            Orçamentos
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">Criação de Orçamento Paramétrico</span>
        </nav>
        <p className="text-sm text-muted-foreground">
          ID: <span className="font-mono font-bold text-foreground">{previewQuoteId}</span>
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <QuoteFormSection icon={UserPlus} title="Identificação do Cliente">
            <div className="space-y-2">
              <Label htmlFor="quote-client">Cliente</Label>
              <Select value={clientRouteId || undefined} onValueChange={setClientRouteId}>
                <SelectTrigger id="quote-client" disabled={loadingClients} className="h-11">
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
              {selectedClient ? (
                <p className="text-[11px] text-muted-foreground">
                  {selectedClient.attrs.document ? (
                    <>
                      {selectedClient.attrs.person_type === "PJ" ? "CNPJ" : "Documento"}:{" "}
                      {formatDocument(selectedClient.attrs.document)}
                    </>
                  ) : null}
                  {selectedClient.attrs.document && selectedClient.attrs.city ? " · " : null}
                  {selectedClient.attrs.city ? (
                    <>Localização: {selectedClient.attrs.city}</>
                  ) : selectedClient.attrs.document ? null : (
                    "Complete o cadastro do cliente para ver documento e localização."
                  )}
                </p>
              ) : null}
            </div>
          </QuoteFormSection>

          <QuoteFormSection icon={Ruler} title="Dimensões e Estrutura">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote-length">Comprimento (m)</Label>
                <Input
                  id="quote-length"
                  value={lengthM}
                  onChange={(e) => setLengthM(e.target.value)}
                  inputMode="decimal"
                  className="h-11 text-center tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-width">Largura (m)</Label>
                <Input
                  id="quote-width"
                  value={widthM}
                  onChange={(e) => setWidthM(e.target.value)}
                  inputMode="decimal"
                  className="h-11 text-center tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-height">Altura (m)</Label>
                <Input
                  id="quote-height"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  inputMode="decimal"
                  className="h-11 text-center tabular-nums"
                />
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Modelo base</Label>
                <Select value={bodyModelId || undefined} onValueChange={setBodyModelId}>
                  <SelectTrigger disabled={loadingModels} className="h-11">
                    <SelectValue placeholder="Catálogo de modelos (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyModels.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {bodyModelAttrs(m).name} · {formatBRL(bodyModelAttrs(m).base_price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Tampa</Label>
                <Select value={coverStyle} onValueChange={(v) => setCoverStyle(v as BodyCoverStyle)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COVER_STYLE_LABELS) as BodyCoverStyle[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {COVER_STYLE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                <Label>Tipo de Assoalho</Label>
                <Select value={floorType} onValueChange={(v) => setFloorType(v as BodyFloorType)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FLOOR_TYPE_LABELS) as BodyFloorType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {FLOOR_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Acabamento de Pintura</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                {FINISH_RADIO.map((opt) => {
                  const selected = finishType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex flex-1 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40",
                        selected ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border",
                      )}
                    >
                      <input
                        type="radio"
                        name="finishType"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setFinishType(opt.value)}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </QuoteFormSection>

          <QuoteFormSection icon={ListChecks} title="Itens Opcionais e Acessórios">
            <div className="grid gap-y-3 gap-x-6 sm:grid-cols-2">
              {OPTION_KEYS.map((key) => {
                const opt = DEFAULT_QUOTE_PRICING.options[key];
                const checked = options.includes(key);
                return (
                  <label
                    key={key}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleOption(key)} className="h-5 w-5" />
                    <span className="text-sm group-hover:text-primary transition-colors">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </QuoteFormSection>

          <section className="rounded-xl border border-dashed border-border bg-muted/20">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-foreground"
              onClick={() => setShowCommercial((v) => !v)}
            >
              Condições comerciais (opcional)
              <ChevronRight className={cn("h-4 w-4 transition-transform", showCommercial && "rotate-90")} />
            </button>
            {showCommercial ? (
              <div className="grid gap-4 border-t border-border px-6 pb-6 pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
                </div>
                <div className="space-y-2">
                  <Label>Prazo de entrega (dias úteis)</Label>
                  <Input value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} inputMode="numeric" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Condições de pagamento</Label>
                  <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="lg:col-span-5 lg:sticky lg:top-4">
          <QuoteFormSummary
            modelName={summaryModelName}
            pricing={pricing}
            isCalculating={calcMutation.isPending}
            deliveryDays={parsedDeliveryDays}
          />
        </aside>
      </div>
      </div>

      <QuoteFormFooter
        canSubmit={canSubmit}
        isPending={isPending}
        onDiscard={handleDiscard}
        onSaveDraft={handleSaveDraft}
        onGeneratePdf={handleGeneratePdf}
        onSend={handleSend}
      />

      {pendingAction ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-50 flex justify-center px-8">
          <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            {pendingAction === "pdf" ? "Salvando e gerando PDF…" : "Salvando orçamento…"}
          </div>
        </div>
      ) : null}
    </div>
  );
}