"use client";

import { FileText, Loader2, Save, Send, Trash2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

type QuoteFormFooterProps = {
  canSubmit: boolean;
  isPending: boolean;
  onDiscard: () => void;
  onSaveDraft: () => void;
  onGeneratePdf: () => void;
  onSend: () => void;
};

const discardBtn =
  "inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:bg-muted/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

const outlineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

export function QuoteFormFooter({
  canSubmit,
  isPending,
  onDiscard,
  onSaveDraft,
  onGeneratePdf,
  onSend,
}: QuoteFormFooterProps) {
  const disabled = !canSubmit || isPending;

  return (
    <footer className="shrink-0 border-t border-border bg-card px-8 py-4 print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className={discardBtn} onClick={onDiscard} disabled={isPending}>
          <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
          Descartar
        </button>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-4">
          <button type="button" className={outlineBtn} disabled={disabled} onClick={onSaveDraft}>
            {isPending ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Save className="h-5 w-5 shrink-0" aria-hidden />
            )}
            Salvar Rascunho
          </button>
          <button type="button" className={outlineBtn} disabled={disabled} onClick={onGeneratePdf}>
            <FileText className="h-5 w-5 shrink-0" aria-hidden />
            Gerar PDF
          </button>
          <button type="button" className={cn(primaryBtn, "w-full sm:w-auto")} disabled={disabled} onClick={onSend}>
            {isPending ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Send className="h-5 w-5 shrink-0" aria-hidden />
            )}
            Enviar ao Cliente
          </button>
        </div>
      </div>
    </footer>
  );
}
