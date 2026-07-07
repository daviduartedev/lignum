import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

interface StitchSectionCardProps {
  title?: string;
  /** Conteúdo extra na linha do título (ex.: barra de busca, botões). */
  headerEnd?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Quando true, o corpo não recebe padding — ideal para tabelas edge-to-edge. */
  noPadding?: boolean;
}

/** Card com cabeçalho de secção (ref. Stitch 04/05). */
export function StitchSectionCard({
  title,
  headerEnd,
  children,
  footer,
  className,
  noPadding = false,
}: StitchSectionCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm overflow-hidden", className)}>
      {(title || headerEnd) ? (
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-secondary/50">
          {title ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-4 w-1 rounded-full bg-primary shrink-0" aria-hidden />
              <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
            </div>
          ) : null}
          {headerEnd ? <div className="flex items-center gap-3 shrink-0">{headerEnd}</div> : null}
        </div>
      ) : null}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
      {footer ? (
        <div className="px-6 py-4 bg-muted/40 border-t border-border flex justify-end gap-3">{footer}</div>
      ) : null}
    </div>
  );
}
