"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import { useBodyModels } from "@/hooks/useBodyModels";
import { useClients } from "@/hooks/useClients";
import { useCalculateQuote, useCreateQuote } from "@/hooks/useQuotes";
import { formatBRL } from "@/lib/pdf/format";
import { clientAttrs } from "@/types";
import type { Client } from "@/types";
import {
  bodyModelAttrs,
  COVER_STYLE_LABELS,
  FINISH_TYPE_LABELS,
  FLOOR_TYPE_LABELS,
  type BodyCoverStyle,
  type BodyFinishType,
  type BodyFloorType,
} from "@/types/quotes";
import { DEFAULT_QUOTE_PRICING } from "@/lib/quotes/quotePricingDefaults";
import { Loader2 } from "lucide-react";

const OPTION_KEYS = Object.keys(DEFAULT_QUOTE_PRICING.options);

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
  const [sendOnCreate, setSendOnCreate] = useState(false);

  const clients = useMemo(
    () =>
      (clientsPayload as Client[]).map((c) => ({
        id: String(c.documentId ?? c.id),
        numericId: c.id,
        label: clientAttrs(c).full_name,
      })),
    [clientsPayload],
  );

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

  const handleSubmit = () => {
    const cli = (clientsPayload as Client[]).find((c) => String(c.documentId ?? c.id) === clientRouteId);
    if (!cli) return;
    createMutation.mutate(
      {
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
        status: sendOnCreate ? "enviado" : "rascunho",
      },
      {
        onSuccess: (q) => {
          const routeId = q.documentId ?? String(q.id);
          router.push(`/orcamentos/${routeId}`);
        },
      },
    );
  };

  const canSubmit = !!clientRouteId && !!pricing && !createMutation.isPending;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <StitchPageHeader
        title="Novo orçamento"
        description="Configure medidas, acabamentos e opcionais. O total é calculado automaticamente."
        actions={
          <Button variant="outline" asChild>
            <Link href="/orcamentos">Voltar</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <StitchSectionCard title="Cliente e modelo">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Cliente</Label>
                <Select value={clientRouteId || undefined} onValueChange={setClientRouteId}>
                  <SelectTrigger disabled={loadingClients}>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Modelo base</Label>
                <Select value={bodyModelId || undefined} onValueChange={setBodyModelId}>
                  <SelectTrigger disabled={loadingModels}>
                    <SelectValue placeholder="Opcional · catálogo de modelos" />
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
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Dimensões (m)">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Comprimento</Label>
                <Input value={lengthM} onChange={(e) => setLengthM(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Largura</Label>
                <Input value={widthM} onChange={(e) => setWidthM(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Altura</Label>
                <Input value={heightM} onChange={(e) => setHeightM(e.target.value)} inputMode="decimal" />
              </div>
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Configuração">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tampa</Label>
                <Select value={coverStyle} onValueChange={(v) => setCoverStyle(v as BodyCoverStyle)}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Assoalho</Label>
                <Select value={floorType} onValueChange={(v) => setFloorType(v as BodyFloorType)}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Acabamento</Label>
                <Select value={finishType} onValueChange={(v) => setFinishType(v as BodyFinishType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FINISH_TYPE_LABELS) as BodyFinishType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {FINISH_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Opcionais">
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTION_KEYS.map((key) => {
                const opt = DEFAULT_QUOTE_PRICING.options[key];
                const checked = options.includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40"
                  >
                    <span className="text-sm">
                      {opt.label}
                      <span className="block text-xs text-muted-foreground">{formatBRL(opt.price)}</span>
                    </span>
                    <Switch checked={checked} onCheckedChange={() => toggleOption(key)} />
                  </label>
                );
              })}
            </div>
          </StitchSectionCard>

          <StitchSectionCard title="Comercial">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Prazo de entrega (dias)</Label>
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
              <label className="flex items-center gap-2 sm:col-span-2 text-sm">
                <Switch checked={sendOnCreate} onCheckedChange={setSendOnCreate} />
                Marcar como enviado ao criar
              </label>
            </div>
          </StitchSectionCard>
        </div>

        <aside className="lg:sticky lg:top-4 h-fit">
          <div className="rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-primary px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
                Total estimado
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary-foreground">
                {pricing ? formatBRL(pricing.total) : formatBRL(0)}
              </p>
              {pricing ? (
                <p className="mt-1 text-xs text-primary-foreground/80">
                  Margem estimada: {pricing.marginPercent.toFixed(1)}%
                </p>
              ) : null}
            </div>

            <div className="bg-card p-6">
              {!pricing && calcMutation.isPending ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando…
                </div>
              ) : pricing ? (
                <div className="space-y-4">
                  <div className="max-h-48 overflow-y-auto space-y-1 text-xs text-muted-foreground">
                    {pricing.items.map((item, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span className="truncate">{item.description}</span>
                        <span className="shrink-0 tabular-nums">{formatBRL(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{formatBRL(pricing.subtotal)}</span>
                    </div>
                    {pricing.discount > 0 ? (
                      <div className="flex justify-between text-[#b91c1c]">
                        <span>Desconto</span>
                        <span className="tabular-nums">- {formatBRL(pricing.discount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between pt-1 text-base font-semibold text-primary">
                      <span>Total</span>
                      <span className="tabular-nums">{formatBRL(pricing.total)}</span>
                    </div>
                  </div>
                  <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      "Criar orçamento"
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Preencha as medidas para calcular.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
