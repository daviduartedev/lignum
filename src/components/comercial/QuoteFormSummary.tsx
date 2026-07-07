"use client";

import { Info, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/pdf/format";
import type { PricingResult } from "@/lib/quotes/pricingEngine";
import { cn } from "@/components/ui/utils";

type QuoteFormSummaryProps = {
  modelName: string;
  pricing: PricingResult | undefined;
  isCalculating: boolean;
  deliveryDays: number;
};

function groupItems(pricing: PricingResult) {
  const structure = pricing.items.filter((i) => i.itemType === "material");
  const options = pricing.items.filter((i) => i.itemType === "option");
  const laborTotal = pricing.items
    .filter((i) => i.itemType === "labor")
    .reduce((s, i) => s + i.totalPrice, 0);
  const partsSubtotal = [...structure, ...options].reduce((s, i) => s + i.totalPrice, 0);
  return { structure, options, laborTotal, partsSubtotal };
}

export function QuoteFormSummary({
  modelName,
  pricing,
  isCalculating,
  deliveryDays,
}: QuoteFormSummaryProps) {
  const groups = pricing ? groupItems(pricing) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-primary px-6 py-5 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Resumo da Configuração</p>
        <h3 className="mt-1 text-xl font-bold leading-tight">{modelName}</h3>
      </div>

      <div className="flex flex-col gap-4 p-6">
        {isCalculating && !pricing ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando…
          </div>
        ) : null}

        {!pricing && !isCalculating ? (
          <p className="py-6 text-sm text-muted-foreground">Preencha as medidas para ver o resumo.</p>
        ) : null}

        {pricing && groups ? (
          <>
            {groups.structure.length > 0 ? (
              <div className="border-b border-border pb-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Estrutura Base</p>
                <ul className="space-y-1">
                  {groups.structure.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{item.description}</span>
                      <span className="shrink-0 tabular-nums font-medium">{formatBRL(item.totalPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {groups.options.length > 0 ? (
              <div className="border-b border-border pb-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Acessórios Selecionados</p>
                <ul className="space-y-1">
                  {groups.options.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{item.description}</span>
                      <span className="shrink-0 tabular-nums font-medium">{formatBRL(item.totalPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pt-1">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Subtotal</span>
                <span className="tabular-nums font-medium">{formatBRL(groups.partsSubtotal)}</span>
              </div>
              <div className="mb-4 flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Mão de Obra (Est.)</span>
                <span className="tabular-nums font-medium">{formatBRL(groups.laborTotal)}</span>
              </div>

              {pricing.discount > 0 ? (
                <div className="mb-3 flex justify-between text-sm text-[#b91c1c]">
                  <span>Desconto</span>
                  <span className="tabular-nums">- {formatBRL(pricing.discount)}</span>
                </div>
              ) : null}

              <div
                className={cn(
                  "flex flex-col items-end gap-1 rounded-lg border border-primary/10 bg-secondary/30 p-4 transition-transform duration-300",
                  isCalculating && "opacity-80",
                )}
              >
                <span className="text-xs font-bold uppercase tracking-tight text-primary">Valor Total Estimado</span>
                <span className="text-[2.5rem] font-extrabold leading-none tabular-nums text-primary">
                  {formatBRL(pricing.total)}
                </span>
                <span className="mt-1 text-[11px] italic text-muted-foreground">
                  *Sujeito a alteração de impostos na NF
                </span>
              </div>
            </div>

            <div className="mt-2 flex gap-3 rounded-r-lg border-l-4 border-secondary bg-secondary/15 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Prazo de produção estimado em{" "}
                <strong className="font-semibold text-foreground">{deliveryDays} dias úteis</strong> após a
                aprovação e assinatura do contrato de fabricação.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
